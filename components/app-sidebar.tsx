import * as React from "react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { BotatoIcon } from "@/components/logo"

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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { SidebarHeaderActions } from "@/components/sidebar-header-actions"
import { SidebarSearch } from "@/components/sidebar-search"
import { SidebarChatList } from "@/components/sidebar-chat-list"
import { getBots, type BotWithLastChat } from "@/queries/bots"

const USER_BUTTON_APPEARANCE = {
  elements: {
    rootBox:
      "w-full h-full self-stretch flex items-stretch group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center",
    userButtonTrigger:
      "w-full h-full self-stretch flex flex-row-reverse justify-end items-center gap-2.5 p-2 rounded-md text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-hidden cursor-pointer !max-w-none !shadow-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
    userButtonBox:
      "flex items-center gap-2.5 flex-row order-1 group-data-[collapsible=icon]:justify-center",
    userButtonAvatarBox: "size-8 shrink-0 rounded-full group-data-[collapsible=icon]:size-6",
    userButtonOuterIdentifier:
      "text-sm font-medium text-sidebar-foreground truncate text-left flex-1 group-data-[collapsible=icon]:hidden order-2",
    userButtonPopoverFooter: "!hidden hidden",
    footer: "!hidden hidden",
    footerAction: "!hidden hidden",
  },
} satisfies Parameters<typeof UserButton>[0]["appearance"]

export interface AppSidebarProps {
  bots?: BotWithLastChat[]
}

export async function AppSidebar({ bots: initialBots }: AppSidebarProps = {}) {
  const bots = initialBots ?? (await getBots())

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0 gap-0">
        <div className="flex h-12 items-center justify-between px-3 border-b border-sidebar-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-1 text-sm font-semibold tracking-tight text-sidebar-foreground hover:opacity-85 transition-opacity group-data-[collapsible=icon]:hidden"
          >
            <BotatoIcon className="size-5.5" />
            <span>Botato</span>
          </Link>
          <SidebarHeaderActions bots={bots.filter((b) => !b.isGroup)} />
        </div>
        <div className="p-2 group-data-[collapsible=icon]:p-1">
          <SidebarSearch bots={bots} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarChatList bots={bots} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0" />

      <SidebarFooter className="p-2 border-t border-sidebar-border/60 bg-sidebar-accent/15">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<div />}
              className="h-11 w-full p-1.5 rounded-lg hover:bg-sidebar-accent/50 data-active:bg-sidebar-accent/50 transition-colors [&>div]:w-full [&>div]:h-full group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <UserButton
                showName
                appearance={USER_BUTTON_APPEARANCE}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar