import { db } from "@/lib/db/client";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { defaultSandboxClient } from "@/lib/sandbox/client";

export async function isSandboxAvailable(): Promise<boolean> {
  const url = process.env.SANDBOX_URL || "http://127.0.0.1:4000";
  // In cloud/production runners, localhost:4000 does not exist
  if (
    process.env.NODE_ENV === "production" &&
    (url.includes("127.0.0.1") || url.includes("localhost"))
  ) {
    return false;
  }
  try {
    const health = await defaultSandboxClient.checkHealth();
    return !!health;
  } catch {
    return false;
  }
}

export async function ensureBotSandbox(bot: {
  id: string;
  name: string;
  sandboxId?: string | null;
}): Promise<string | null> {
  // If sandbox server is not online or available in this environment, skip immediately
  if (!(await isSandboxAvailable())) {
    return null;
  }

  if (bot.sandboxId) {
    try {
      try {
        await defaultSandboxClient.readFile(bot.sandboxId, "MEMORY.md");
        return bot.sandboxId;
      } catch {
        // MEMORY.md does not exist yet in existing sandbox, create it
        await defaultSandboxClient.writeFile(
          bot.sandboxId,
          "MEMORY.md",
          `# Memory for ${bot.name}\n\n- Initialized persistent memory.\n`
        );
        return bot.sandboxId;
      }
    } catch (err) {
      console.warn(`Sandbox ${bot.sandboxId} check failed, will attempt recreating:`, err);
    }
  }

  // Create persistent sandbox and initialize blank MEMORY.md
  try {
    const sandbox = await defaultSandboxClient.createSandbox({ persistent: true });
    await defaultSandboxClient.writeFile(
      sandbox.id,
      "MEMORY.md",
      `# Memory for ${bot.name}\n\n- Initialized persistent memory.\n`
    );
    await db
      .update(bots)
      .set({ sandboxId: sandbox.id })
      .where(eq(bots.id, bot.id));
    return sandbox.id;
  } catch (err) {
    console.error(`Failed to ensure sandbox for bot ${bot.id}:`, err);
    return null;
  }
}

export async function readBotMemory(
  botId: string,
  sandboxId?: string | null
): Promise<string | null> {
  // 1. If sandbox is available, try reading MEMORY.md
  if (sandboxId && (await isSandboxAvailable())) {
    try {
      const res = await defaultSandboxClient.readFile(sandboxId, "MEMORY.md");
      if (res.content) {
        return res.content;
      }
    } catch {
      // Fall through to database
    }
  }

  // 2. Read from database
  try {
    const [row] = await db
      .select({ memory: bots.memory })
      .from(bots)
      .where(eq(bots.id, botId))
      .limit(1);
    return row?.memory || null;
  } catch (err) {
    console.error(`Failed to read memory from DB for bot ${botId}:`, err);
    return null;
  }
}

export async function saveBotMemory(
  botId: string,
  content: string,
  sandboxId?: string | null
): Promise<void> {
  // 1. Always persist to database
  try {
    await db
      .update(bots)
      .set({ memory: content })
      .where(eq(bots.id, botId));
  } catch (err) {
    console.error(`Failed to save memory to DB for bot ${botId}:`, err);
  }

  // 2. If sandbox is available, sync to MEMORY.md
  if (sandboxId && (await isSandboxAvailable())) {
    try {
      await defaultSandboxClient.writeFile(sandboxId, "MEMORY.md", content);
    } catch (err) {
      console.warn(`Failed to sync MEMORY.md for sandbox ${sandboxId}:`, err);
    }
  }
}
