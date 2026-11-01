import { db } from "@/lib/db/client";
import { mcpServers } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { McpClient } from "./client";
import type { ToolSet } from "ai";

/**
 * Resolves all active MCP tools for a given bot or user.
 * Catches connection timeouts and network errors gracefully so that one failing
 * MCP server never degrades the core conversation experience.
 */
export async function getActiveMcpTools(options: {
  userId: string;
  botId?: string;
}): Promise<ToolSet> {
  const { userId, botId } = options;

  try {
    const queryConditions = botId
      ? and(
          eq(mcpServers.userId, userId),
          eq(mcpServers.isEnabled, true),
          or(isNull(mcpServers.botId), eq(mcpServers.botId, botId))
        )
      : and(eq(mcpServers.userId, userId), eq(mcpServers.isEnabled, true));

    const activeServers = await db.select().from(mcpServers).where(queryConditions);

    if (activeServers.length === 0) {
      return {};
    }

    const combinedTools: ToolSet = {};

    await Promise.allSettled(
      activeServers.map(async (server) => {
        let headers: Record<string, string> = {};
        try {
          if (server.headersJson) {
            headers = JSON.parse(server.headersJson);
          }
        } catch {
          // ignore invalid json
        }

        try {
          const client = new McpClient({
            url: server.url,
            headers,
            timeoutMs: 6000,
          });
          const serverTools = await client.getAiSdkTools();
          Object.assign(combinedTools, serverTools);
        } catch (err) {
          console.warn(`Failed to resolve tools for MCP server "${server.name}" (${server.url}):`, err);
        }
      })
    );

    return combinedTools;
  } catch (error) {
    console.error("Failed to load active MCP tools:", error);
    return {};
  }
}
