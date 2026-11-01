import * as React from "react"
import { cn } from "@/lib/utils"

export interface BotatoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function BotatoIcon({ className, ...props }: BotatoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 100"
      fill="none"
      className={cn("size-6 shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="bubble-grad-purple" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="45%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="bubble-grad-blue" x1="10%" y1="10%" x2="95%" y2="90%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Left / Upper Speech Bubble (Purple Gradient) */}
      <path
        d="M 44 14
           C 60 14, 70 24, 70 38
           C 70 42, 69 45, 67 48
           C 64 54, 58 60, 48 62
           C 43 63, 34 63, 28 62
           L 17 72
           L 21 58
           C 15 53, 12 46, 12 38
           C 12 24, 26 14, 44 14 Z"
        stroke="url(#bubble-grad-purple)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left Robot Antenna */}
      <line x1="39" y1="23" x2="39" y2="28" stroke="url(#bubble-grad-purple)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="39" cy="20.5" r="2.8" fill="url(#bubble-grad-purple)" />

      {/* Left Robot Head */}
      <rect
        x="25"
        y="28"
        width="28"
        height="20"
        rx="10"
        fill="none"
        stroke="url(#bubble-grad-purple)"
        strokeWidth="3.5"
      />

      {/* Left Robot Ears */}
      <rect x="22" y="33" width="3" height="10" rx="1.5" fill="url(#bubble-grad-purple)" />
      <rect x="53" y="33" width="3" height="10" rx="1.5" fill="url(#bubble-grad-purple)" />

      {/* Left Robot Smiling Eyes */}
      <path
        d="M 31 38 Q 34.5 33.5 38 38"
        stroke="url(#bubble-grad-purple)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 40 38 Q 43.5 33.5 47 38"
        stroke="url(#bubble-grad-purple)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right / Lower Speech Bubble (Cyan / Blue Gradient) */}
      <path
        d="M 72 26
           C 88 26, 98 36, 98 50
           C 98 58, 94 65, 87 70
           L 93 83
           L 80 76
           C 75 78, 68 79, 61 78
           C 53 77, 46 73, 42 66
           C 48 65, 54 62, 58 57
           C 63 52, 66 45, 66 38
           C 66 33, 64 29, 61 26
           C 65 26, 68 26, 72 26 Z"
        stroke="url(#bubble-grad-blue)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Bubble Spark / Idea Rays */}
      <line x1="88" y1="19" x2="92" y2="13" stroke="url(#bubble-grad-blue)" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="96" y1="24" x2="103" y2="21" stroke="url(#bubble-grad-blue)" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="99" y1="32" x2="106" y2="34" stroke="url(#bubble-grad-blue)" strokeWidth="2.8" strokeLinecap="round" />

      {/* Right Robot Head */}
      <rect
        x="63"
        y="39"
        width="28"
        height="20"
        rx="10"
        fill="none"
        stroke="url(#bubble-grad-blue)"
        strokeWidth="3.5"
      />

      {/* Right Robot Ears */}
      <rect x="60" y="44" width="3" height="10" rx="1.5" fill="url(#bubble-grad-blue)" />
      <rect x="91" y="44" width="3" height="10" rx="1.5" fill="url(#bubble-grad-blue)" />

      {/* Right Robot Smiling Eyes */}
      <path
        d="M 69 49 Q 72.5 44.5 76 49"
        stroke="url(#bubble-grad-blue)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 78 49 Q 81.5 44.5 85 49"
        stroke="url(#bubble-grad-blue)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Three Conversation Dots */}
      <circle cx="48" cy="69" r="2.2" fill="url(#bubble-grad-purple)" />
      <circle cx="55" cy="69" r="2.2" fill="url(#bubble-grad-blue)" />
      <circle cx="62" cy="69" r="2.2" fill="url(#bubble-grad-blue)" />
    </svg>
  )
}

export function GitHubIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4 shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

export function BotatoLogo({
  className,
  iconClassName,
  showText = true,
}: {
  className?: string
  iconClassName?: string
  showText?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <BotatoIcon className={cn("size-6.5 shrink-0", iconClassName)} />
      {showText && (
        <span className="font-bold text-base tracking-tight text-foreground">
          Botato
        </span>
      )}
    </div>
  )
}

export default BotatoLogo

