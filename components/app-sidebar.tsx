"use client"

import { UserButton } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
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