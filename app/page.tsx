import { auth } from "@clerk/nextjs/server"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Image from "next/image"

export default async function Page() {
  await auth.protect()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Image
              src="/bot-avatar.png"
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
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
