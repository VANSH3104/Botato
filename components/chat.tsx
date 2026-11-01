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
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Spinner } from "@/components/ui/spinner"
import {
  Terminal,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Pencil,
  Zap,
  Sparkles,
} from "lucide-react"
import { extractSnippetFromMessage } from "@/lib/utils"
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

export interface AssistantSegment {
  key: string
  bot?: { id: string; name: string; avatar: string; job?: string | null }
  text: string
  isFirst: boolean
  isLast: boolean
}

function extractBotFromText(
  text: string,
  botsList: Array<{ id: string; name: string; avatar: string; job?: string | null }>
): {
  bot?: { id: string; name: string; avatar: string; job?: string | null }
  cleanText: string
} {
  const match = text.match(/<!--bot:([^>]+)-->/)
  if (match) {
    const rawIdOrName = match[1].trim()
    const matchedBot = botsList.find(
      (b) => b.id === rawIdOrName || b.name.toLowerCase() === rawIdOrName.toLowerCase()
    )
    const cleanText = text.replace(/<!--bot:[^>]+-->\s*/, "")
    return { bot: matchedBot, cleanText }
  }

  for (const b of botsList) {
    const escaped = b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const prefixRegex = new RegExp(`^(?:\\[${escaped}\\]|\\*\\*${escaped}\\*\\*|${escaped}:)\\s*`, "i")
    if (prefixRegex.test(text)) {
      return { bot: b, cleanText: text.replace(prefixRegex, "") }
    }
  }

  // Check introductory patterns (e.g. "I'm vvv —" or "I am vvv" or "This is vvv")
  for (const b of botsList) {
    const escaped = b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const introRegex = new RegExp(`^(?:I['’]m|I\\s+am|This\\s+is)\\s+${escaped}\\b`, "i")
    if (introRegex.test(text.trim())) {
      return { bot: b, cleanText: text }
    }
  }

  return { bot: undefined, cleanText: text }
}

