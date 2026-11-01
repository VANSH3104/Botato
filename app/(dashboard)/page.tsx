import { auth } from "@clerk/nextjs/server"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { ChatAvatar } from "@/components/chat-avatar"
import { nanoid } from "nanoid"

import { BotDialog } from "@/components/bot-dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { BotatoLogo } from "@/components/logo"

export const dynamic = "force-dynamic"

export default async function Page() {
  await auth.protect()
  const seed = nanoid()

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      <header className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-background px-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 mr-0.5 sm:mr-1 shrink-0" />
          <BotatoLogo iconClassName="size-5" />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <Empty className="max-w-md w-full my-auto">
          <EmptyHeader>
            <EmptyMedia>
              <ChatAvatar seed={seed} className="size-16" />
            </EmptyMedia>
            <EmptyTitle>Meet your first bot</EmptyTitle>
            <EmptyDescription>
              Every bot gets its own personality, memory, and face. Spin one up and start the
              conversation.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <BotDialog
              trigger={
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Create a new bot
                </Button>
              }
            />
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}
