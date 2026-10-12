import { notFound } from "next/navigation"
import { getChat } from "@/chats/queries"
import { ChatHeader } from "@/components/chat-header"
import { ChatView } from "@/components/chat-view"

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
    <div className="flex flex-col flex-1 h-screen max-h-screen overflow-hidden bg-background">
      <ChatHeader chat={chat} />
      <ChatView key={chat.id} chat={chat} />
    </div>
  )
}
