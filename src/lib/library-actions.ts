"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { libraryItems } from "@/db/schema";
import { getSession } from "@/lib/session";

/**
 * Server actions for the user's saved library ("Add to Library").
 *
 * Phase 3 adds a full library page; here we support the toggle on book
 * detail pages. Everything is gated to the signed-in user.
 */

type ActionResult = { ok: boolean; inLibrary: boolean; error?: string };

export async function toggleInLibrary(
  bookId: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, inLibrary: false, error: "You must be signed in." };
  }

  const existing = await db
    .select({ id: libraryItems.id })
    .from(libraryItems)
    .where(
      and(
        eq(libraryItems.userId, session.user.id),
        eq(libraryItems.bookId, bookId)
      )
    )
    .limit(1)
    .catch(() => []);

  if (existing.length) {
    await db
      .delete(libraryItems)
      .where(eq(libraryItems.id, existing[0].id))
      .catch(() => null);
    revalidatePath(`/books/${bookId}`);
    return { ok: true, inLibrary: false };
  }

  await db
    .insert(libraryItems)
    .values({ id: randomUUID(), userId: session.user.id, bookId })
    .catch(() => null);
  revalidatePath(`/books/${bookId}`);
  return { ok: true, inLibrary: true };
}

/** Whether the current user already saved this book. */
export async function isInLibrary(bookId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
  const rows = await db
    .select({ id: libraryItems.id })
    .from(libraryItems)
    .where(
      and(
        eq(libraryItems.userId, session.user.id),
        eq(libraryItems.bookId, bookId)
      )
    )
    .limit(1)
    .catch(() => []);
  return rows.length > 0;
}
