"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { bots, createBotInputSchema, type CreateBotInput, updateBotInputSchema, type UpdateBotInput } from "@/lib/db/schema";

export async function createBot(input: CreateBotInput) {
  const { userId } = await auth.protect();

  const validated = createBotInputSchema.parse(input);

  const [newBot] = await db
    .insert(bots)
    .values({
      userId,
      name: validated.name,
      avatar: validated.avatar,
      job: validated.job ? validated.job : null,
      instructions: validated.instructions ? validated.instructions : null,
    })
    .returning();

  revalidatePath("/");

  return { success: true, bot: newBot };
}

export async function updateBot(input: UpdateBotInput) {
  const { userId } = await auth.protect();

  const validated = updateBotInputSchema.parse(input);

  const [updatedBot] = await db
    .update(bots)
    .set({
      name: validated.name,
      avatar: validated.avatar,
      job: validated.job ?? null,
      instructions: validated.instructions ?? null,
    })
    .where(and(eq(bots.id, validated.id), eq(bots.userId, userId)))
    .returning();

  if (!updatedBot) {
    throw new Error("Bot not found or unauthorized");
  }

  revalidatePath("/");
  revalidatePath(`/chats/${validated.id}`);

  return { success: true, bot: updatedBot };
}

export async function deleteBot(id: string) {
  const { userId } = await auth.protect();

  const [deletedBot] = await db
    .delete(bots)
    .where(and(eq(bots.id, id), eq(bots.userId, userId)))
    .returning();

  if (!deletedBot) {
    throw new Error("Bot not found or unauthorized");
  }

  revalidatePath("/");
  revalidatePath(`/chats/${id}`);

  return { success: true, bot: deletedBot };
}

