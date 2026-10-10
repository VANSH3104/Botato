import { db } from "./client";
import { bots } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Inserts a new bot for a Clerk user.
 * The `userId` is the Clerk (third-party) user id.
 */
export async function insertBot(params: {
  clerkId: string;
  name: string;
  instructions?: string | null;
}) {
  const { clerkId, name, instructions } = params;

  const [row] = await db
    .insert(bots)
    .values({
      userId: clerkId,
      name,
      instructions: instructions ?? null,
    })
    .returning();

  return row;
}

export async function getBotByUserId(clerkId: string) {
  const [row] = await db
    .select()
    .from(bots)
    .where(eq(bots.userId, clerkId))
    .limit(1);

  return row ?? null;
}

export async function getBotById(botId: string) {
  const [row] = await db
    .select()
    .from(bots)
    .where(eq(bots.id, botId))
    .limit(1);

  return row ?? null;
}

export async function updateBotSandbox(botId: string, sandboxId: string) {
  const [row] = await db
    .update(bots)
    .set({ sandboxId })
    .where(eq(bots.id, botId))
    .returning();

  return row ?? null;
}

export async function listBotsForUser(clerkId: string) {
  return db.select().from(bots).where(eq(bots.userId, clerkId));
}