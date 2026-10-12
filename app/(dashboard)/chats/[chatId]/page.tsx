import { notFound } from "next/navigation"
import { getChat } from "@/chats/queries"
import { ChatHeader } from "@/components/chat-header"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const chat = await getChat(chatId)

  if (!chat) {
    notFound()
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-screen bg-background">
      <ChatHeader chat={chat} />
    </div>
  )
}
