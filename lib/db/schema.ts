import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const bot = pgTable(
  "bot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("bot_user_id_idx").on(table.userId)],
);

export const bots = bot;