import { jsonSchema, tool, type ToolSet } from "ai";
import { z } from "zod";
import { validateMcpUrl, sanitizeMcpOutput } from "./security";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolDefinition,
  McpToolsListResult,
  McpToolCallResult,
} from "./types";

// Patterns for low-value administrative endpoints that add token bloat
const LOW_PRIORITY_TOOL_PATTERNS = [
  /get-self/i,
  /get-users?/i,
  /retrieve-a-comment/i,
  /create-a-comment/i,
  /data-source-templates/i,
  /create-a-data-source/i,
  /retrieve-a-data-source/i,
  /update-a-data-source/i,
  /move-page/i,
];

function sanitizeSchemaForLlm(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { type: "object", properties: {} };
  }

  function cleanNode(node: unknown): unknown {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(cleanNode);

    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "$defs" || k === "definitions" || k === "$schema") continue;
      if (k === "$ref") {
        res["type"] = "object";
        continue;
      }
      if (typeof v === "object" && v !== null && "$ref" in (v as Record<string, unknown>)) {
        res[k] = { type: "object" };
      } else {
        res[k] = cleanNode(v);
      }
    }

    if (typeof res.description === "string" && res.description.length > 150) {
      res.description = res.description.slice(0, 150) + "...";
    }

    return res;
  }

  const result = cleanNode(raw) as Record<string, unknown>;
  if (!result.type) {
    result.type = "object";
  }
  return result;
}

export class McpClient {
  private url: string;
  private headers: Record<string, string>;
  private timeoutMs: number;

  constructor(options: {
    url: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
  }) {
    const validation = validateMcpUrl(options.url);
    if (!validation.valid || !validation.url) {
      throw new Error(validation.error || "Invalid MCP URL");
    }

    this.url = validation.url.toString().replace(/\/+$/, "");
    this.headers = options.headers || {};
    this.timeoutMs = options.timeoutMs || 15000;
  }

  private async rpcCall<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1000000),
      method,
      params: params || {},
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let res: Response;
      try {
      res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...this.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      const err = fetchError as {
        code?: string;
        cause?: { code?: string; message?: string; errors?: Array<{ code?: string; message?: string }> };
        message?: string;
      };

      const causeCode =
        err.code ||
        err.cause?.code ||
        err.cause?.errors?.[0]?.code;

      if (causeCode === "ECONNREFUSED") {
        throw new Error(
          `Connection refused at ${this.url}. No server is listening at this address or port. Please ensure your MCP server or bridge process is running.`
        );
      }
      if (causeCode === "ENOTFOUND") {
        throw new Error(
          `Host not found for ${this.url}. Please check that the domain name is valid and reachable.`
        );
      }
      if (causeCode === "ETIMEDOUT" || err.message?.includes("aborted")) {
        throw new Error(
          `Connection timed out (${this.timeoutMs}ms) reaching ${this.url}. The server took too long to respond.`
        );
      }

      throw new Error(
        `Failed to reach MCP server at ${this.url}: ${err.cause?.message || err.message || "Network error"}`
      );
    }

      if (!res.ok) {
        let detail = "";
        try {
          const errBody = (await res.json()) as { error?: { message?: string } | string; message?: string };
          if (typeof errBody?.error === "object" && errBody.error?.message) {
            detail = errBody.error.message;
          } else if (typeof errBody?.message === "string") {
            detail = errBody.message;
          } else if (typeof errBody?.error === "string") {
            detail = errBody.error;
          }
        } catch {
          // ignore json parse failure
        }
        const extra = detail ? ` - ${detail}` : "";
        throw new Error(`MCP request failed: HTTP ${res.status} ${res.statusText}${extra}`);
      }

      const json = (await res.json()) as JsonRpcResponse<T>;

      if (json.error) {
        throw new Error(`MCP Error (${json.error.code}): ${json.error.message}`);
      }

      return json.result as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async initialize(): Promise<{ serverName: string; version?: string }> {
    try {
      const result = await this.rpcCall<{
        serverInfo?: { name: string; version?: string };
        capabilities?: Record<string, unknown>;
      }>("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "Botato", version: "1.0.0" },
      });
      return {
        serverName: result.serverInfo?.name || "MCP Server",
        version: result.serverInfo?.version,
      };
    } catch (error) {
      // Propagate network and HTTP errors
      const message = error instanceof Error ? error.message : "";
      if (
        message.includes("Connection refused") ||
        message.includes("Failed to reach") ||
        message.includes("timed out") ||
        message.includes("HTTP 401") ||
        message.includes("HTTP 403") ||
        message.includes("HTTP 4") ||
        message.includes("HTTP 5")
      ) {
        throw error;
      }
      // If the server doesn't implement or require 'initialize', proceed gracefully
      return { serverName: "MCP Server" };
    }
  }

  public async listTools(): Promise<McpToolDefinition[]> {
    const result = await this.rpcCall<McpToolsListResult>("tools/list");
    return result?.tools || [];
  }

  public async callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<{ success: boolean; output: string }> {
    try {
      const result = await this.rpcCall<McpToolCallResult>("tools/call", {
        name,
        arguments: args,
      });

      let textOutput = "";
      if (result?.content && Array.isArray(result.content)) {
        textOutput = result.content
          .filter((c) => c.type === "text" && typeof c.text === "string")
          .map((c) => c.text!)
          .join("\n");
      } else if (typeof result === "string") {
        textOutput = result;
      } else {
        textOutput = JSON.stringify(result, null, 2);
      }

      const sanitized = sanitizeMcpOutput(textOutput);
      return {
        success: !result?.isError,
        output: sanitized || "(Tool completed with empty output)",
      };
    } catch (error) {
      return {
        success: false,
        output: `Tool execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Converts the server's discovered MCP tools into standard AI SDK tools
   * ready to be injected into chat agent invocations.
   */
  public async getAiSdkTools(): Promise<ToolSet> {
    const tools = await this.listTools();
    const sdkTools: ToolSet = {};

    // Filter out low-value admin noise if the server exports an excessive number of tools
    const targetTools =
      tools.length > 12
        ? tools.filter((t) => !LOW_PRIORITY_TOOL_PATTERNS.some((p) => p.test(t.name)))
        : tools;

    for (const mcpTool of targetTools) {
      const toolName = mcpTool.name;
      const description = mcpTool.description || `Execute ${toolName} via MCP.`;

      const cleanedSchema = sanitizeSchemaForLlm(mcpTool.inputSchema);
      const inputSchema =
        cleanedSchema && Object.keys(cleanedSchema).length > 0
          ? jsonSchema<Record<string, unknown>>(cleanedSchema as Parameters<typeof jsonSchema>[0])
          : z.record(z.string(), z.unknown());

      sdkTools[`mcp_${toolName}`] = tool({
        description: `[MCP Tool] ${description}`,
        inputSchema,
        execute: async (args: Record<string, unknown>) => {
          return this.callTool(toolName, args);
        },
      });
    }

    return sdkTools;
  }
}
