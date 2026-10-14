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
import { Terminal, ExternalLink, ChevronDown } from "lucide-react"
import type { UIMessage } from "ai"
import type { Chat as ChatData } from "@/chats/queries"

export interface ChatProps {
  chatId: string
  chat: ChatData
  onSandboxActivity?: (tab?: "terminal" | "files" | "browser", url?: string) => void
  onOpenDesktop?: (tab?: "terminal" | "files" | "browser", url?: string) => void
}

export interface ParsedToolStep {
  id: string
  toolName: string
  label: string
  detail?: string
  state: "running" | "completed" | "error"
  tab?: "terminal" | "files" | "browser"
  url?: string
  outputPreview?: string
}

function parseMessageToolSteps(parts: unknown[] = []): ParsedToolStep[] {
  const steps: ParsedToolStep[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] as Record<string, unknown> | null
    if (!part) continue

    let toolName = ""
    let args: Record<string, unknown> = {}
    let state = "call"
    let output: unknown = null

    const toolInv = part.toolInvocation as Record<string, unknown> | undefined

    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      toolName = part.type.replace("tool-", "")
      args = (part.input || part.args || toolInv?.args || {}) as Record<string, unknown>
      output = part.output ?? part.result ?? toolInv?.result ?? null
      state = (part.state as string) || (output ? "result" : "call")
    } else if (part.type === "tool-call" || part.type === "tool-invocation") {
      toolName = (part.toolName as string) || (toolInv?.toolName as string) || ""
      args = (part.args || part.input || toolInv?.args || {}) as Record<string, unknown>
      output = part.result ?? part.output ?? toolInv?.result ?? null
      state = (part.state as string) || (toolInv?.state as string) || (output ? "result" : "call")
    } else if (part.type === "dynamic-tool") {
      toolName = (part.toolName as string) || ""
      args = (part.input || part.args || {}) as Record<string, unknown>
      output = part.output ?? part.result ?? null
      state = (part.state as string) || (output ? "result" : "call")
    }

    if (!toolName) continue

    let label = `Execute ${toolName}`
    let detail = ""
    let tab: "terminal" | "files" | "browser" | undefined = undefined
    let url: string | undefined = undefined

    if (toolName === "browseWeb") {
      tab = "browser"
      url = args?.url as string | undefined
      label = "Browsed web page"
      detail = (args?.url as string) || ""
    } else if (toolName === "executeCommand") {
      tab = "terminal"
      label = "Ran command in sandbox"
      detail = args?.command ? `$ ${args.command}` : ""
    } else if (toolName === "createSandbox") {
      tab = "terminal"
      label = "Created isolated sandbox environment"
    } else if (toolName === "writeFile") {
      tab = "files"
      label = "Wrote file in workspace"
      detail = (args?.path as string) || ""
    } else if (toolName === "readFile") {
      tab = "files"
      label = "Read file from workspace"
      detail = (args?.path as string) || ""
    } else if (toolName === "listFiles") {
      tab = "files"
      label = "Inspected workspace directory"
      detail = (args?.path as string) || "."
    } else if (toolName === "terminateSandbox") {
      tab = "terminal"
      label = "Terminated sandbox environment"
    }

    let statusType: "running" | "completed" | "error" = "running"
    const outObj = output as Record<string, unknown> | null
    if (state === "result" || state === "output-available" || (output !== null && output !== undefined)) {
      if (outObj?.success === false || outObj?.error) {
        statusType = "error"
      } else {
        statusType = "completed"
      }
    } else if (state === "error" || state === "output-error") {
      statusType = "error"
    }

    let outputPreview: string | undefined = undefined
    if (outObj) {
      if (typeof outObj.stdout === "string" && outObj.stdout.trim()) {
        outputPreview = outObj.stdout.trim()
      } else if (typeof outObj.summary === "string" && outObj.summary.trim()) {
        outputPreview = outObj.summary.trim()
      } else if (typeof outObj.error === "string" && outObj.error.trim()) {
        outputPreview = outObj.error.trim()
      } else if (typeof outObj.stderr === "string" && outObj.stderr.trim()) {
        outputPreview = outObj.stderr.trim()
      }
    }

    steps.push({
      id: (part.toolCallId as string) || (part.id as string) || `${toolName}-${i}`,
      toolName,
      label,
      detail,
      state: statusType,
      tab,
      url,
      outputPreview,
    })
  }

  return steps
}

