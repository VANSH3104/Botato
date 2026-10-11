import { formatDistanceToNowStrict } from "date-fns"
export { cn } from "cn"

export function formatChatDate(date: Date | string | number | null | undefined): string {
  if (!date) return ""
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    const diff = formatDistanceToNowStrict(d)
    return diff === "0 seconds" ? "just now" : diff
  } catch {
    return ""
  }
}
