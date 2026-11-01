import { auth } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { bots, groupChats, groupChatMembers, type Bot } from "@/lib/db/schema"

export interface Chat {
  id: string
  name: string
  avatar: string
  createdAt: Date
  bot: Bot
  bots: Bot[]
  isGroup?: boolean
}

/**
 * Retrieves a chat by its ID, scoped to Clerk's authenticated userId.
 * Checks for group chats first, then individual bot chats.
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // 1. Check if chatId is a group chat
  const [group] = await db
    .select()
    .from(groupChats)
    .where(and(eq(groupChats.id, chatId), eq(groupChats.userId, userId)))
    .limit(1)

  if (group) {
    const memberRows = await db
      .select({ botId: groupChatMembers.botId })
      .from(groupChatMembers)
      .where(eq(groupChatMembers.groupChatId, group.id))

    const botIds = memberRows.map((r) => r.botId)
    let memberBots: Bot[] = []

    if (botIds.length > 0) {
      memberBots = await db
        .select()
        .from(bots)
        .where(inArray(bots.id, botIds))
    }

    const firstBot = memberBots[0] ?? {
      id: "botato",
      userId,
      name: group.name,
      avatar: "group",
      job: "Group Assistant",
      instructions: "",
      sandboxId: null,
      createdAt: group.createdAt,
    }

    return {
      id: group.id,
      name: group.name,
      avatar: memberBots.map((b) => b.avatar).join(",") || "group",
      createdAt: group.createdAt,
      bot: firstBot,
      bots: memberBots,
      isGroup: true,
    }
  }

  // 2. Individual bot chat
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
    isGroup: false,
  }
}
