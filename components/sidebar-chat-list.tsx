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
import { formatChatDate } from "@/lib/utils"
import type { Bot } from "@/lib/db/schema"

export interface SidebarChatListProps {
  bots: (Bot & { lastChat?: string | null })[]
}

export function SidebarChatList({ bots }: SidebarChatListProps) {
  const pathname = usePathname()

  if (bots.length === 0) {
    return (
      <div className="px-2 py-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        No chats yet
      </div>
    )
  }

  return (
    <SidebarMenu className="gap-1">
      {bots.map((bot) => {
        const isActive =
          pathname === `/chats/${bot.id}` || pathname.startsWith(`/chats/${bot.id}/`)

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
              <ChatAvatar
                seed={bot.avatar}
                className="size-8 shrink-0 rounded-md group-data-[collapsible=icon]:size-6"
              />
              <div className="flex flex-1 flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {bot.name}
                  </span>
                  {bot.createdAt ? (
                    <span className="shrink-0 text-xs text-muted-foreground font-normal">
                      {formatChatDate(bot.createdAt)}
                    </span>
                  ) : null}
                </div>
                {bot.lastChat?.trim() ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {bot.lastChat.trim()}
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
