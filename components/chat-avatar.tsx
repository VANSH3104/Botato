import Image from "next/image"
import { Avatar, Style } from "@dicebear/core"
import bottts from "@dicebear/styles/bottts.json"
import { cn } from "@/lib/utils"

export interface ChatAvatarProps {
  /** Unique identifier used to seed the generated avatar. */
  seed: string
  /** When true, applies an idle animation effect. */
  animated?: boolean
  /** Additional classes so callers can resize / style the avatar. */
  className?: string
}

const AVATAR_SIZE = 32
const style = new Style(bottts)

function buildAvatarSrc(seed: string): string {
  const avatar = new Avatar(style, {
    seed,
    size: AVATAR_SIZE,
  })
  return avatar.toDataUri()
}

/**
 * A chat avatar rendered from the DiceBear "bottts" style.
 *
 * Renders a 32x32 avatar by default; pass `className` to resize it (e.g.
 * `size-10` or `size-16`). The SVG is produced via DiceBear and served through
 * `next/image`.
 */
export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = buildAvatarSrc(seed)

  return (
    <Image
      src={src}
      alt={`Avatar for ${seed}`}
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      unoptimized
      className={cn("size-8", animated && "animate-pulse", className)}
    />
  )
}

export default ChatAvatar