"use client"

import { Monitor, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { BotDialog } from "@/components/bot-dialog"
import { GroupChatDialog } from "@/components/group-chat-dialog"
import { McpShowcaseDialog } from "@/components/mcp-showcase-dialog"
import type { Chat } from "@/chats/queries"

export interface ChatHeaderProps {
  chat: Chat
  className?: string
  isDesktopOpen?: boolean
  hasSandboxActivity?: boolean
  onToggleDesktop?: () => void
  onClearChat?: () => void
}

export function ChatHeader({
  chat,
  className,
  isDesktopOpen = false,
  hasSandboxActivity = false,
  onToggleDesktop,
}: ChatHeaderProps) {
  // Ignore group chats for now; fall back to first chat member's information
  const firstMember = chat.bots?.[0] ?? chat.bot
  const targetBot = firstMember ?? chat.bot

  return (
    <header
      className={`flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-background px-2.5 sm:px-4 ${className ?? ""}`}
    >
      <div className="flex items-center min-w-0 gap-1 sm:gap-2">
        <SidebarTrigger className="-ml-1 mr-0.5 sm:mr-1 shrink-0" />
        {chat.isGroup ? (
          <GroupChatDialog
            initialGroup={{
              id: chat.id,
              name: chat.name,
              bots: chat.bots ?? [],
            }}
            trigger={
              <button
                type="button"
                className="group flex items-center gap-2 sm:gap-2.5 min-w-0 -my-1 -ml-1 sm:-ml-1.5 rounded-lg px-1.5 sm:px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label={`Edit ${chat.name}`}
                title="Edit group chat or manage bots"
              >
                <GroupChatAvatar
                  bots={chat.bots}
                  seed={chat.avatar}
                  className="size-7 sm:size-8 shrink-0 rounded-md transition-transform group-hover:scale-105"
                />
                <span className="truncate text-sm font-medium text-foreground max-w-[150px] xs:max-w-[200px] sm:max-w-[320px] md:max-w-none">
                  {chat.name}
                </span>
              </button>
            }
          />
        ) : targetBot ? (
          <BotDialog
            initialBot={targetBot}
            trigger={
              <button
                type="button"
                className="group flex items-center gap-2 sm:gap-2.5 min-w-0 -my-1 -ml-1 sm:-ml-1.5 rounded-lg px-1.5 sm:px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                aria-label={`Edit ${firstMember?.name ?? chat.name}`}
                title="Edit bot"
              >
                <ChatAvatar
                  seed={firstMember?.avatar ?? chat.avatar}
                  className="size-7 sm:size-7.5 shrink-0 rounded-md transition-transform group-hover:scale-105"
                />
                <span className="truncate text-sm font-medium text-foreground max-w-[150px] xs:max-w-[200px] sm:max-w-[320px] md:max-w-none">
                  {firstMember?.name ?? chat.name}
                </span>
              </button>
            }
          />
        ) : (
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <ChatAvatar
              seed={firstMember?.avatar ?? chat.avatar}
              className="size-7 sm:size-7.5 shrink-0 rounded-md"
            />
            <span className="truncate text-sm font-medium text-foreground max-w-[150px] xs:max-w-[200px] sm:max-w-[320px] md:max-w-none">
              {firstMember?.name ?? chat.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <McpShowcaseDialog
          botName={firstMember?.name ?? chat.name}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Model Context Protocol Tools"
              title="Explore Model Context Protocol (MCP) Tools"
              className="size-8 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Sparkles className="size-4" />
            </Button>
          }
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Desktop Sandbox"
          title={
            isDesktopOpen
              ? "Close Live Browser"
              : hasSandboxActivity
              ? "Browser active — click to view Live Browser"
              : "Open Live Browser"
          }
          className={`relative size-8 transition-colors ${
            isDesktopOpen
              ? "text-primary bg-primary/15 hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          onClick={onToggleDesktop}
        >
          <Monitor className="size-5" />
          {hasSandboxActivity && !isDesktopOpen && (
            <span className="absolute top-1 right-1 flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}

export default ChatHeader
