"use client"

import * as React from "react"
import { PlusIcon, UsersIcon, Sparkles } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { BotDialog } from "@/components/bot-dialog"
import { GroupChatDialog } from "@/components/group-chat-dialog"
import { McpShowcaseDialog } from "@/components/mcp-showcase-dialog"
import type { Bot } from "@/lib/db/schema"

export interface SidebarHeaderActionsProps {
  bots?: Bot[]
}

export function SidebarHeaderActions({ bots = [] }: SidebarHeaderActionsProps) {
  const [botDialogOpen, setBotDialogOpen] = React.useState(false)
  const [groupChatDialogOpen, setGroupChatDialogOpen] = React.useState(false)
  const [mcpDialogOpen, setMcpDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg bg-transparent hover:bg-sidebar-accent text-sidebar-foreground shadow-none"
            />
          }
        >
          <PlusIcon />
          <span className="sr-only">Create</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setBotDialogOpen(true)} className="cursor-pointer">
              <PlusIcon />
              <span>Create new bot</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupChatDialogOpen(true)} className="cursor-pointer">
              <UsersIcon />
              <span>Create group chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMcpDialogOpen(true)} className="cursor-pointer">
              <Sparkles className="size-4 text-cyan-400" />
              <span>Model Context Protocol</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
      <GroupChatDialog
        open={groupChatDialogOpen}
        onOpenChange={setGroupChatDialogOpen}
        bots={bots}
      />
      <McpShowcaseDialog
        open={mcpDialogOpen}
        onOpenChange={setMcpDialogOpen}
      />
    </>
  )
}
