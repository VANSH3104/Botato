"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { bots } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureBotSandbox } from "@/lib/sandbox/memory";

export async function getBotSandbox(botId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
    .limit(1);

  if (!bot) {
    return { success: false, error: "Bot not found" };
  }

  const sandboxId = await ensureBotSandbox({
    id: bot.id,
    name: bot.name,
    sandboxId: bot.sandboxId,
  });

  return { success: true, sandboxId, botName: bot.name };
}
