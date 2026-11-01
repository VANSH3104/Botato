"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { cn, formatChatDate } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import type { BotWithLastChat } from "@/queries/bots"

export interface SidebarSearchProps {
  bots?: BotWithLastChat[]
  className?: string
}

export function SidebarSearch({ bots = [], className }: SidebarSearchProps) {
  const router = useRouter()
  const { setOpenMobile, isMobile } = useSidebar()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        title="Search (⌘K)"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
          "flex items-center justify-between font-normal text-muted-foreground shadow-none",
          "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 cursor-pointer",
          "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:text-sidebar-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:size-4" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Search
          </span>
        </div>
        <Kbd className="group-data-[collapsible=icon]:hidden">⌘K</Kbd>
        <span className="sr-only">Search chats</span>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Search your bots and chats"
      >
        <CommandInput placeholder="Search chats..." />
        <CommandList>
          <CommandEmpty>No chats found.</CommandEmpty>
          <CommandGroup heading="Chats">
            {bots.map((bot) => (
              <CommandItem
                key={bot.id}
                value={`${bot.name} ${bot.lastChat ?? ""}`}
                onSelect={() => {
                  setOpen(false)
                  if (isMobile) {
                    setOpenMobile(false)
                  }
                  router.push(`/chats/${bot.id}`)
                }}
                className="flex items-center gap-2.5 py-2 cursor-pointer"
              >
                {bot.isGroup ? (
                  <GroupChatAvatar
                    bots={bot.bots}
                    seed={bot.avatar}
                    className="size-7 shrink-0 rounded-md"
                  />
                ) : (
                  <ChatAvatar
                    seed={bot.avatar}
                    className="size-7 shrink-0 rounded-md"
                  />
                )}
                <div className="flex flex-1 flex-col min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {bot.name}
                    </span>
                    {bot.lastChatAt || (bot.lastChat && bot.createdAt) ? (
                      <span className="shrink-0 text-xs text-muted-foreground font-normal">
                        {formatChatDate(bot.lastChatAt ?? bot.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  {bot.lastChat?.trim() ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {bot.lastChat.trim()}
                    </span>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
