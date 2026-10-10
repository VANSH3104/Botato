"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { bots, createBotInputSchema, type CreateBotInput } from "@/lib/db/schema";

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
