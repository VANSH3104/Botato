import { db } from "@/lib/db/client";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { defaultSandboxClient } from "@/lib/sandbox/client";

export async function ensureBotSandbox(bot: {
  id: string;
  name: string;
  sandboxId?: string | null;
}): Promise<string | null> {
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

export async function readBotMemory(sandboxId: string): Promise<string | null> {
  try {
    const res = await defaultSandboxClient.readFile(sandboxId, "MEMORY.md");
    return res.content;
  } catch {
    return null;
  }
}
