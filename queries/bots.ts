import { auth } from "@clerk/nextjs/server"
import { desc, eq, and } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { bots, groupChats, groupChatMembers, type Bot } from "@/lib/db/schema"
import { defaultStorage } from "@trigger.dev/sdk/ai"
import { extractSnippetFromMessage } from "@/lib/utils"

export type BotWithLastChat = Bot & {
  lastChat?: string | null
  lastChatAt?: string | null
  isGroup?: boolean
  bots?: Bot[]
}

/**
 * Retrieves all bots and group chats belonging to the currently authenticated Clerk user,
 * along with their latest conversation snippet.
 */
export async function getBots(userIdOverride?: string): Promise<BotWithLastChat[]> {
  const { userId } = await auth()
  const targetUserId = userIdOverride ?? userId

  if (!targetUserId) {
    return []
  }

  const [botRows, groupRows] = await Promise.all([
    db
      .select()
      .from(bots)
      .where(eq(bots.userId, targetUserId))
      .orderBy(desc(bots.createdAt)),
    db
      .select()
      .from(groupChats)
      .where(eq(groupChats.userId, targetUserId))
      .orderBy(desc(groupChats.createdAt)),
  ])

  // Map of bot ID to Bot
  const botMap = new Map<string, Bot>()
  for (const b of botRows) {
    botMap.set(b.id, b)
  }

  // Fetch members for groups if any exist
  const groupMembersMap = new Map<string, Bot[]>()
  if (groupRows.length > 0) {
    const allMembers = await db.select().from(groupChatMembers)
    for (const m of allMembers) {
      const b = botMap.get(m.botId)
      if (b) {
        const list = groupMembersMap.get(m.groupChatId) || []
        list.push(b)
        groupMembersMap.set(m.groupChatId, list)
      }
    }
  }

  // Form group items as BotWithLastChat objects
  const groupItems: BotWithLastChat[] = groupRows.map((g) => {
    const members = groupMembersMap.get(g.id) || []
    return {
      id: g.id,
      userId: g.userId,
      name: g.name,
      avatar: members.map((m) => m.avatar).join(",") || "group",
      job: "Group Chat",
      instructions: null,
      sandboxId: null,
      createdAt: g.createdAt,
      isGroup: true,
      bots: members,
    }
  })

  const botItems: BotWithLastChat[] = botRows.map((b) => ({
    ...b,
    isGroup: false,
    bots: [b],
  }))

  const combined = [...groupItems, ...botItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Fetch last conversation snippet for each item concurrently
  const chatsWithLastChat = await Promise.all(
    combined.map(async (chatRow) => {
      try {
        const transcriptPromise = defaultStorage.load({
          chatId: chatRow.id,
          clientData: undefined,
        })
        const timeoutPromise = new Promise<{ messages?: unknown[] }>((resolve) =>
          setTimeout(() => resolve({ messages: [] }), 2500)
        )
        const transcript = await Promise.race([transcriptPromise, timeoutPromise])
        const messages = transcript?.messages || []
        if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1]
          const snippet = extractSnippetFromMessage(lastMsg)
          const lastMsgTime =
            lastMsg && typeof lastMsg === "object" && "createdAt" in lastMsg
              ? (lastMsg as { createdAt?: Date | string }).createdAt
              : null
          return {
            ...chatRow,
            lastChat: snippet,
            lastChatAt: lastMsgTime ? new Date(lastMsgTime).toISOString() : null,
          }
        }
      } catch (err) {
        console.warn(`Could not load transcript for chat ${chatRow.id}:`, err)
      }

      return {
        ...chatRow,
        lastChat: null,
        lastChatAt: null,
      }
    })
  )

  chatsWithLastChat.sort((a, b) => {
    const timeA = new Date(a.lastChatAt ?? a.createdAt).getTime()
    const timeB = new Date(b.lastChatAt ?? b.createdAt).getTime()
    return timeB - timeA
  })

  return chatsWithLastChat
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
