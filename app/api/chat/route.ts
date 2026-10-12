import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system?: string } =
    await req.json();

  const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const result = streamText({
    model: groq(modelName),
    system: system || "You are a helpful AI assistant.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
