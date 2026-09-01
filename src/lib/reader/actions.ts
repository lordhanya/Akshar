"use server";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { readingProgress } from "@/db/schema";
import { getSession } from "@/lib/session";
import type { ReaderLocator } from "./progress";

/**
 * Authenticated reading-progress persistence.
 *
 * The reader writes here (debounced client-side, never on every scroll) so an
 * authenticated user can resume on another device. Anonymous users never
 * touch this — their progress lives in localStorage. If the DB call fails the
 * action degrades gracefully (returns ok:false) and the reader keeps working
 * from local state, exactly as the plan requires.
 */

export interface SavedReadingProgress {
  locator: ReaderLocator;
  pct: number;
  updatedAt: number;
}

export interface SaveProgressInput {
  locator: ReaderLocator;
  pct: number;
}

export async function saveReadingProgress(
  bookId: string,
  input: SaveProgressInput
): Promise<{ ok: boolean; progress?: SavedReadingProgress }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false };
    }
    const locator: ReaderLocator = {
      v: 1,
      section: input.locator.section,
      offset: input.locator.offset,
    };
    const pct = Math.min(1, Math.max(0, input.pct));
    await db
      .insert(readingProgress)
      .values({
        id: randomUUID(),
        userId: session.user.id,
        bookId,
        locator,
        chapterIndex: locator.section,
        charOffset: Math.round(input.locator.offset * 100000),
        positionPct: pct,
        lastOpenedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.bookId],
        set: {
          locator,
          chapterIndex: locator.section,
          charOffset: Math.round(input.locator.offset * 100000),
          positionPct: pct,
          lastOpenedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    revalidatePath(`/books/${bookId}`);
    return { ok: true, progress: { locator, pct, updatedAt: Date.now() } };
  } catch {
    return { ok: false };
  }
}

/** Fetch an authenticated user's saved progress for a book (or null). */
export async function getReadingProgress(
  bookId: string
): Promise<SavedReadingProgress | null> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return null;
    const rows = await db
      .select({
        locator: readingProgress.locator,
        pct: readingProgress.positionPct,
        updatedAt: readingProgress.updatedAt,
      })
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, session.user.id),
          eq(readingProgress.bookId, bookId)
        )
      )
      .limit(1);
    const row = rows[0];
    if (!row || typeof row.updatedAt !== "object") return null;
    const locator = (row.locator ?? {}) as Partial<ReaderLocator>;
    if (typeof locator.section !== "number") return null;
    return {
      locator: {
        v: 1,
        section: Math.max(0, Math.floor(locator.section)),
        offset: Math.min(1, Math.max(0, locator.offset ?? 0)),
      },
      pct: Math.min(1, Math.max(0, row.pct ?? 0)),
      updatedAt: (row.updatedAt as Date).getTime(),
    };
  } catch {
    return null;
  }
}
