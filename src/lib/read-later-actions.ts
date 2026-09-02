"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { readLaterItems } from "@/db/schema";
import { getSession } from "@/lib/session";

type ActionResult = { ok: boolean; inReadLater: boolean; error?: string };

/** Toggle a book in the user's Read Later list. */
export async function toggleReadLater(
  bookId: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, inReadLater: false, error: "You must be signed in." };
  }

  const existing = await db
    .select({ id: readLaterItems.id })
    .from(readLaterItems)
    .where(
      and(
        eq(readLaterItems.userId, session.user.id),
        eq(readLaterItems.bookId, bookId)
      )
    )
    .limit(1)
    .catch(() => []);

  if (existing.length) {
    await db
      .delete(readLaterItems)
      .where(eq(readLaterItems.id, existing[0].id))
      .catch(() => null);
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/read-later");
    return { ok: true, inReadLater: false };
  }

  await db
    .insert(readLaterItems)
    .values({ id: randomUUID(), userId: session.user.id, bookId })
    .catch(() => null);
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/read-later");
  return { ok: true, inReadLater: true };
}

/** Whether the current user has this book in their Read Later list. */
export async function isInReadLater(bookId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
  const rows = await db
    .select({ id: readLaterItems.id })
    .from(readLaterItems)
    .where(
      and(
        eq(readLaterItems.userId, session.user.id),
        eq(readLaterItems.bookId, bookId)
      )
    )
    .limit(1)
    .catch(() => []);
  return rows.length > 0;
}
