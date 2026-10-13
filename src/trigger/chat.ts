import { chat, defaultStorage } from "@trigger.dev/sdk/ai";
import { groq } from "@ai-sdk/groq";

export const chatAgent = chat.agent({
  id: "chat-agent",
  storage: defaultStorage,
  run: async ({ messages, signal, streamText }) => {
    const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

    return streamText({
      model: groq(modelName),
      messages,
      abortSignal: signal,
    });
  },
});
