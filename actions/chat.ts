"use server";

import { auth } from "@trigger.dev/sdk";
import { chat, defaultStorage } from "@trigger.dev/sdk/ai";

export const startChatSession = chat.createStartSessionAction("chat-agent");

export async function mintChatAccessToken(chatId: string) {
  return auth.createPublicToken({
    scopes: { read: { sessions: chatId }, write: { sessions: chatId } },
    expirationTime: "1h",
  });
}

export const loadTranscript = chat.createLoadTranscriptAction(defaultStorage);

export async function clearChatSession(chatId: string) {
  try {
    await defaultStorage.save(
      { chatId, clientData: undefined } as any,
      {
        transcript: { entries: [], state: null },
        changes: [],
      } as any
    );
    return { success: true };
  } catch (err) {
    console.error("Failed to clear chat session:", err);
    return { success: false };
  }
}
