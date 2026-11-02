import { db } from "@/lib/db/client";
import { mcpServers } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { McpClient } from "./client";
import type { ToolSet } from "ai";

// In-memory cache for discovered tools to avoid cold-start roundtrips on every chat turn
const toolsCache = new Map<string, { tools: ToolSet; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolves all active MCP tools for a given bot or user.
 * Caches discovered tool schemas in memory and uses a resilient timeout
 * to handle cloud container cold-starts.
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
        const cacheKey = `${server.id}_${server.updatedAt?.getTime() || 0}`;
        const cached = toolsCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          Object.assign(combinedTools, cached.tools);
          return;
        }

        let headers: Record<string, string> = {};
        try {
          if (server.headersJson) {
            headers = JSON.parse(server.headersJson);
          }
        } catch {
          // ignore invalid json
        }

        try {
          // Allow up to 25s for serverless container wakeups on cold start
          const client = new McpClient({
            url: server.url,
            headers,
            timeoutMs: 25000,
          });
          const serverTools = await client.getAiSdkTools();
          toolsCache.set(cacheKey, {
            tools: serverTools,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
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
