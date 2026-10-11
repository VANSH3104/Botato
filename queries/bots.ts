import { auth } from "@clerk/nextjs/server"
import { desc, eq, and } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { bots, type Bot } from "@/lib/db/schema"

/**
 * Retrieves all bots belonging to the currently authenticated Clerk user.
 * Scoped to Clerk's userId via auth().
 */
export async function getBots(userIdOverride?: string): Promise<Bot[]> {
  const { userId } = await auth()
  const targetUserId = userIdOverride ?? userId

  if (!targetUserId) {
    return []
  }

  return db
    .select()
    .from(bots)
    .where(eq(bots.userId, targetUserId))
    .orderBy(desc(bots.createdAt))
}

/**
 * Retrieves a single bot by ID for the currently authenticated user.
 */
export async function getBotById(botId: string): Promise<Bot | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const [row] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
    .limit(1)

  return row ?? null
}

export const getUserBots = getBots

export type BotWithLastChat = Bot & {
  lastChat?: string | null
}
