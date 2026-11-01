import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { validateMcpUrl, sanitizeMcpOutput } from "./security";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolDefinition,
  McpToolsListResult,
  McpToolCallResult,
} from "./types";

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
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid MCP URL");
    }

    this.url = options.url.replace(/\/+$/, "");
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
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...this.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

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
    } catch {
      // Some simple HTTP MCP servers don't require initialize, proceed gracefully
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

    for (const mcpTool of tools) {
      const toolName = mcpTool.name;
      const description = mcpTool.description || `Execute ${toolName} via MCP.`;

      // Build safe fallback schema for any arguments
      const inputSchema = z.record(z.string(), z.unknown()).describe("Arguments for the MCP tool");

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
