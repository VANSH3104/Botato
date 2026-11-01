import { isToday, isYesterday, format, differenceInMinutes } from "date-fns"
export { cn } from "cn"

export function formatChatDate(date: Date | string | number | null | undefined): string {
  if (!date) return ""
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    if (isNaN(d.getTime())) return ""

    const now = new Date()
    const diffMins = differenceInMinutes(now, d)
    if (diffMins < 1) {
      return "just now"
    }
    if (diffMins < 60) {
      return `${diffMins}m`
    }
    if (isToday(d)) {
      return format(d, "h:mm a")
    }
    if (isYesterday(d)) {
      return "Yesterday"
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      return format(d, "EEE")
    }
    return format(d, "MMM d")
  } catch {
    return ""
  }
}

export function cleanSnippet(text: string): string {
  if (!text) return ""
  return text
    .replace(/<!--bot:[^>]*-->/gi, "")
    .replace(/\[[a-zA-Z0-9_\-\s]+\]:\s*/gi, "")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

export function extractSnippetFromMessage(msg: unknown): string | null {
  if (!msg || typeof msg !== "object") return null

  const m = msg as Record<string, unknown>
  if (typeof m.content === "string" && m.content.trim()) {
    const cleaned = cleanSnippet(m.content)
    return cleaned || null
  }

  if (Array.isArray(m.parts)) {
    for (let i = m.parts.length - 1; i >= 0; i--) {
      const part = m.parts[i] as Record<string, unknown> | null
      if (part && part.type === "text" && typeof part.text === "string" && part.text.trim()) {
        const cleaned = cleanSnippet(part.text)
        if (cleaned) return cleaned
      }
    }
  }

  return null
}
