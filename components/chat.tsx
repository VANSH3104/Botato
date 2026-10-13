"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { useTriggerChatTransport, useLoadTranscript } from "@trigger.dev/sdk/chat/react"
import type { chatAgent } from "@/src/trigger/chat"
import {
  mintChatAccessToken,
  startChatSession,
  loadTranscript,
} from "@/actions/chat"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input"
import { ChatAvatar } from "@/components/chat-avatar"
import { Spinner } from "@/components/ui/spinner"
import type { UIMessage } from "ai"
import type { Chat as ChatData } from "@/chats/queries"

export interface ChatProps {
  chatId: string
  chat: ChatData
}

export function Chat({ chatId, chat }: ChatProps) {
  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "chat-agent",
    accessToken: ({ chatId: id }) => mintChatAccessToken(id),
    startSession: ({ chatId: id, clientData }) =>
      startChatSession({ chatId: id, clientData }),
  })

  const { messages: initialMessages, isLoading } = useLoadTranscript(
    chatId,
    loadTranscript,
    { transport }
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Spinner className="size-6" />
        <span className="text-xs">Loading conversation...</span>
      </div>
    )
  }

  return (
    <ChatInner
      chatId={chatId}
      chat={chat}
      transport={transport}
      initialMessages={initialMessages}
    />
  )
}

function ChatInner({
  chatId,
  chat,
  transport,
  initialMessages,
}: {
  chatId: string
  chat: ChatData
  transport: ReturnType<typeof useTriggerChatTransport<typeof chatAgent>>
  initialMessages: UIMessage[]
}) {
  const [input, setInput] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const bot = chat.bots?.[0] ?? chat.bot

  const { messages, sendMessage, stop, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
      setInput("")
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      {/* Scrollable messages container with centered reading column */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <ChatAvatar
                seed={bot?.avatar ?? chat.avatar}
                className="size-16 rounded-2xl shadow-sm mb-2 border border-border/60"
              />
              <h2 className="text-lg font-semibold text-foreground">
                Chat with {bot?.name ?? chat.name}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {bot?.instructions?.trim() ||
                  bot?.job?.trim() ||
                  "Ask anything to begin the conversation."}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === "user"

                if (isUser) {
                  return (
                    <div key={message.id} className="flex justify-end w-full">
                      <div className="max-w-[75%] rounded-2xl bg-secondary px-4 py-2.5 text-sm text-secondary-foreground whitespace-pre-wrap break-words leading-relaxed shadow-xs">
                        {message.parts.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              <span key={`${message.id}-${i}`}>{part.text}</span>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 w-full"
                  >
                    <ChatAvatar
                      seed={bot?.avatar ?? chat.avatar}
                      className="size-8 shrink-0 rounded-lg mt-0.5"
                    />
                    <div className="flex-1 min-w-0 text-sm text-foreground leading-relaxed break-words pt-1 space-y-2">
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )
              })}

              {status === "submitted" && (
                <div className="flex items-start gap-3 w-full">
                  <ChatAvatar
                    seed={bot?.avatar ?? chat.avatar}
                    className="size-8 shrink-0 rounded-lg mt-0.5"
                  />
                  <div className="flex items-center gap-1.5 pt-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Pinned prompt input bar at the bottom */}
      <div className="p-4 bg-background border-t border-border shrink-0">
        <div className="max-w-2xl mx-auto w-full">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              placeholder={`Message ${bot?.name ?? chat.name}...`}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="min-h-[56px] text-sm py-3 px-3.5"
            />
            <PromptInputFooter className="px-3 pb-2.5 pt-1">
              <div className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
              <PromptInputSubmit
                status={status}
                disabled={!input.trim()}
                onStop={stop}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

export default Chat