function parseToolPart(rawPart: unknown) {
  const part = rawPart as Record<string, unknown> | null
  if (!part) return null

  let toolName = ""
  let args: Record<string, unknown> = {}
  let state = "call"
  let output: unknown = null

  const toolInv = part.toolInvocation as Record<string, unknown> | undefined

  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    toolName = part.type.replace("tool-", "")
    args = (part.input || part.args || toolInv?.args || {}) as Record<string, unknown>
    output = part.output ?? part.result ?? toolInv?.result ?? null
    state = (part.state as string) || (output ? "result" : "call")
  } else if (part.type === "tool-call" || part.type === "tool-invocation") {
    toolName = (part.toolName as string) || (toolInv?.toolName as string) || ""
    args = (part.args || part.input || toolInv?.args || {}) as Record<string, unknown>
    output = part.result ?? part.output ?? toolInv?.result ?? null
    state = (part.state as string) || (toolInv?.state as string) || (output ? "result" : "call")
  } else if (part.type === "dynamic-tool") {
    toolName = (part.toolName as string) || ""
    args = (part.input || part.args || {}) as Record<string, unknown>
    output = part.output ?? part.result ?? null
    state = (part.state as string) || (output ? "result" : "call")
  }

  if (!toolName) return null
  return { toolName, args, state, output }
}

