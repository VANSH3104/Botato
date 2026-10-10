import { auth } from "@clerk/nextjs/server"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { ChatAvatar } from "@/components/chat-avatar"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

export default async function Page() {
  await auth.protect()
  const seed = nanoid()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Empty>
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
          <Button>
            <PlusIcon data-icon="inline-start" />
            Create a new bot
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
