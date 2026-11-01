import * as React from "react"
import { ChatAvatar } from "@/components/chat-avatar"
import { cn } from "@/lib/utils"

export interface GroupChatAvatarProps {
  bots?: { avatar?: string; name?: string }[]
  seed?: string
  className?: string
}

/**
 * Group chat avatar that renders up to 3 visible bot avatars,
 * and shows remaining count as a number.
 * - 1 bot: full single avatar
 * - 2 bots: side by side, overlapping
 * - 3 bots: form a triangle (1 top center, 2 bottom)
 * - 4+ bots: fill a 2x2 grid (3 avatars + count badge)
 */
export function GroupChatAvatar({ bots, seed, className }: GroupChatAvatarProps) {
  // Resolve avatar list from either bots array or comma-separated seed string
  const resolvedAvatars: { avatar: string; name?: string }[] = React.useMemo(() => {
    const list: { avatar: string; name?: string }[] = []
    if (bots && Array.isArray(bots)) {
      for (const b of bots) {
        if (b?.avatar) {
          list.push({ avatar: b.avatar, name: b.name })
        }
      }
    }
    if (list.length < 2 && seed && typeof seed === "string") {
      const parts = seed.split(",").map((s) => s.trim()).filter(Boolean)
      if (parts.length > list.length) {
        return parts.map((part) => ({ avatar: part }))
      }
    }
    return list
  }, [bots, seed])

  if (resolvedAvatars.length === 0) {
    return (
      <div
        className={cn(
          "size-8 shrink-0 rounded-lg bg-muted/60 flex items-center justify-center text-xs text-muted-foreground border border-border/60",
          className
        )}
      >
        👥
      </div>
    )
  }

  if (resolvedAvatars.length === 1) {
    return <ChatAvatar seed={resolvedAvatars[0].avatar} className={className} />
  }

  if (resolvedAvatars.length === 2) {
    return (
      <div
        className={cn(
          "relative size-8 shrink-0 rounded-lg bg-muted/40 border border-border/60 overflow-hidden",
          className
        )}
      >
        {/* Top-left bot */}
        <div
          className="absolute top-0 left-0 rounded-full overflow-hidden ring-1.5 ring-background shadow-xs z-10 flex items-center justify-center bg-background"
          style={{ width: "66%", height: "66%" }}
        >
          <ChatAvatar seed={resolvedAvatars[0].avatar} className="size-full object-cover" />
        </div>
        {/* Bottom-right bot */}
        <div
          className="absolute bottom-0 right-0 rounded-full overflow-hidden ring-1.5 ring-background shadow-sm z-20 flex items-center justify-center bg-background"
          style={{ width: "66%", height: "66%" }}
        >
          <ChatAvatar seed={resolvedAvatars[1].avatar} className="size-full object-cover" />
        </div>
      </div>
    )
  }

  if (resolvedAvatars.length === 3) {
    return (
      <div
        className={cn(
          "relative size-8 shrink-0 rounded-lg bg-muted/40 border border-border/60 overflow-hidden",
          className
        )}
      >
        {/* Top center */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full overflow-hidden ring-1.5 ring-background shadow-xs z-20 flex items-center justify-center bg-background"
          style={{ width: "56%", height: "56%" }}
        >
          <ChatAvatar seed={resolvedAvatars[0].avatar} className="size-full object-cover" />
        </div>
        {/* Bottom left */}
        <div
          className="absolute bottom-0 left-0 rounded-full overflow-hidden ring-1.5 ring-background shadow-xs z-10 flex items-center justify-center bg-background"
          style={{ width: "56%", height: "56%" }}
        >
          <ChatAvatar seed={resolvedAvatars[1].avatar} className="size-full object-cover" />
        </div>
        {/* Bottom right */}
        <div
          className="absolute bottom-0 right-0 rounded-full overflow-hidden ring-1.5 ring-background shadow-xs z-10 flex items-center justify-center bg-background"
          style={{ width: "56%", height: "56%" }}
        >
          <ChatAvatar seed={resolvedAvatars[2].avatar} className="size-full object-cover" />
        </div>
      </div>
    )
  }

  // 4 or more bots: 2x2 grid with up to 3 avatars + count number
  const remaining = resolvedAvatars.length - 3
  return (
    <div
      className={cn(
        "relative size-8 shrink-0 rounded-lg bg-muted/40 border border-border/60 p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden",
        className
      )}
    >
      <div className="size-full rounded-xs overflow-hidden flex items-center justify-center bg-background">
        <ChatAvatar seed={resolvedAvatars[0].avatar} className="size-full object-cover" />
      </div>
      <div className="size-full rounded-xs overflow-hidden flex items-center justify-center bg-background">
        <ChatAvatar seed={resolvedAvatars[1].avatar} className="size-full object-cover" />
      </div>
      <div className="size-full rounded-xs overflow-hidden flex items-center justify-center bg-background">
        <ChatAvatar seed={resolvedAvatars[2].avatar} className="size-full object-cover" />
      </div>
      <div className="size-full rounded-xs overflow-hidden bg-muted/90 text-foreground flex items-center justify-center font-bold text-[9px] font-mono leading-none select-none">
        +{remaining}
      </div>
    </div>
  )
}

export default GroupChatAvatar
