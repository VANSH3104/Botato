import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
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