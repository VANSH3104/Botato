import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { bots, type Bot } from "@/lib/db/schema"

export interface Chat {
  id: string
  name: string
  avatar: string
  createdAt: Date
  bot: Bot
  bots: Bot[]
}

/**
 * Retrieves a chat by its ID, scoped to Clerk's authenticated userId.
 * Currently maps to the user's bot.
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const [row] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, chatId), eq(bots.userId, userId)))
    .limit(1)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.createdAt,
    bot: row,
    bots: [row],
  }
}
