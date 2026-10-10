import { db } from "./client";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Upserts a Clerk user into the local `users` table.
 * Call this from a server component or route handler after auth resolves.
 */
export async function syncClerkUser(params: {
  clerkId: string;
  email: string;
  name?: string | null;
}) {
  const { clerkId, email, name } = params;

  await db
    .insert(users)
    .values({
      id: randomUUID(),
      clerkId,
      email,
      name: name ?? null,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name: name ?? null, updatedAt: new Date() },
    });
}

export async function getUserByClerkId(clerkId: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return row ?? null;
}