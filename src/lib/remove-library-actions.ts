"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { libraryItems, readingProgress } from "@/db/schema";
import { getSession } from "@/lib/session";

type ActionResult = { ok: boolean; error?: string };

/**
 * Remove a book from the user's library and delete associated reading progress.
 * The operation is atomic — both library entry and progress are deleted together.
 */
export async function removeFromLibrary(bookId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    // Delete reading progress first, then library item.
    await db
      .delete(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, session.user.id),
          eq(readingProgress.bookId, bookId)
        )
      );

    await db
      .delete(libraryItems)
      .where(
        and(
          eq(libraryItems.userId, session.user.id),
          eq(libraryItems.bookId, bookId)
        )
      );

    revalidatePath(`/books/${bookId}`);
    revalidatePath("/library");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to remove from library." };
  }
}
