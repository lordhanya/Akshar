/**
 * LocalStorage persistence helpers for anonymous reading progress.
 *
 * Only pure key-shaping / encode-decode logic lives here so it is unit
 * testable; the actual `localStorage` reads/writes happen in client
 * components (browser-only).
 */

import type { ReaderProgress } from "./progress";

export const PROGRESS_PREFIX = "kitap:progress:";

/** localStorage key for a given book's reading progress. */
export function progressKey(bookId: string): string {
  return `${PROGRESS_PREFIX}${bookId}`;
}

/** Decode a stored progress value, returning null when invalid/absent. */
export function parseStoredProgress(value: string | null): ReaderProgress | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ReaderProgress>;
    if (!parsed || typeof parsed !== "object") return null;
    const locator = parsed.locator as ReaderProgress["locator"] | undefined;
    if (!locator || typeof locator.section !== "number") return null;
    if (typeof parsed.pct !== "number" || !Number.isFinite(parsed.pct)) return null;
    const updatedAt =
      typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();
    return {
      locator: {
        v: 1,
        section: Math.max(0, Math.floor(locator.section)),
        offset: Math.min(1, Math.max(0, locator.offset ?? 0)),
      },
      pct: Math.min(1, Math.max(0, parsed.pct)),
      updatedAt,
    };
  } catch {
    return null;
  }
}

/** Encode reader progress for storage. */
export function serializeProgress(progress: ReaderProgress): string {
  return JSON.stringify(progress);
}
