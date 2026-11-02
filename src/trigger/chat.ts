import { chat, defaultStorage } from "@trigger.dev/sdk/ai";
import { groq } from "@ai-sdk/groq";
import { isStepCount, tool, generateText, type ToolSet } from "ai";
import { z } from "zod";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bots, groupChats, groupChatMembers } from "@/lib/db/schema";
import { sandboxTools } from "@/lib/sandbox/tools";
import { ensureBotSandbox, readBotMemory } from "@/lib/sandbox/memory";
import { getActiveMcpTools } from "@/lib/mcp/resolver";

export const chatAgent = chat.agent({
  id: "chat-agent",
  storage: defaultStorage,
  tools: sandboxTools,
  run: async ({ messages, signal, streamText, clientData, chatId }) => {
    const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const data = (clientData ?? {}) as Record<string, unknown>;

    let isGroup = Boolean(data.isGroup);
    let groupName = typeof data.groupName === "string" ? data.groupName : "Group";
    let groupMembers: Array<{
      id: string;
      name: string;
      job: string | null;
      instructions: string | null;
      sandboxId: string | null;
    }> = [];

    let chatUserId: string | null = typeof data.userId === "string" ? data.userId : null;

    // Query group chat or individual bot details
    if (chatId) {
      try {
        const [group] = await db
          .select()
          .from(groupChats)
          .where(eq(groupChats.id, chatId))
          .limit(1);

        if (group) {
          chatUserId = group.userId;
          isGroup = true;
          groupName = group.name;
          const memberRows = await db
            .select({ botId: groupChatMembers.botId })
            .from(groupChatMembers)
            .where(eq(groupChatMembers.groupChatId, group.id));

          const botIds = memberRows.map((r) => r.botId);
          if (botIds.length > 0) {
            groupMembers = await db
              .select({
                id: bots.id,
                name: bots.name,
                job: bots.job,
                instructions: bots.instructions,
                sandboxId: bots.sandboxId,
              })
              .from(bots)
              .where(inArray(bots.id, botIds));
          }
        }
      } catch (err) {
        console.error("Failed to query group details for chat agent:", err);
      }
    }

    // Determine which bot should respond for this turn
    let activeBot: {
      id: string;
      name: string;
      job: string | null;
      instructions: string | null;
      sandboxId: string | null;
    } | null = null;
    let userOtherBots: Array<{ id: string; name: string; job: string | null }> = [];

    if (isGroup && groupMembers.length > 0) {
      // 1. Check if the latest user message mentions any bots with @Name
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      const mentionedBotsWithIndex: Array<{
        member: (typeof groupMembers)[number];
        index: number;
      }> = [];

      if (lastUserMsg) {
        const rawContent = (lastUserMsg as { content?: unknown }).content;
        const rawParts = (lastUserMsg as { parts?: Array<{ type?: string; text?: string }> }).parts;
        let textContent = "";

        if (typeof rawContent === "string") {
          textContent = rawContent;
        } else if (Array.isArray(rawContent)) {
          textContent = rawContent
            .filter((p): p is { type: "text"; text: string } => (p as { type: string }).type === "text")
            .map((p) => p.text)
            .join(" ");
        } else if (Array.isArray(rawParts)) {
          textContent = rawParts
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text!)
            .join(" ");
        }

        const lowerContent = textContent.toLowerCase();

        for (const member of groupMembers) {
          const escapedName = member.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`@${escapedName}(?:\\b|\\s|:|,|$)`, "i");
          const matchIdx = textContent.search(regex);
          if (matchIdx !== -1) {
            mentionedBotsWithIndex.push({ member, index: matchIdx });
          } else {
            const lowerIdx = lowerContent.indexOf(`@${member.name.toLowerCase().trim()}`);
            if (lowerIdx !== -1) {
              mentionedBotsWithIndex.push({ member, index: lowerIdx });
            }
          }
        }
        mentionedBotsWithIndex.sort((a, b) => a.index - b.index);
      }

      if (mentionedBotsWithIndex.length > 0) {
        activeBot = mentionedBotsWithIndex[0].member;
      } else if (typeof data.selectedBotId === "string") {
        activeBot = groupMembers.find((m) => m.id === data.selectedBotId) ?? null;
      }

      if (!activeBot) {
        activeBot = groupMembers[0];
      }
    } else if (chatId) {
      // Individual bot chat
      try {
        const [row] = await db
          .select({
            id: bots.id,
            name: bots.name,
            job: bots.job,
            instructions: bots.instructions,
            sandboxId: bots.sandboxId,
            userId: bots.userId,
          })
          .from(bots)
          .where(eq(bots.id, chatId))
          .limit(1);

        if (row) {
          activeBot = row;
          chatUserId = row.userId;
          if (row.userId) {
            userOtherBots = await db
              .select({
                id: bots.id,
                name: bots.name,
                job: bots.job,
              })
              .from(bots)
              .where(and(eq(bots.userId, row.userId), ne(bots.id, row.id)));
          }
        }
      } catch (err) {
        console.error("Failed to query bot details for chat agent:", err);
      }
    }

    if (!activeBot && typeof data.selectedBotId === "string") {
      activeBot = {
        id: data.selectedBotId as string,
        name: (data.botName as string) || "Assistant",
        job: (data.botJob as string) || null,
        instructions: (data.botInstructions as string) || null,
        sandboxId: null,
      };
    }

    // Load persistent sandboxes and memories for multi-bot turns
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    let multiBots: typeof groupMembers = [];
    if (isGroup && groupMembers.length > 0 && lastUserMsg) {
      const rawContent = (lastUserMsg as { content?: unknown }).content;
      const rawParts = (lastUserMsg as { parts?: Array<{ type?: string; text?: string }> }).parts;
      let textContent = "";
      if (typeof rawContent === "string") {
        textContent = rawContent;
      } else if (Array.isArray(rawContent)) {
        textContent = rawContent
          .filter((p): p is { type: "text"; text: string } => (p as { type: string }).type === "text")
          .map((p) => p.text)
          .join(" ");
      } else if (Array.isArray(rawParts)) {
        textContent = rawParts
          .filter((p) => p.type === "text" && typeof p.text === "string")
          .map((p) => p.text!)
          .join(" ");
      }
      const lowerContent = textContent.toLowerCase();
      const detected: Array<{ member: (typeof groupMembers)[number]; index: number }> = [];
      for (const member of groupMembers) {
        const escapedName = member.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`@${escapedName}(?:\\b|\\s|:|,|$)`, "i");
        const matchIdx = textContent.search(regex);
        if (matchIdx !== -1) {
          detected.push({ member, index: matchIdx });
        } else {
          const lowerIdx = lowerContent.indexOf(`@${member.name.toLowerCase().trim()}`);
          if (lowerIdx !== -1) {
            detected.push({ member, index: lowerIdx });
          }
        }
      }
      detected.sort((a, b) => a.index - b.index);
      if (detected.length > 1) {
        multiBots = detected.map((d) => d.member);
      }
    }

    const multiBotContexts: Array<{
      bot: (typeof groupMembers)[number];
      sandboxId: string | null;
      memory: string | null;
    }> = [];

    if (multiBots.length > 1) {
      for (const m of multiBots) {
        let sId = m.sandboxId;
        let mem: string | null = null;
        try {
          sId = await ensureBotSandbox({
            id: m.id,
            name: m.name,
            sandboxId: m.sandboxId,
          });
          if (sId) {
            mem = await readBotMemory(sId);
          }
        } catch (e) {
          console.error(`Failed to ensure memory for ${m.name}:`, e);
        }
        multiBotContexts.push({ bot: m, sandboxId: sId, memory: mem });
      }
    }

    const botName = activeBot?.name || (typeof data.botName === "string" ? data.botName.trim() : "") || "Botato";
    const botJob = activeBot?.job || (typeof data.botJob === "string" ? data.botJob.trim() : "") || "Helpful AI assistant";
    const botInstructions = activeBot?.instructions || (typeof data.botInstructions === "string" ? data.botInstructions.trim() : "");
    const activeBotId = activeBot?.id || chatId || "botato";

    // Ensure active bot has a persistent sandbox and read its MEMORY.md
    let activeSandboxId = activeBot?.sandboxId || null;
    let memoryContent: string | null = null;

    if (activeBot?.id) {
      try {
        activeSandboxId = await ensureBotSandbox({
          id: activeBot.id,
          name: activeBot.name,
          sandboxId: activeBot.sandboxId,
        });
        if (activeSandboxId) {
          memoryContent = await readBotMemory(activeSandboxId);
        }
      } catch (err) {
        console.error("Failed to ensure bot sandbox / memory:", err);
      }
    }

    const otherMembers = groupMembers.filter((m) => m.id !== activeBotId);

    // Inter-bot consultation tool for group chats
    const consultBotTool = tool({
      description: `Inter-bot consultation and delegation tool for group chats. Consult or delegate a task to a specialized peer bot when the user's request falls outside your domain or requires another member's expertise.
Available peers in this group:
${otherMembers.map((m) => `- @${m.name} (Job: "${m.job || "Assistant"}"): ${m.instructions || "General instructions"}`).join("\n")}
Call this tool directly as a function. DO NOT run this in bash or executeCommand.`,
      inputSchema: z.object({
        botName: z.string().describe(
          `The name of the peer bot to consult (one of: ${otherMembers.map((m) => m.name).join(", ") || "peer bot"})`
        ),
        query: z.string().describe("The specific question, context, or request to ask the peer bot."),
      }),
      execute: async ({ botName, query }) => {
        const cleanName = botName.replace(/^@/, "").trim().toLowerCase();
        const peer = groupMembers.find(
          (b) => b.name.toLowerCase() === cleanName || b.name.toLowerCase().includes(cleanName)
        );
        if (!peer) {
          return {
            success: false,
            error: `Bot "${botName}" is not in this group chat. Available bots: ${groupMembers.map((b) => b.name).join(", ")}`,
          };
        }

        if (peer.id === activeBotId) {
          return {
            success: false,
            error: `You cannot consult yourself. You are already @${peer.name}. Handle the request directly.`,
          };
        }

        let peerMemory: string | null = null;
        try {
          const sId = await ensureBotSandbox({
            id: peer.id,
            name: peer.name,
            sandboxId: peer.sandboxId,
          });
          if (sId) {
            peerMemory = await readBotMemory(sId);
          }
        } catch (e) {
          console.error(`Failed to load memory for peer ${peer.name}:`, e);
        }

        try {
          const peerResponse = await generateText({
            model: groq(modelName),
            instructions: [
              `Your name is "${peer.name}". You are an AI assistant participating in a group chat.`,
              `Your designated job / profession: ${peer.job || "Helpful assistant"}.`,
              peer.instructions ? `Your instructions and guidelines:\n${peer.instructions}` : "",
              peerMemory ? `Your persistent memory notes (MEMORY.md):\n"""\n${peerMemory}\n"""` : "",
              `A question was asked in the group that needs your domain expertise: "${query}". Speak directly to the user as ${peer.name} in your natural persona and role. Provide your full, comprehensive, high-quality answer.`,
            ]
              .filter(Boolean)
              .join("\n\n"),
            prompt: query,
            maxOutputTokens: 1500,
            abortSignal: signal,
          });

          return {
            success: true,
            botId: peer.id,
            botName: peer.name,
            botJob: peer.job,
            response: peerResponse.text,
            uiFormatRequirement: `Display in own bubble: <!--bot:${peer.id}-->\n[${peer.name}]:\n(exact response)`,
          };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to consult peer bot",
          };
        }
      },
    });

    let mcpTools: ToolSet = {};
    if (chatUserId) {
      mcpTools = await getActiveMcpTools({
        userId: chatUserId,
        botId: activeBot?.id,
      });
    }

    const activeTools = {
      ...sandboxTools,
      ...(isGroup ? { consultBot: consultBotTool } : {}),
      ...mcpTools,
    };

    const instructionsList: string[] = [];

    if (multiBotContexts.length > 1) {
      instructionsList.push(
        `MULTI-AGENT COLLABORATIVE ORCHESTRATION:`,
        `The user has explicitly addressed multiple bots in their message: ${multiBotContexts.map((c) => `@${c.bot.name} (${c.bot.job || "Member"})`).join(" and ")}.`,
        `You MUST generate the authentic, individual response for EACH addressed bot in the sequence: ${multiBotContexts.map((c) => c.bot.name).join(" then ")}.`,
        `DO NOT have one bot ask the other "Your turn" and then stop! Both bots MUST ignite and express their full thoughts and opinions RIGHT NOW in this single response.`,
        `FORMAT REQUIREMENT: For each bot, you MUST start their response with their delimiter on its own line:`,
        `<!--bot:BOT_ID-->\n[BOT_NAME]:\n(their full, individual perspective, thoughts, and advice here)\n`,
        `Then leave two blank newlines, followed immediately by the next bot's response:`,
        `<!--bot:NEXT_BOT_ID-->\n[NEXT_BOT_NAME]:\n(their full, individual perspective, thoughts, and advice here)\n`,
        `Here are the personas and persistent memories for each addressed bot:`,
        ...multiBotContexts.map(
          (c) => `=== BOT: ${c.bot.name} (ID: ${c.bot.id}) ===
Designated Job: ${c.bot.job || "Assistant"}
Persona Guidelines:
${c.bot.instructions || "Act according to your job title."}
Persistent Memory (MEMORY.md):
${c.memory ? `"""\n${c.memory.slice(0, 800)}\n"""` : "No prior memory notes recorded yet."}
Sandbox ID: ${c.sandboxId || "none"}`
        ),
        `Ensure EACH bot responds in their own unique persona, tone, and viewpoint based on their own memory and role. Do not combine their summaries or blend their voices.`
      );
    } else {
      instructionsList.push(
        `Your name is "${botName}". You must ALWAYS identify as ${botName} and never claim to be any other entity or "Botato" unless your name is explicitly Botato.`,
        `Your designated job / profession: ${botJob}. Strictly adopt this persona, voice, tone, and focus area.`,
        botInstructions
          ? `Strict behavioral guidelines and description:\n"""\n${botInstructions}\n"""\nYou must behave strictly according to these instructions and description, and NOT other than that. Do not act as a generic AI.`
          : `Answer strictly through the perspective of your role (${botJob}). Do not act outside this role.`
      );

      if (isGroup) {
        instructionsList.push(
          `GROUP CHAT CONTEXT & UNIVERSAL AUTONOMOUS DELEGATION:`,
          `You are participating in a group chat named "${groupName}".`,
          `ALL GROUP MEMBERS & THEIR SPECIALTIES:
${groupMembers.map((m) => `- @${m.name} (ID: ${m.id}, Job: "${m.job || "Assistant"}"): ${m.instructions || "General instructions"}`).join("\n")}`,
          `MANDATORY AUTONOMOUS SCOPE EVALUATION & DELEGATION (APPLIES TO ALL BOTS):
1. SCOPE SELF-EVALUATION:
   - You are currently acting strictly as "${botName}" (${botJob}).
   - When a user asks a question, first evaluate if it is within your designated job (${botJob}).
2. DELEGATION CHECK:
   - If the request is outside your domain and requires the expertise of another group member:
     * Deep research, RFCs, technical documentation, comparative benchmarks, fact-finding -> Delegate to a Research specialist (e.g. @Ada).
     * Coding, algorithms, debugging, scripts, software engineering -> Delegate to a Developer / Engineer bot.
     * UI design, CSS styling, visual aesthetics, layout -> Delegate to a Designer bot.
     * Any domain matching another member's specific job.
   - WHEN DELEGATING:
     * DO NOT attempt to answer the specialized request yourself.
     * DO NOT output empty text promises or pre-announcements (e.g., do NOT say "I will consult..." or "before I summarize it for you").
     * YOUR FIRST ACTION MUST BE CALLING THE \`consultBot\` TOOL directly with botName and query!
     * NEVER call \`consultBot\` inside \`executeCommand\` (it is a function tool, NOT a bash command).
3. MULTI-BUBBLE RENDERING AFTER \`consultBot\` RETURNS:
   - Once \`consultBot\` returns with the peer's response, format your final response so that BOTH bots speak in their own distinct bubbles:
   
   <!--bot:${activeBotId}-->
   [${botName}]:
   (A brief, natural 1-sentence handover, e.g. "That's squarely in @[PeerName]'s specialty — passing this to @[PeerName]:")

${otherMembers.map((m) => `   <!--bot:${m.id}-->\n   [${m.name}]:\n   (The exact peer response returned by consultBot)`).join("\n\nor\n\n")}

4. DIRECT RESPONSE (WHEN NOT DELEGATING):
   - If the request IS within your scope, or if no other bot in the group has a more relevant specialty:
     At the very beginning of your response, output:
     <!--bot:${activeBotId}-->
     [${botName}]:
     (Your full, helpful response directly in your persona)`
        );
      } else {
        instructionsList.push(
          `1:1 SOLO CHAT & DOMAIN BOUNDARY EVALUATION:`,
          `You are in a direct 1:1 conversation with the user. Your role is "${botJob}".`,
          `First, evaluate if the user's request is within your role:`,
          userOtherBots.length > 0
            ? `- If the user asks for work that requires a distinct specialty outside your role (e.g., deep technical research, documentation investigation, specialized coding, or design), check if the user has an agent built for it.
- The user has these other specialized agents available:
${userOtherBots.map((b) => `  * @${b.name} (${b.job || "Specialist"})`).join("\n")}
- If the task is much better suited for one of these agents, inform the user clearly:
  "I think this task is better handled by @[AgentName] ([AgentJob]). You can ask them directly or add us together in a group chat for collaborative work!"
- However, do NOT leave the user with an empty response: after suggesting the better agent, provide the best, most accurate baseline answer you can within your capabilities.`
            : `- If no other specialized agent exists in the workspace, do your best to answer accurately and helpfully within your capabilities.`
        );
      }
    }

    if (activeSandboxId) {
      instructionsList.push(
        `PERSISTENT MEMORY & SANDBOX:`,
        `Your persistent sandbox ID is "${activeSandboxId}". You have access to sandbox tools (executeCommand, writeFile, readFile, listFiles, browseWeb). When using sandbox tools, always pass sandboxId: "${activeSandboxId}".`,
        `You have a persistent file called "MEMORY.md" in your sandbox workspace.`,
        memoryContent
          ? `Current contents of MEMORY.md:\n"""\n${memoryContent.slice(0, 800)}\n"""`
          : `MEMORY.md currently has no entries.`,
        `CRITICAL AUTONOMOUS MEMORY INSTRUCTIONS:
- PROACTIVE NOTE-TAKING: Whenever the user mentions personal details, project updates, preferences, or pending tasks, update "MEMORY.md" using \`writeFile\` in the background. Keep notes organized and concise.
- AUTOMATIC RECALL: Seamlessly apply facts from MEMORY.md above into your answers without needing to be asked.
- CROSS-CHAT RECALL: Your MEMORY.md is persistent across 1:1 and group chats.`
      );
    } else {
      instructionsList.push(
        `You have access to an execution sandbox. When appropriate, use sandbox tools (executeCommand, writeFile, readFile, listFiles, browseWeb) to complete tasks requested by the user within your role. Keep commands concise.`
      );
    }

    instructionsList.push(
      `CRITICAL COMPLETION REQUIREMENT: You must ALWAYS provide a complete, final helpful response to the user with actual answers, recommendations, links, or code. NEVER stop at an intermediate sentence like "Let me check..." or "Let me try...". If tools have executed, synthesize the findings immediately into a thorough final response for the user. Do not chatter apologies or internal stream-of-consciousness between tool calls.`,
      `NATURAL HUMAN CONVERSATIONAL STYLE:
- Talk like a real, thoughtful human colleague in chat — engaging, natural, and direct.
- DO NOT format regular conversation into robotic bullet point lists. Use fluid paragraphs and natural prose for your commentary, thoughts, and advice.
- ONLY use bullet points or numbered lists when strictly needed (e.g., chronological steps, technical checklists, or itemized options).
- Avoid generic intro templates like "Here are a few key points:" or "Totally here for this." Speak naturally and authentically in your persona.`
    );

    if (Object.keys(mcpTools).length > 0) {
      instructionsList.push(
        `CONNECTED APPS & MCP TOOLS:`,
        `You have direct access to active external MCP tools (${Object.keys(mcpTools).join(", ")}).`,
        `CRITICAL RULES FOR CONNECTED TOOLS:`,
        `1. Authentication is ALREADY configured and verified on the server. NEVER ask the user for API tokens, secret keys, or credentials in chat.`,
        `2. When asked to create, find, list, or update items in Notion or any connected service, call the appropriate tool directly (e.g. use search tools first to find target pages or databases, then call creation or update tools).`,
        `3. Execute actions immediately with your tools instead of telling the user how to do it manually.`
      );
    }

    const instructions = instructionsList.join("\n\n");

    // Window history to the latest 4 messages to stay strictly within Groq's 8,000 TPM limit
    const MAX_WINDOW = 4;
    let windowedMessages = messages.length > MAX_WINDOW ? messages.slice(-MAX_WINDOW) : messages;

    // Avoid starting with an orphaned tool message in the sliding window
    while (
      windowedMessages.length > 2 &&
      (windowedMessages[0].role === "tool" || (windowedMessages[0] as { type?: string }).type === "tool")
    ) {
      windowedMessages = windowedMessages.slice(1);
    }

    // Compact history aggressively: cap prior text to 300 chars and tool results tightly
    const compactMessages = windowedMessages.map((msg, index) => {
      const isLatestUser = index === windowedMessages.length - 1 && msg.role === "user";

      if (typeof msg.content === "string") {
        const maxLen = isLatestUser ? 800 : 300;
        if (msg.content.length > maxLen) {
          return { ...msg, content: msg.content.slice(0, maxLen) + "\n...[truncated]" };
        }
        return msg;
      }

      if (Array.isArray(msg.content)) {
        const compactedParts = msg.content.map((part) => {
          const p = part as Record<string, unknown>;
          if (p.type === "text" && typeof p.text === "string") {
            const maxLen = isLatestUser ? 800 : 300;
            if (p.text.length > maxLen) {
              return { ...p, text: p.text.slice(0, maxLen) + "\n...[truncated]" };
            }
            return p;
          }
          if (p.type === "file") {
            const mediaType = typeof p.mediaType === "string" ? p.mediaType : "";
            const url = typeof p.url === "string" ? p.url : "";
            const filename = typeof p.filename === "string" ? p.filename : "file";

            // If it's a text-based file (code, json, markdown, txt) sent as data URL, decode to text
            if (
              url.startsWith("data:") &&
              !mediaType.startsWith("image/") &&
              (mediaType.startsWith("text/") ||
                mediaType.includes("json") ||
                mediaType.includes("javascript") ||
                mediaType.includes("typescript") ||
                mediaType.includes("xml"))
            ) {
              try {
                const base64Index = url.indexOf(";base64,");
                if (base64Index !== -1) {
                  const b64 = url.slice(base64Index + 8);
                  const decoded = Buffer.from(b64, "base64").toString("utf-8");
                  const truncated = decoded.slice(0, 1500);
                  return {
                    type: "text",
                    text: `\n[Attached File: ${filename}]\n\`\`\`\n${truncated}\n\`\`\`\n`,
                  };
                }
              } catch {
                // fall back to original part
              }
            }
            return part;
          }
          if (p.type === "tool-result") {
            const raw = p.output ?? p.result;
            if (typeof raw === "string" && raw.length > 800) {
              const truncated = raw.slice(0, 800) + "\n...[truncated]";
              return { ...p, output: truncated, result: truncated };
            }
            if (typeof raw === "object" && raw !== null) {
              const resObj = { ...raw } as Record<string, unknown>;
              for (const key of Object.keys(resObj)) {
                const val = resObj[key];
                if (typeof val === "string") {
                  if (key === "response") {
                    resObj[key] = val.length > 800 ? val.slice(0, 800) + "\n...[truncated]" : val;
                  } else if (key === "stdout" || key === "summary" || key === "stderr") {
                    resObj[key] = val.length > 500 ? val.slice(0, 500) + "\n...[truncated]" : val;
                  } else if (val.length > 150) {
                    resObj[key] = val.slice(0, 150) + "...";
                  }
                }
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

    // Check if any message part contains an image file
    const hasImagePart = compactMessages.some((msg) =>
      Array.isArray(msg.content) &&
      msg.content.some((p: unknown) => {
        const item = p as Record<string, unknown>;
        return (
          item?.type === "file" &&
          ((typeof item?.mediaType === "string" && item.mediaType.startsWith("image/")) ||
            (typeof item?.url === "string" && item.url.startsWith("data:image/")))
        );
      })
    );

    const activeModel = hasImagePart
      ? (process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview")
      : modelName;

    return streamText({
      model: groq(activeModel),
      instructions,
      messages: compactMessages as typeof messages,
      tools: activeTools,
      maxOutputTokens: 2048,
      stopWhen: [isStepCount(12)],
      abortSignal: signal,
    });
  },
});
