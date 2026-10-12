"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { ChatAvatar } from "@/components/chat-avatar"
import type { Chat } from "@/chats/queries"
import { cn } from "@/lib/utils"

export interface ChatViewProps {
  chat: Chat
}

export function ChatView({ chat }: ChatViewProps) {
  const [input, setInput] = React.useState("")
  const bot = chat.bots?.[0] ?? chat.bot

  const systemPrompt = React.useMemo(() => {
    return [
      bot?.name ? `Your name is ${bot.name}.` : "",
      bot?.job ? `Your role is: ${bot.job}.` : "",
      bot?.instructions ? `Follow these instructions: ${bot.instructions}` : "",
    ]
      .filter(Boolean)
      .join(" ")
  }, [bot?.name, bot?.job, bot?.instructions])

  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      body: {
        system: systemPrompt,
      },
    })
  }, [systemPrompt])

  const { messages, sendMessage, status, stop } = useChat({
    transport,
  })

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
      setInput("")
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <ChatAvatar
                  seed={bot?.avatar ?? chat.avatar}
                  className="size-16 rounded-2xl shadow-sm mb-2"
                />
              }
              title={`Chat with ${bot?.name ?? chat.name}`}
              description={
                bot?.instructions?.trim() ||
                bot?.job?.trim() ||
                "Ask anything to begin the conversation."
              }
            />
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <ChatAvatar
                    seed={bot?.avatar ?? chat.avatar}
                    className="size-8 shrink-0 rounded-lg mt-0.5"
                  />
                )}
                <Message from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          )
                        default:
                          return null
                      }
                    })}
                  </MessageContent>
                </Message>
              </div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-3xl mx-auto w-full">
          <PromptInput onSubmit={handleSubmit} className="relative">
            <PromptInputTextarea
              value={input}
              placeholder={`Message ${bot?.name ?? chat.name}...`}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-12 min-h-[52px]"
            />
            <PromptInputSubmit
              status={status}
              disabled={!input.trim()}
              onStop={stop}
              className="absolute bottom-2.5 right-2.5"
            />
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

export default ChatView
