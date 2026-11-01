"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { mcpServers, createMcpServerInputSchema, type CreateMcpServerInput } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { McpClient } from "@/lib/mcp/client";
import { validateMcpUrl, maskSensitiveHeaders } from "@/lib/mcp/security";
import { revalidatePath } from "next/cache";

export async function listMcpServers(botId?: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized", servers: [] };
  }

  try {
    const queryConditions = botId
      ? and(
          eq(mcpServers.userId, userId),
          or(isNull(mcpServers.botId), eq(mcpServers.botId, botId))
        )
      : eq(mcpServers.userId, userId);

    const rows = await db.select().from(mcpServers).where(queryConditions);

    const safeServers = rows.map((s) => {
      let headers: Record<string, string> = {};
      try {
        if (s.headersJson) {
          headers = JSON.parse(s.headersJson);
        }
      } catch {
        // ignore parse error
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        url: s.url,
        transport: s.transport,
        botId: s.botId,
        isEnabled: s.isEnabled,
        maskedHeaders: maskSensitiveHeaders(headers),
        createdAt: s.createdAt,
      };
    });

    return { success: true, servers: safeServers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load MCP servers",
      servers: [],
    };
  }
}

export async function createMcpServer(rawInput: CreateMcpServerInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createMcpServerInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { name, description, url, botId, headers, isEnabled } = parsed.data;

  // Strict SSRF and protocol check
  const validation = validateMcpUrl(url);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid and unsafe URL" };
  }

  // Test connection to verify server responds
  try {
    const client = new McpClient({ url, headers, timeoutMs: 5000 });
    await client.initialize();
  } catch (error) {
    return {
      success: false,
      error: `Could not connect to MCP server: ${error instanceof Error ? error.message : "Network error"}. Please check the URL and credentials.`,
    };
  }

  try {
    const [created] = await db
      .insert(mcpServers)
      .values({
        userId,
        botId: botId || null,
        name,
        description: description || null,
        url,
        headersJson: headers ? JSON.stringify(headers) : null,
        isEnabled: isEnabled ?? true,
      })
      .returning();

    revalidatePath("/");
    return { success: true, server: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create MCP server",
    };
  }
}

export async function testMcpServer(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized", tools: [] };
  }

  const [server] = await db
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)))
    .limit(1);

  if (!server) {
    return { success: false, error: "MCP server not found", tools: [] };
  }

  let headers: Record<string, string> = {};
  try {
    if (server.headersJson) {
      headers = JSON.parse(server.headersJson);
    }
  } catch {
    // ignore
  }

  try {
    const client = new McpClient({ url: server.url, headers, timeoutMs: 8000 });
    const info = await client.initialize();
    const tools = await client.listTools();

    return {
      success: true,
      serverInfo: info,
      toolCount: tools.length,
      tools: tools.map((t) => ({ name: t.name, description: t.description })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Test connection failed",
      tools: [],
    };
  }
}

export async function toggleMcpServer(id: string, isEnabled: boolean) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .update(mcpServers)
    .set({ isEnabled, updatedAt: new Date() })
    .where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)));

  revalidatePath("/");
  return { success: true };
}

export async function deleteMcpServer(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .delete(mcpServers)
    .where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)));

  revalidatePath("/");
  return { success: true };
}
