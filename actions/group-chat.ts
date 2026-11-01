"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import {
  bots,
  groupChats,
  groupChatMembers,
  createGroupChatInputSchema,
  type CreateGroupChatInput,
} from "@/lib/db/schema";

export async function createGroupChat(input: CreateGroupChatInput) {
  const { userId } = await auth.protect();
  const validated = createGroupChatInputSchema.parse(input);

  const [group] = await db
    .insert(groupChats)
    .values({
      userId,
      name: validated.name,
    })
    .returning();

  if (validated.botIds.length > 0) {
    await db.insert(groupChatMembers).values(
      validated.botIds.map((botId) => ({
        groupChatId: group.id,
        botId,
      }))
    );
  }

  revalidatePath("/");
  return { success: true, groupChat: group };
}

export async function updateGroupChat(input: { id: string; name: string; botIds: string[] }) {
  const { userId } = await auth.protect();

  const [updatedGroup] = await db
    .update(groupChats)
    .set({ name: input.name.trim() })
    .where(and(eq(groupChats.id, input.id), eq(groupChats.userId, userId)))
    .returning();

  if (!updatedGroup) {
    throw new Error("Group chat not found or unauthorized");
  }

  await db
    .delete(groupChatMembers)
    .where(eq(groupChatMembers.groupChatId, input.id));

  if (input.botIds.length > 0) {
    await db.insert(groupChatMembers).values(
      input.botIds.map((botId) => ({
        groupChatId: input.id,
        botId,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath(`/chats/${input.id}`);
  return { success: true, groupChat: updatedGroup };
}

export async function deleteGroupChat(id: string) {
  const { userId } = await auth.protect();

  const [deletedGroup] = await db
    .delete(groupChats)
    .where(and(eq(groupChats.id, id), eq(groupChats.userId, userId)))
    .returning();

  if (deletedGroup) {
    await db
      .delete(groupChatMembers)
      .where(eq(groupChatMembers.groupChatId, id));
  }

  revalidatePath("/");
  return { success: true };
}

export async function getAvailableBots() {
  const { userId } = await auth.protect();
  return await db
    .select()
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(bots.createdAt);
}