export function Chat({ chatId, chat, onSandboxActivity, onOpenDesktop }: ChatProps) {
  const targetBot = chat.bots?.[0] ?? chat.bot
  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "chat-agent",
    clientData: {
      botName: targetBot?.name ?? chat.name,
      botJob: targetBot?.job ?? undefined,
      botInstructions: targetBot?.instructions ?? undefined,
    },
    accessToken: ({ chatId: id }) => mintChatAccessToken(id),
    startSession: ({ chatId: id, clientData }) =>
      startChatSession({
        chatId: id,
        clientData: {
          ...(clientData as Record<string, unknown>),
          botName: targetBot?.name ?? chat.name,
          botJob: targetBot?.job ?? undefined,
          botInstructions: targetBot?.instructions ?? undefined,
        },
      }),
  })

  const { messages: triggerMessages, isLoading } = useLoadTranscript(
    chatId,
    loadTranscript,
    { transport }
  )

  const [cachedMessages, setCachedMessages] = React.useState<UIMessage[]>([])
  const [hasCheckedCache, setHasCheckedCache] = React.useState(false)

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(`botato_chat_${chatId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCachedMessages(parsed)
          }
        }
      }
    } catch {
      // ignore storage errors
    }
    setHasCheckedCache(true)
  }, [chatId])

  if (isLoading && !hasCheckedCache) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Spinner className="size-6" />
        <span className="text-xs">Loading conversation...</span>
      </div>
    )
  }

  const effectiveInitialMessages =
    triggerMessages && triggerMessages.length > 0
      ? triggerMessages
      : cachedMessages

  return (
    <ChatInner
      key={chatId}
      chatId={chatId}
      chat={chat}
      transport={transport}
      initialMessages={effectiveInitialMessages}
      onSandboxActivity={onSandboxActivity}
      onOpenDesktop={onOpenDesktop}
    />
  )
}

function ChatInner({
  chatId,
  chat,
  transport,
  initialMessages,
  onSandboxActivity,
  onOpenDesktop,
}: {
  chatId: string
  chat: ChatData
  transport: ReturnType<typeof useTriggerChatTransport<typeof chatAgent>>
  initialMessages: UIMessage[]
  onSandboxActivity?: (tab?: "terminal" | "files" | "browser", url?: string) => void
  onOpenDesktop?: (tab?: "terminal" | "files" | "browser", url?: string) => void
}) {
  const [input, setInput] = React.useState("")
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const isNearBottomRef = React.useRef(true)
  const bot = chat.bots?.[0] ?? chat.bot

  const { messages, sendMessage, stop, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })

  // Synchronize messages to local cache so conversation history is never lost on reload
  React.useEffect(() => {
    if (messages.length > 0) {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`botato_chat_${chatId}`, JSON.stringify(messages))
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [chatId, messages])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const el = scrollContainerRef.current
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distanceToBottom < 80
  }

  // Smooth scroll when new message is submitted, auto-scroll without jitter during streaming
  React.useEffect(() => {
    if (!scrollContainerRef.current) return
    if (isNearBottomRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages, status])

  // Track the most recent sandbox and browser activity from newest assistant message
  React.useEffect(() => {
    for (let m = messages.length - 1; m >= 0; m--) {
      const msg = messages[m]
      if (msg.role !== "assistant") continue
      const parts = msg.parts || []
      for (let pIdx = parts.length - 1; pIdx >= 0; pIdx--) {
        const tool = parseToolPart(parts[pIdx])
        if (!tool) continue

        if (tool.toolName === "browseWeb") {
          const url = typeof tool.args?.url === "string" ? tool.args.url : undefined
          onSandboxActivity?.("browser", url)
          return
        } else if (tool.toolName === "writeFile" || tool.toolName === "readFile" || tool.toolName === "listFiles") {
          onSandboxActivity?.("files")
          return
        } else if (tool.toolName === "executeCommand" || tool.toolName === "createSandbox") {
          onSandboxActivity?.("terminal")
          return
        }
      }
    }
  }, [messages, onSandboxActivity])

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text })
      setInput("")
      // Ensure we jump to bottom when user submits
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      {/* Scrollable messages container with centered reading column */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
      >
        <div
          className={`max-w-2xl mx-auto w-full flex flex-col ${
            messages.length === 0 ? "h-full justify-center" : "gap-6"
          }`}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-3">
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
                const hasText = message.parts.some((p) => p.type === "text" && p.text?.trim())
                const toolSteps = !isUser ? parseMessageToolSteps(message.parts) : []
                const isLatestAssistant = message.id === messages[messages.length - 1]?.id
                const isBusy = (status === "streaming" || status === "submitted") && isLatestAssistant

                if (!isUser && !hasText && toolSteps.length === 0 && !isBusy) {
                  return null
                }

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
                      {/* Collapsible Steps & Sandbox Activity */}
                      {toolSteps.length > 0 && (
                        <details
                          className="group/steps my-2 rounded-xl border border-border/70 bg-card/60 shadow-xs overflow-hidden transition-all"
                          open={isBusy}
                        >
                          <summary className="flex items-center justify-between px-3 py-2 cursor-pointer list-none select-none hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <Terminal className="size-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate">
                                Sandbox Steps & Activity
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                {toolSteps.length} step{toolSteps.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground text-[11px]">
                              <span className="group-open/steps:hidden">Show steps</span>
                              <span className="hidden group-open/steps:inline">Hide steps</span>
                              <ChevronDown className="size-3.5 transition-transform duration-200 group-open/steps:rotate-180" />
                            </div>
                          </summary>

                          <div className="px-3 pb-2.5 pt-1 border-t border-border/50 space-y-2 bg-muted/20">
                            {toolSteps.map((step) => (
                              <div
                                key={step.id}
                                className="rounded-lg border border-border/60 bg-background/90 p-2 text-xs space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {step.state === "running" ? (
                                      <span className="size-2 rounded-full bg-primary animate-ping shrink-0" />
                                    ) : step.state === "error" ? (
                                      <span className="size-2 rounded-full bg-destructive shrink-0" />
                                    ) : (
                                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                    )}
                                    <span className="font-medium text-foreground truncate">
                                      {step.label}
                                    </span>
                                  </div>

                                  {step.tab && onOpenDesktop && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenDesktop(step.tab, step.url)}
                                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono shrink-0 cursor-pointer"
                                      title="View in sandbox desktop"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="size-3" />
                                    </button>
                                  )}
                                </div>

                                {step.detail && (
                                  <div className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/40 truncate">
                                    {step.detail}
                                  </div>
                                )}

                                {step.outputPreview && (
                                  <pre className="font-mono text-[10px] text-muted-foreground bg-muted/60 p-2 rounded border border-border/40 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
                                    {step.outputPreview}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

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

                      {isBusy && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                          <span className="size-2 rounded-full bg-primary/70 animate-ping" />
                          <span>
                            {toolSteps.some((s) => s.state === "running")
                              ? `Working in sandbox: ${toolSteps.find((s) => s.state === "running")?.label}...`
                              : hasText
                              ? "Finalizing response..."
                              : "Checking sandbox & gathering details..."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role === "user" && (
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