function renderUserMessageWithMentions(
  text: string,
  botsList: Array<{ id: string; name: string }>
) {
  if (!text) return null
  if (!botsList || botsList.length === 0) return text

  const names = botsList.map((b) => b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")
  const regex = new RegExp(`(@(?:everyone|all|${names}))\\b`, "gi")

  const parts = text.split(regex)
  if (parts.length <= 1) return text

  return parts.map((part, i) => {
    if (regex.test(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center font-medium text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary-foreground mx-0.5"
        >
          {part}
        </span>
      )
    }
    return part
  })
}

function parseAssistantMessageSegments(
  fullText: string,
  botsList: Array<{ id: string; name: string; avatar: string; job?: string | null }>,
  fallbackBot?: { id: string; name: string; avatar: string; job?: string | null }
): AssistantSegment[] {
  if (!fullText.trim()) {
    return [
      {
        key: "seg-0",
        bot: fallbackBot,
        text: "",
        isFirst: true,
        isLast: true,
      },
    ]
  }

  // 1. Check for <!--bot:BOT_ID--> tags
  const botTagRegex = /<!--bot:([^>]+)-->/g
  const matches = Array.from(fullText.matchAll(botTagRegex))

  if (matches.length > 0) {
    const segments: AssistantSegment[] = []
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const nextMatch = matches[i + 1]
      const botIdOrName = match[1].trim()
      const matchedBot = botsList.find(
        (b) => b.id === botIdOrName || b.name.toLowerCase() === botIdOrName.toLowerCase()
      ) ?? fallbackBot

      const startIdx = match.index! + match[0].length
      const endIdx = nextMatch ? nextMatch.index! : fullText.length
      let rawSegmentText = fullText.slice(startIdx, endIdx).trim()

      if (matchedBot) {
        const esc = matchedBot.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        rawSegmentText = rawSegmentText.replace(
          new RegExp(`^(?:\\[${esc}\\]|\\*\\*${esc}\\*\\*|${esc}:)\\s*`, "i"),
          ""
        )
      }

      segments.push({
        key: `seg-${i}-${matchedBot?.id || i}`,
        bot: matchedBot,
        text: rawSegmentText,
        isFirst: i === 0,
        isLast: i === matches.length - 1,
      })
    }
    return segments
  }

  // 2. Check for markdown headers like [BotName]: or **BotName**: or ### BotName:
  // if text has at least 2 distinct bot occurrences
  const foundBotIndices: Array<{
    bot: (typeof botsList)[number]
    index: number
    matchLength: number
  }> = []

  for (const b of botsList) {
    const esc = b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const headerRegex = new RegExp(`(?:^|\\n\\n)(?:\\[${esc}\\]|\\*\\*${esc}\\*\\*|#{1,4}\\s+${esc}(?:'s)?(?::|\\s+Summary|\\s+Response)?)(?::)?\\s*`, "gi")
    let m: RegExpExecArray | null
    while ((m = headerRegex.exec(fullText)) !== null) {
      foundBotIndices.push({
        bot: b,
        index: m.index,
        matchLength: m[0].length,
      })
    }
  }

  foundBotIndices.sort((a, b) => a.index - b.index)

  if (foundBotIndices.length > 1) {
    const segments: AssistantSegment[] = []
    for (let i = 0; i < foundBotIndices.length; i++) {
      const current = foundBotIndices[i]
      const next = foundBotIndices[i + 1]
      const startIdx = current.index + current.matchLength
      const endIdx = next ? next.index : fullText.length
      const segText = fullText.slice(startIdx, endIdx).trim()

      segments.push({
        key: `seg-md-${i}-${current.bot.id}`,
        bot: current.bot,
        text: segText,
        isFirst: i === 0,
        isLast: i === foundBotIndices.length - 1,
      })
    }
    return segments
  }

  // Default: single segment
  const { bot: detectedBot, cleanText } = extractBotFromText(fullText, botsList)
  return [
    {
      key: "seg-default",
      bot: detectedBot ?? fallbackBot,
      text: cleanText,
      isFirst: true,
      isLast: true,
    },
  ]
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
    } else if (toolName === "consultBot") {
      tab = undefined
      label = `Consulted @${(args?.botName as string) || "peer bot"}`
      detail = (args?.query as string) || ""
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
      } else if (typeof outObj.response === "string" && outObj.response.trim()) {
        outputPreview = outObj.response.trim()
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
  const [selectedBotId, setSelectedBotId] = React.useState<string>(() => {
    return chat.bots?.[0]?.id ?? chat.bot?.id ?? ""
  })

  const targetBot = React.useMemo(() => {
    if (chat.isGroup && chat.bots && chat.bots.length > 0) {
      return chat.bots.find((b) => b.id === selectedBotId) ?? chat.bots[0]
    }
    return chat.bots?.[0] ?? chat.bot
  }, [chat, selectedBotId])

  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "chat-agent",
    clientData: {
      isGroup: Boolean(chat.isGroup),
      groupName: chat.isGroup ? chat.name : undefined,
      selectedBotId: targetBot?.id,
      botName: targetBot?.name ?? chat.name,
      botJob: targetBot?.job ?? undefined,
      botInstructions: targetBot?.instructions ?? undefined,
      bots: chat.bots?.map((b) => ({
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        job: b.job,
        instructions: b.instructions,
      })),
    },
    accessToken: ({ chatId: id }) => mintChatAccessToken(id),
    startSession: ({ chatId: id, clientData }) =>
      startChatSession({
        chatId: id,
        clientData: {
          ...(clientData as Record<string, unknown>),
          isGroup: Boolean(chat.isGroup),
          groupName: chat.isGroup ? chat.name : undefined,
          selectedBotId: targetBot?.id,
          botName: targetBot?.name ?? chat.name,
          botJob: targetBot?.job ?? undefined,
          botInstructions: targetBot?.instructions ?? undefined,
          bots: chat.bots?.map((b) => ({
            id: b.id,
            name: b.name,
            avatar: b.avatar,
            job: b.job,
            instructions: b.instructions,
          })),
        },
      }),
  })

  const { messages: triggerMessages, isLoading } = useLoadTranscript(
    chatId,
    loadTranscript,
    { transport }
  )

  const [cachedMessages] = React.useState<UIMessage[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(`botato_chat_${chatId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      }
    } catch {
      // ignore storage errors
    }
    return []
  })

  if (isLoading && cachedMessages.length === 0) {
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
      selectedBotId={selectedBotId}
      setSelectedBotId={setSelectedBotId}
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
  selectedBotId,
  setSelectedBotId,
  onSandboxActivity,
  onOpenDesktop,
}: {
  chatId: string
  chat: ChatData
  transport: ReturnType<typeof useTriggerChatTransport<typeof chatAgent>>
  initialMessages: UIMessage[]
  selectedBotId: string
  setSelectedBotId: (id: string) => void
  onSandboxActivity?: (tab?: "terminal" | "files" | "browser", url?: string) => void
  onOpenDesktop?: (tab?: "terminal" | "files" | "browser", url?: string) => void
}) {
  const [input, setInput] = React.useState("")
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const isNearBottomRef = React.useRef(true)
  const bot = chat.bots?.[0] ?? chat.bot
  const targetBot = React.useMemo(() => {
    if (chat.isGroup && chat.bots && chat.bots.length > 0) {
      return chat.bots.find((b) => b.id === selectedBotId) ?? chat.bots[0]
    }
    return chat.bots?.[0] ?? chat.bot
  }, [chat, selectedBotId])

  const matchingBots = React.useMemo(() => {
    if (!chat.isGroup || !chat.bots || mentionQuery === null) return []
    const q = mentionQuery.toLowerCase().trim()
    if (!q) return chat.bots
    return chat.bots.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.job && b.job.toLowerCase().includes(q))
    )
  }, [chat.isGroup, chat.bots, mentionQuery])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.currentTarget.value
    setInput(val)

    if (!chat.isGroup || !chat.bots || chat.bots.length === 0) {
      setMentionQuery(null)
      return
    }

    const cursorPos = e.currentTarget.selectionEnd ?? val.length
    const textBeforeCursor = val.slice(0, cursorPos)
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\-\s]{0,20})$/)

    if (match) {
      setMentionQuery(match[1])
      setMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  const selectMention = (botToMention: { id: string; name: string }) => {
    const el = textareaRef.current
    const cursorPos = el?.selectionEnd ?? input.length
    const textBeforeCursor = input.slice(0, cursorPos)
    const textAfterCursor = input.slice(cursorPos)

    const replacedBefore = textBeforeCursor.replace(
      /(?:^|\s)@([a-zA-Z0-9_\-\s]{0,20})$/,
      (m) => {
        const leadingSpace = m.startsWith(" ") ? " " : ""
        return `${leadingSpace}@${botToMention.name} `
      }
    )

    const nextVal = replacedBefore + textAfterCursor
    setInput(nextVal)
    setSelectedBotId(botToMention.id)
    setMentionQuery(null)

    setTimeout(() => {
      if (el) {
        el.focus()
        const nextPos = replacedBefore.length
        el.setSelectionRange(nextPos, nextPos)
      }
    }, 10)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && matchingBots.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % matchingBots.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + matchingBots.length) % matchingBots.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const chosen = matchingBots[mentionIndex] ?? matchingBots[0]
        if (chosen) {
          e.preventDefault()
          selectMention(chosen)
          return
        }
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }
  }

  const { messages, sendMessage, stop, status, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  })

  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopyText = React.useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleEditPrompt = React.useCallback((text: string) => {
    setInput(text)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSendStarterPrompt = React.useCallback(
    (promptText: string) => {
      if (chat.isGroup && chat.bots) {
        for (const b of chat.bots) {
          const nameClean = b.name.trim().toLowerCase()
          const regex = new RegExp(`@${b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\b|\\s|:|,|$)`, "i")
          if (regex.test(promptText) || promptText.toLowerCase().includes(`@${nameClean}`)) {
            setSelectedBotId(b.id)
            break
          }
        }
      }
      sendMessage({ text: promptText })
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    },
    [chat, sendMessage, setSelectedBotId]
  )

  // Synchronize messages to local cache so conversation history is never lost on reload
  const prevMessagesLengthRef = React.useRef(messages.length)
  const isInitialMountRef = React.useRef(true)

  React.useEffect(() => {
    if (messages.length === 0) return

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`botato_chat_${chatId}`, JSON.stringify(messages))

        const isNewMessage =
          !isInitialMountRef.current && messages.length > prevMessagesLengthRef.current
        prevMessagesLengthRef.current = messages.length
        isInitialMountRef.current = false

        // ONLY broadcast a timestamp update if a new message was actually sent or received during this session
        if (isNewMessage) {
          const lastMsg = messages[messages.length - 1]
          const snippet = extractSnippetFromMessage(lastMsg)
          const rawTime =
            lastMsg && typeof lastMsg === "object" && "createdAt" in lastMsg && lastMsg.createdAt
              ? (lastMsg as { createdAt?: Date | string }).createdAt
              : new Date()
          const lastChatAt =
            rawTime instanceof Date
              ? rawTime.toISOString()
              : typeof rawTime === "string"
              ? rawTime
              : new Date().toISOString()

          if (snippet) {
            window.dispatchEvent(
              new CustomEvent("botato_chat_updated", {
                detail: { chatId, lastChat: snippet, lastChatAt },
              })
            )
          }
        }
      }
    } catch {
      // ignore storage errors
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
      if (chat.isGroup && chat.bots) {
        for (const b of chat.bots) {
          const nameClean = b.name.trim().toLowerCase()
          const regex = new RegExp(`@${b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\b|\\s|:|,|$)`, "i")
          if (regex.test(message.text) || message.text.toLowerCase().includes(`@${nameClean}`)) {
            setSelectedBotId(b.id)
            break
          }
        }
      }
      setMentionQuery(null)
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
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6"
      >
        <div
          className={`max-w-2xl mx-auto w-full flex flex-col ${
            messages.length === 0 ? "h-full justify-center" : "gap-4 sm:gap-6"
          }`}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 max-w-lg mx-auto my-auto">
              {chat.isGroup ? (
                <>
                  <GroupChatAvatar
                    bots={chat.bots ?? []}
                    seed={chat.avatar}
                    className="size-16 rounded-2xl shadow-sm mb-1 border border-border/60 p-1 bg-muted/40"
                  />
                  <h2 className="text-lg font-semibold text-foreground">
                    {chat.name}
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-sm mb-1">
                    {chat.bots && chat.bots.length > 0
                      ? chat.bots.map((b) => `${b.name} (${b.job || "Member"})`).join(" • ")
                      : "Group Chat"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                    {[
                      {
                        title: "Plan sprint with team",
                        prompt: `@everyone Let's align on priorities: research requirements and outline key tasks.`,
                      },
                      {
                        title: "Research & cite sources",
                        prompt: chat.bots?.[0]
                          ? `@${chat.bots[0].name} research recent advancements in autonomous AI agents and cite key findings.`
                          : "Research recent advancements in autonomous AI agents and cite key findings.",
                      },
                      {
                        title: "Code in sandbox",
                        prompt: "Write a high-performance TypeScript script to validate API responses and execute it in sandbox.",
                      },
                      {
                        title: "Audit architecture",
                        prompt: "Audit our current architecture for security, edge cases, and privacy safeguards.",
                      },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSendStarterPrompt(item.prompt)}
                        className="flex flex-col items-start p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/70 hover:border-primary/40 text-left transition-all shadow-2xs group cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary">
                          <Sparkles className="size-3 text-primary" />
                          {item.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {item.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <ChatAvatar
                    seed={bot?.avatar ?? chat.avatar}
                    className="size-16 rounded-2xl shadow-sm mb-1 border border-border/60"
                  />
                  <h2 className="text-lg font-semibold text-foreground">
                    Chat with {bot?.name ?? chat.name}
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-sm mb-1">
                    {bot?.instructions?.trim() ||
                      bot?.job?.trim() ||
                      "Ask anything to begin the conversation."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                    {[
                      {
                        title: "Explore web documentation",
                        prompt: "Browse the web for the latest updates on AI model context protocol.",
                      },
                      {
                        title: "Run sandbox test",
                        prompt: "Run a system health check and test python/bash in your isolated sandbox.",
                      },
                      {
                        title: "Remember my preferences",
                        prompt: "Add a note to your MEMORY.md: I prefer clean, concise TypeScript with zero external bloat.",
                      },
                      {
                        title: "Brainstorm capabilities",
                        prompt: `What are 3 impactful tasks you can autonomously solve given your role as ${bot?.job || "assistant"}?`,
                      },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSendStarterPrompt(item.prompt)}
                        className="flex flex-col items-start p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/70 hover:border-primary/40 text-left transition-all shadow-2xs group cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary">
                          <Sparkles className="size-3 text-primary" />
                          {item.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {item.prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, msgIndex) => {
                const isUser = message.role === "user"
                const hasText = message.parts.some((p) => p.type === "text" && p.text?.trim())
                const toolSteps = !isUser ? parseMessageToolSteps(message.parts) : []
                const isLatestAssistant = message.id === messages[messages.length - 1]?.id
                const isBusy = (status === "streaming" || status === "submitted") && isLatestAssistant

                if (!isUser && !hasText && toolSteps.length === 0 && !isBusy) {
                  return null
                }

                if (isUser) {
                  const userText = message.parts
                    .filter((p) => p.type === "text" && typeof p.text === "string")
                    .map((p) => (p as { text: string }).text)
                    .join("\n")

                  return (
                    <div key={message.id} className="group relative flex justify-end w-full">
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-secondary px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm text-secondary-foreground whitespace-pre-wrap break-words leading-relaxed shadow-xs">
                        {renderUserMessageWithMentions(userText, chat.bots || [])}
                      </div>

                      {/* Hover action bar for user messages */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 right-2 flex items-center gap-1 bg-background/95 border border-border/80 shadow-xs rounded-md px-1.5 py-0.5 text-muted-foreground z-10">
                        <button
                          type="button"
                          onClick={() => handleCopyText(message.id, userText)}
                          className="hover:text-foreground p-0.5 rounded cursor-pointer"
                          title="Copy prompt"
                        >
                          {copiedId === message.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditPrompt(userText)}
                          className="hover:text-foreground p-0.5 rounded cursor-pointer"
                          title="Edit prompt"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                }

                const fullAssistantText = message.parts
                  .filter((p) => p.type === "text" && typeof p.text === "string")
                  .map((p) => (p as { text: string }).text)
                  .join("\n\n")

                // If not explicitly detected from text, check preceding user message to see who was tagged
                let userMentionedBot: typeof targetBot | undefined = undefined
                if (chat.isGroup && chat.bots) {
                  for (let k = msgIndex - 1; k >= 0; k--) {
                    if (messages[k].role === "user") {
                      const uText = messages[k].parts
                        .filter((p) => p.type === "text" && typeof p.text === "string")
                        .map((p) => (p as { text: string }).text)
                        .join(" ")
                      for (const b of chat.bots) {
                        const escaped = b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                        const r = new RegExp(`@${escaped}(?:\\b|\\s|:|,|$)`, "i")
                        if (r.test(uText) || uText.toLowerCase().includes(`@${b.name.toLowerCase().trim()}`)) {
                          userMentionedBot = b
                          break
                        }
                      }
                      break
                    }
                  }
                }

                const fallbackBot = userMentionedBot ?? (chat.isGroup ? targetBot : (bot ?? chat.bot))
                const segments = parseAssistantMessageSegments(
                  fullAssistantText,
                  chat.bots || [],
                  fallbackBot
                )

                return (
                  <React.Fragment key={message.id}>
                    {segments.map((segment) => {
                      const msgBot = segment.bot ?? fallbackBot
                      return (
                        <div
                          key={`${message.id}-${segment.key}`}
                          className="flex items-start gap-3 w-full"
                        >
                          <ChatAvatar
                            seed={msgBot?.avatar ?? bot?.avatar ?? chat.avatar}
                            className="size-8 shrink-0 rounded-lg mt-0.5"
                          />
                          <div className="flex-1 min-w-0 text-sm text-foreground leading-relaxed break-words pt-1 space-y-2">
                            {chat.isGroup && msgBot && (
                              <div className="flex items-center gap-1.5 pb-0.5 select-none">
                                <span className="font-semibold text-xs text-foreground">{msgBot.name}</span>
                                {msgBot.job && (
                                  <span className="text-[10px] text-muted-foreground">({msgBot.job})</span>
                                )}
                              </div>
                            )}

                            {/* Collapsible Steps & Sandbox Activity */}
                            {segment.isFirst && toolSteps.length > 0 && (
                              <details className="group/steps my-2 rounded-xl border border-border/70 bg-card/60 shadow-xs overflow-hidden transition-all">
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

                                        {step.tab === "browser" && onOpenDesktop && (
                                          <button
                                            type="button"
                                            onClick={() => onOpenDesktop("browser", step.url)}
                                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono shrink-0 cursor-pointer"
                                            title="View in live browser"
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

                            {segment.text && (
                              <MessageResponse>
                                {segment.text}
                              </MessageResponse>
                            )}

                            {segment.text && !isBusy && (
                              <div className="flex items-center gap-2 pt-1 text-muted-foreground text-xs select-none">
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(`${message.id}-${segment.key}`, segment.text)}
                                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-muted"
                                  title="Copy message"
                                >
                                  {copiedId === `${message.id}-${segment.key}` ? (
                                    <>
                                      <Check className="size-3 text-emerald-500" />
                                      <span className="text-emerald-500 text-[10px]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-3" />
                                      <span className="text-[10px]">Copy</span>
                                    </>
                                  )}
                                </button>

                                {segment.isLast && isLatestAssistant && status !== "streaming" && (
                                  <button
                                    type="button"
                                    onClick={() => regenerate()}
                                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-muted"
                                    title="Regenerate response"
                                  >
                                    <RotateCcw className="size-3" />
                                    <span className="text-[10px]">Regenerate</span>
                                  </button>
                                )}

                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono ml-auto">
                                  <Zap className="size-3 text-amber-500/80" />
                                  <span>Groq LPU</span>
                                </span>
                              </div>
                            )}

                            {isBusy && segment.isLast && (
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
                  </React.Fragment>
                )
              })}

              {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role === "user" && (() => {
                const lastUser = messages[messages.length - 1]
                let indicatorBot = targetBot
                if (chat.isGroup && chat.bots) {
                  const uText = lastUser.parts
                    .filter((p) => p.type === "text" && typeof p.text === "string")
                    .map((p) => (p as { text: string }).text)
                    .join(" ")
                  for (const b of chat.bots) {
                    const escaped = b.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                    const r = new RegExp(`@${escaped}(?:\\b|\\s|:|,|$)`, "i")
                    if (r.test(uText) || uText.toLowerCase().includes(`@${b.name.toLowerCase().trim()}`)) {
                      indicatorBot = b
                      break
                    }
                  }
                }
                return (
                  <div className="flex items-start gap-3 w-full">
                    <ChatAvatar
                      seed={indicatorBot?.avatar ?? bot?.avatar ?? chat.avatar}
                      className="size-8 shrink-0 rounded-lg mt-0.5"
                    />
                    <div className="flex items-center gap-1.5 pt-2 text-muted-foreground">
                      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* Pinned prompt input bar at the bottom */}
      <div className="p-2.5 sm:p-4 bg-background border-t border-border shrink-0">
        <div className="max-w-2xl mx-auto w-full relative">
          {/* Interactive @ Mention Autocomplete Popup */}
          {chat.isGroup && mentionQuery !== null && matchingBots.length > 0 && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-80 max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-border bg-popover shadow-2xl p-1.5 animate-in fade-in-0 zoom-in-95 select-none">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 mb-1">
                <span className="text-primary font-bold">Mention Bot</span>
                <span className="text-[10px] font-mono text-muted-foreground/80 lowercase">
                  ↑↓ select • ↵ / Tab insert
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {matchingBots.map((b, idx) => {
                  const isSelected = idx === mentionIndex
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selectMention(b)
                      }}
                      onMouseEnter={() => setMentionIndex(idx)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <ChatAvatar seed={b.avatar} className="size-6 rounded-lg shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-foreground">@{b.name}</span>
                          {b.id === selectedBotId && (
                            <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        {b.job && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {b.job}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              placeholder={
                chat.isGroup
                  ? `Message @${targetBot?.name || "bot"} (type @ to mention)...`
                  : `Message ${bot?.name ?? chat.name}...`
              }
              onChange={handleInputChange}
              onKeyDown={handleTextareaKeyDown}
              className="min-h-[56px] text-sm py-3 px-3.5"
            />
            <PromptInputFooter className="px-3 pb-2.5 pt-1 flex items-center justify-between">
              {chat.isGroup && chat.bots && chat.bots.length > 0 ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Bot:</span>
                  <PromptInputSelect
                    value={selectedBotId}
                    onValueChange={(val) => {
                      if (typeof val === "string") setSelectedBotId(val)
                    }}
                  >
                    <PromptInputSelectTrigger className="h-7.5 w-auto gap-1.5 px-2.5 text-xs rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/70 transition-colors shadow-2xs">
                      <PromptInputSelectValue placeholder="Select bot">
                        {targetBot && (
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <ChatAvatar seed={targetBot.avatar} className="size-4 rounded-md" />
                            <span>{targetBot.name}</span>
                          </span>
                        )}
                      </PromptInputSelectValue>
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent
                      align="start"
                      side="top"
                      sideOffset={8}
                      alignItemWithTrigger={false}
                      className="w-[300px] min-w-[280px] max-w-[calc(100vw-2rem)] p-1.5 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl z-50"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1 flex items-center justify-between">
                        <span>Group Member Bots</span>
                        <span className="text-[10px] font-normal normal-case text-muted-foreground/80">
                          type @ to tag
                        </span>
                      </div>
                      {chat.bots.map((b) => {
                        const isSelected = b.id === selectedBotId
                        return (
                          <PromptInputSelectItem
                            key={b.id}
                            value={b.id}
                            indicator={false}
                            className="cursor-pointer py-2 px-2.5 rounded-xl hover:bg-muted/80 data-[highlighted]:bg-muted transition-colors my-0.5"
                          >
                            <div className="flex items-start gap-2.5 w-full text-left">
                              <ChatAvatar seed={b.avatar} className="size-6 shrink-0 rounded-lg mt-0.5" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-semibold text-xs text-foreground">
                                    {b.name}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {b.job && (
                                  <span className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                                    {b.job}
                                  </span>
                                )}
                              </div>
                            </div>
                          </PromptInputSelectItem>
                        )
                      })}
                    </PromptInputSelectContent>
                  </PromptInputSelect>
                </div>
              ) : (
                <div className="hidden sm:block text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
              )}
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

