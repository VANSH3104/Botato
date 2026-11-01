"use client"

import * as React from "react"
import { ChatHeader } from "@/components/chat-header"
import { Chat } from "@/components/chat"
import { SandboxDesktop } from "@/components/sandbox-desktop"
import { clearChatSession } from "@/actions/chat"
import type { Chat as ChatData } from "@/chats/queries"

export function ChatWorkspace({
  chat,
}: {
  chatId?: string
  chat: ChatData
}) {
  const [isDesktopOpen, setIsDesktopOpen] = React.useState<boolean>(false)
  const [activeTab, setActiveTab] = React.useState<"terminal" | "files" | "browser">("terminal")
  const [browserUrl, setBrowserUrl] = React.useState<string | undefined>(undefined)
  const [hasSandboxActivity, setHasSandboxActivity] = React.useState<boolean>(false)
  const [conversationKey, setConversationKey] = React.useState<number>(0)

  const handleSandboxActivity = React.useCallback(
    (tab?: "terminal" | "files" | "browser", url?: string) => {
      setHasSandboxActivity(true)
      if (tab) setActiveTab(tab)
      if (url) setBrowserUrl(url)
      // Do not auto-open desktop; user can open via header icon or badge View link
    },
    []
  )

  const handleOpenDesktop = React.useCallback(
    (tab?: "terminal" | "files" | "browser", url?: string) => {
      setHasSandboxActivity(true)
      if (tab) setActiveTab(tab)
      if (url) setBrowserUrl(url)
      setIsDesktopOpen(true)
    },
    []
  )

  const handleClearChat = React.useCallback(async () => {
    await clearChatSession(chat.id)
    setConversationKey((k) => k + 1)
    setHasSandboxActivity(false)
    setBrowserUrl(undefined)
  }, [chat.id])

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      <ChatHeader
        chat={chat}
        isDesktopOpen={isDesktopOpen}
        hasSandboxActivity={hasSandboxActivity}
        onToggleDesktop={() => setIsDesktopOpen((prev) => !prev)}
        onClearChat={handleClearChat}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Chat
            key={`${chat.id}-${conversationKey}`}
            chatId={chat.id}
            chat={chat}
            onSandboxActivity={handleSandboxActivity}
            onOpenDesktop={handleOpenDesktop}
          />
        </div>
        {isDesktopOpen && (
          <SandboxDesktop
            isOpen={isDesktopOpen}
            onClose={() => setIsDesktopOpen(false)}
            initialTab={activeTab}
            initialBrowserUrl={browserUrl}
            initialSandboxId={chat.isGroup ? chat.bots?.[0]?.sandboxId ?? undefined : chat.bot?.sandboxId ?? undefined}
            botId={chat.isGroup ? chat.bots?.[0]?.id : chat.bot?.id}
            bots={chat.isGroup ? chat.bots : undefined}
          />
        )}
      </div>
    </div>
  )
}
