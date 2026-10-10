import Image from "next/image"
import { Avatar, Style } from "@dicebear/core"
import thumbs from "@dicebear/styles/thumbs.json"
import { cn } from "@/lib/utils"

export interface ChatAvatarProps {
  /** Unique identifier used to seed the generated avatar. */
  seed: string
  /** When true, the avatar plays its built-in idle animation. */
  animated?: boolean
  /** Additional classes so callers can resize / style the avatar. */
  className?: string
}

const AVATAR_SIZE = 32
const style = new Style(thumbs)

function buildAvatarSrc(seed: string, animated: boolean): string {
  const avatar = new Avatar(style, {
    seed,
    size: AVATAR_SIZE,
    animationVariant: animated ? "slow" : "none",
    animationProbability: 100,
  })
  return avatar.toDataUri()
}

/**
 * A chat avatar rendered from a DiceBear "thumbs" style.
 *
 * Renders a 32x32 avatar by default; pass `className` to resize it (e.g.
 * `size-10`). The SVG is produced via DiceBear and served through
 * `next/image`.
 */
export function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const src = buildAvatarSrc(seed, animated)

  return (
    <Image
      src={src}
      alt={`Avatar for ${seed}`}
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      unoptimized
      className={cn("size-8", className)}
    />
  )
}

export default ChatAvatar