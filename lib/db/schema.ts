import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const bots = pgTable(
  "bots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text("job"),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)],
);

export const bot = bots;

export const insertBotSchema = createInsertSchema(bots, {
  name: (schema) => schema.min(1, "Name is required"),
  avatar: (schema) => schema.min(1, "Avatar is required"),
});

export const selectBotSchema = createSelectSchema(bots);

export const createBotInputSchema = insertBotSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    sandboxId: true,
  })
  .extend({
    name: z.string().trim().min(1, "Name is required"),
    avatar: z.string().trim().min(1, "Avatar seed is required"),
    job: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
  });

export const updateBotInputSchema = createBotInputSchema
  .extend({
    id: z.string().min(1, "Bot ID is required"),
  });

export type UpdateBotInput = z.infer<typeof updateBotInputSchema>;

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = z.infer<typeof selectBotSchema>;
export type CreateBotInput = z.infer<typeof createBotInputSchema>;

export const groupChats = pgTable(
  "group_chats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("group_chats_user_id_idx").on(table.userId)],
);

export const groupChatMembers = pgTable(
  "group_chat_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    groupChatId: text("group_chat_id").notNull(),
    botId: text("bot_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("group_chat_members_chat_id_idx").on(table.groupChatId),
    index("group_chat_members_bot_id_idx").on(table.botId),
  ],
);

export const createGroupChatInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  botIds: z.array(z.string()).min(1, "At least one bot is required"),
});

export type GroupChat = typeof groupChats.$inferSelect;
export type GroupChatMember = typeof groupChatMembers.$inferSelect;
export type CreateGroupChatInput = z.infer<typeof createGroupChatInputSchema>;

export const mcpServers = pgTable(
  "mcp_servers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    botId: text("bot_id"), // null if account-wide, or scoped to specific bot
    name: text("name").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    transport: text("transport").notNull().default("http"), // "http" | "sse"
    headersJson: text("headers_json"), // JSON string e.g. {"Authorization": "Bearer ..."}
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("mcp_servers_user_id_idx").on(table.userId),
    index("mcp_servers_bot_id_idx").on(table.botId),
  ],
);

export const insertMcpServerSchema = createInsertSchema(mcpServers, {
  name: (schema) => schema.min(1, "Name is required"),
  url: (schema) => schema.min(1, "URL is required"),
});

export const selectMcpServerSchema = createSelectSchema(mcpServers);

export const createMcpServerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  url: z.string().trim().url("Valid HTTP/HTTPS URL is required"),
  botId: z.string().trim().optional().nullable(),
  headers: z.record(z.string(), z.string()).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
export type CreateMcpServerInput = z.infer<typeof createMcpServerInputSchema>;
