import { notFound } from "next/navigation"
import { getChat } from "@/chats/queries"
import { ChatWorkspace } from "@/components/chat-workspace"

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

  return <ChatWorkspace key={chat.id} chatId={chat.id} chat={chat} />
}
