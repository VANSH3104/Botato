import * as React from "react"
import { UserButton } from "@clerk/nextjs"
import { formatDistanceToNowStrict } from "date-fns"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ChatAvatar } from "@/components/chat-avatar"
import { SidebarHeaderActions } from "@/components/sidebar-header-actions"
import { getBots } from "@/queries/bots"
import type { Bot } from "@/lib/db/schema"

function formatChatDate(date: Date | string | number | null | undefined): string {
  if (!date) return ""
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
    const diff = formatDistanceToNowStrict(d)
    return diff === "0 seconds" ? "just now" : diff
  } catch {
    return ""
  }
}

const USER_BUTTON_APPEARANCE = {
  elements: {
    rootBox: "w-full h-full self-stretch flex items-stretch",
    userButtonTrigger:
      "w-full h-full self-stretch flex items-center gap-2 p-2 rounded-md text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-hidden cursor-pointer !max-w-none !shadow-none",
    userButtonBox: "w-full h-full flex items-center gap-2 flex-row",
    userButtonAvatarBox: "size-8 shrink-0 rounded-full",
    userButtonOuterIdentifier:
      "text-sm font-medium text-sidebar-foreground truncate text-left flex-1 group-data-[collapsible=icon]:hidden",
  },
} satisfies Parameters<typeof UserButton>[0]["appearance"]

export interface AppSidebarProps {
  bots?: Bot[]
}

export async function AppSidebar({ bots: initialBots }: AppSidebarProps = {}) {
  const bots = initialBots ?? (await getBots())

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-end p-2 group-data-[collapsible=icon]:justify-center">
        <SidebarHeaderActions />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            {bots.length === 0 ? (
              <div className="px-2 py-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                No chats yet
              </div>
            ) : (
              <SidebarMenu>
                {bots.map((bot) => (
                  <SidebarMenuItem key={bot.id}>
                    <SidebarMenuButton
                      size="lg"
                      className="h-auto py-2 px-2 gap-2.5 items-center group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
                      tooltip={bot.name}
                    >
                      <ChatAvatar
                        seed={bot.avatar}
                        className="size-8 shrink-0 rounded-md"
                      />
                      <div className="flex flex-1 flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-sidebar-foreground">
                            {bot.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground font-normal">
                            {formatChatDate(bot.createdAt)}
                          </span>
                        </div>
                        {(bot as Bot & { lastChat?: string | null }).lastChat?.trim() ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {(bot as Bot & { lastChat?: string | null }).lastChat?.trim()}
                          </span>
                        ) : null}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<div />}
              className="h-12 w-full p-0 hover:bg-transparent data-active:bg-transparent [&>div]:w-full [&>div]:h-full"
            >
              <UserButton
                showName
                appearance={USER_BUTTON_APPEARANCE}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar