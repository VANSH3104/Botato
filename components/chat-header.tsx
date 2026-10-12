"use client"

import * as React from "react"
import { Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChatAvatar } from "@/components/chat-avatar"
import { BotDialog } from "@/components/bot-dialog"
import type { Chat } from "@/chats/queries"

export interface ChatHeaderProps {
  chat: Chat
  className?: string
}

export function ChatHeader({ chat, className }: ChatHeaderProps) {
  // Ignore group chats for now; fall back to first chat member's information
  const firstMember = chat.bots?.[0] ?? chat.bot
  const targetBot = firstMember ?? chat.bot

  return (
    <header
      className={`flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-background px-4 ${className ?? ""}`}
    >
      <div className="flex items-center min-w-0">
        {targetBot ? (
          <BotDialog
            initialBot={targetBot}
            trigger={
              <button
                type="button"
                className="group flex items-center gap-2.5 min-w-0 -my-1 -ml-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label={`Edit ${firstMember?.name ?? chat.name}`}
                title="Edit bot"
              >
                <ChatAvatar
                  seed={firstMember?.avatar ?? chat.avatar}
                  className="size-7.5 shrink-0 rounded-md transition-transform group-hover:scale-105"
                />
                <span className="truncate text-sm font-medium text-foreground">
                  {firstMember?.name ?? chat.name}
                </span>
              </button>
            }
          />
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <ChatAvatar
              seed={firstMember?.avatar ?? chat.avatar}
              className="size-7.5 shrink-0 rounded-md"
            />
            <span className="truncate text-sm font-medium text-foreground">
              {firstMember?.name ?? chat.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Desktop"
          className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          <Monitor className="size-5" />
        </Button>
      </div>
    </header>
  )
}

export default ChatHeader
