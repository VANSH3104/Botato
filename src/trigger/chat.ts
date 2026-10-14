import { chat, defaultStorage } from "@trigger.dev/sdk/ai";
import { groq } from "@ai-sdk/groq";
import { isStepCount } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bots } from "@/lib/db/schema";
import { sandboxTools } from "@/lib/sandbox/tools";

export const chatAgent = chat.agent({
  id: "chat-agent",
  storage: defaultStorage,
  tools: sandboxTools,
  run: async ({ messages, tools, signal, streamText, clientData, chatId }) => {
    const modelName = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    const data = (clientData ?? {}) as Record<string, unknown>;

    let botName = typeof data.botName === "string" ? data.botName.trim() : "";
    let botJob = typeof data.botJob === "string" ? data.botJob.trim() : "";
    let botInstructions = typeof data.botInstructions === "string" ? data.botInstructions.trim() : "";

    // If clientData didn't supply bot info, fetch directly from DB using chatId (which maps to bot.id)
    if ((!botName || !botJob) && chatId) {
      try {
        const [row] = await db
          .select({
            name: bots.name,
            job: bots.job,
            instructions: bots.instructions,
          })
          .from(bots)
          .where(eq(bots.id, chatId))
          .limit(1);

        if (row) {
          if (!botName && row.name) botName = row.name.trim();
          if (!botJob && row.job) botJob = row.job.trim();
          if (!botInstructions && row.instructions) botInstructions = row.instructions.trim();
        }
      } catch (err) {
        console.error("Failed to query bot details for chat agent:", err);
      }
    }

    botName = botName || "Botato";
    botJob = botJob || "Helpful AI assistant";

    const instructions = [
      `Your name is "${botName}". You must ALWAYS identify as ${botName} and never claim to be any other entity or "Botato" unless your name is explicitly Botato.`,
      `Your designated job / profession: ${botJob}. Strictly adopt this persona, voice, tone, and focus area.`,
      botInstructions
        ? `Strict behavioral guidelines and description:\n"""\n${botInstructions}\n"""\nYou must behave strictly according to these instructions and description, and NOT other than that. Do not act as a generic AI.`
        : `Answer strictly through the perspective of your role (${botJob}). Do not act outside this role.`,
      `You have access to an execution sandbox. When appropriate, use sandbox tools (executeCommand, writeFile, readFile, listFiles, browseWeb) to complete tasks requested by the user within your role. Keep commands concise.`,
      `CRITICAL COMPLETION REQUIREMENT: You must ALWAYS provide a complete, final helpful response to the user with actual answers, recommendations, links, or code. NEVER stop at an intermediate sentence like "Let me check..." or "Let me try...". If tools have executed, synthesize the findings immediately into a thorough final response for the user. Do not chatter apologies or internal stream-of-consciousness between tool calls.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Compact history to ensure token usage stays strictly within Groq's 8,000 TPM limit
    const compactMessages = messages.map((msg, index) => {
      if (index === messages.length - 1 && msg.role === "user") return msg;

      if (typeof msg.content === "string") {
        if (msg.content.length > 2000) {
          return { ...msg, content: msg.content.slice(0, 2000) + "\n...[truncated]" };
        }
        return msg;
      }

      if (Array.isArray(msg.content)) {
        const compactedParts = msg.content.map((part) => {
          const p = part as Record<string, unknown>;
          if (p.type === "text" && typeof p.text === "string" && p.text.length > 2000) {
            return { ...p, text: p.text.slice(0, 2000) + "\n...[truncated]" };
          }
          if (p.type === "tool-result") {
            const raw = p.output ?? p.result;
            if (typeof raw === "string" && raw.length > 1500) {
              const truncated = raw.slice(0, 1500) + "\n...[truncated]";
              return { ...p, output: truncated, result: truncated };
            }
            if (typeof raw === "object" && raw !== null) {
              const resObj = { ...raw } as Record<string, unknown>;
              if (typeof resObj.stdout === "string" && resObj.stdout.length > 1500) {
                resObj.stdout = resObj.stdout.slice(0, 1500) + "\n...[truncated]";
              }
              if (typeof resObj.summary === "string" && resObj.summary.length > 1500) {
                resObj.summary = resObj.summary.slice(0, 1500) + "\n...[truncated]";
              }
              return { ...p, output: resObj, result: resObj };
            }
          }
          return part;
        });
        return { ...msg, content: compactedParts };
      }
      return msg;
    });

    return streamText({
      model: groq(modelName),
      instructions,
      messages: compactMessages as typeof messages,
      tools: tools || sandboxTools,
      stopWhen: [isStepCount(12)],
      abortSignal: signal,
    });
  },
});
