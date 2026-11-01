"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { formatChatDate, extractSnippetFromMessage } from "@/lib/utils"
import type { BotWithLastChat } from "@/queries/bots"

export interface SidebarChatListProps {
  bots: BotWithLastChat[]
}

export function SidebarChatList({ bots }: SidebarChatListProps) {
  const pathname = usePathname()

  const [liveUpdates, setLiveUpdates] = React.useState<
    Record<string, { lastChat?: string; lastChatAt?: string }>
  >(() => {
    const updates: Record<string, { lastChat?: string; lastChatAt?: string }> = {}
    if (typeof window !== "undefined") {
      for (const b of bots) {
        try {
          const stored = window.localStorage.getItem(`botato_chat_${b.id}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const lastMsg = parsed[parsed.length - 1]
              const snippet = extractSnippetFromMessage(lastMsg)
              const rawTime =
                lastMsg && typeof lastMsg === "object" && "createdAt" in lastMsg
                  ? (lastMsg as { createdAt?: Date | string }).createdAt
                  : null
              const dateStr =
                rawTime instanceof Date
                  ? rawTime.toISOString()
                  : typeof rawTime === "string"
                  ? rawTime
                  : undefined
              if (snippet || dateStr) {
                updates[b.id] = { lastChat: snippet || undefined, lastChatAt: dateStr }
              }
            }
          }
        } catch {
          // ignore storage parse errors
        }
      }
    }
    return updates
  })

  // Listen for live chat updates across components
  React.useEffect(() => {
    const handleChatUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ chatId: string; lastChat: string; lastChatAt?: string }>
      if (customEvent.detail?.chatId) {
        setLiveUpdates((prev) => ({
          ...prev,
          [customEvent.detail.chatId]: {
            lastChat: customEvent.detail.lastChat ?? prev[customEvent.detail.chatId]?.lastChat,
            lastChatAt: customEvent.detail.lastChatAt ?? prev[customEvent.detail.chatId]?.lastChatAt,
          },
        }))
      }
    }

    window.addEventListener("botato_chat_updated", handleChatUpdated)
    return () => window.removeEventListener("botato_chat_updated", handleChatUpdated)
  }, [])

  const sortedBots = React.useMemo(() => {
    return [...bots].sort((a, b) => {
      const dateA = liveUpdates[a.id]?.lastChatAt ?? a.lastChatAt ?? a.createdAt
      const dateB = liveUpdates[b.id]?.lastChatAt ?? b.lastChatAt ?? b.createdAt
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [bots, liveUpdates])

  if (sortedBots.length === 0) {
    return (
      <div className="px-2 py-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        No chats yet
      </div>
    )
  }

  return (
    <SidebarMenu className="gap-1">
      {sortedBots.map((bot) => {
        const isActive =
          pathname === `/chats/${bot.id}` || pathname.startsWith(`/chats/${bot.id}/`)
        const lastMessage = liveUpdates[bot.id]?.lastChat ?? bot.lastChat
        const displayDate =
          liveUpdates[bot.id]?.lastChatAt ?? bot.lastChatAt ?? (lastMessage ? bot.createdAt : null)

        return (
          <SidebarMenuItem key={bot.id}>
            <SidebarMenuButton
              size="lg"
              isActive={isActive}
              aria-current={isActive ? "page" : undefined}
              render={<Link href={`/chats/${bot.id}`} />}
              className="h-auto py-2 px-2 gap-2.5 items-center group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
              tooltip={bot.name}
            >
              {bot.isGroup ? (
                <GroupChatAvatar
                  bots={bot.bots}
                  seed={bot.avatar}
                  className="size-8 shrink-0 rounded-md group-data-[collapsible=icon]:size-6"
                />
              ) : (
                <ChatAvatar
                  seed={bot.avatar}
                  className="size-8 shrink-0 rounded-md group-data-[collapsible=icon]:size-6"
                />
              )}
              <div className="flex flex-1 flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {bot.name}
                  </span>
                  {displayDate ? (
                    <span className="shrink-0 text-xs text-muted-foreground font-normal">
                      {formatChatDate(displayDate)}
                    </span>
                  ) : null}
                </div>
                {lastMessage?.trim() ? (
                  <span className="truncate text-xs text-muted-foreground mt-0.5 leading-snug">
                    {lastMessage.trim()}
                  </span>
                ) : null}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
