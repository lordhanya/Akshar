import { Book, BookRights, ProviderError } from "./types";

/**
 * Legal guardrail.
 *
 * A book's content may only ever be rendered for reading when its `rights`
 * value explicitly permits free distribution and we are confident the intended
 * use is legal. This module is the single gate between content and the reader.
 *
 * Important: we do NOT treat "came from Gutenberg" as proof of legality.
 * Public-domain status depends on jurisdiction (US + life+70, UK life+70, etc.).
 * For the initial catalogue we seed only books with individually verified
 * rights; everything else is metadata-only (not readable).
 */

/** Rights values that permit rendering content for reading. */
export const READABLE_RIGHTS: readonly BookRights[] = [
  "public_domain",
  "cc",
  "free",
];

/** Can the reader legally render this book's content for the user? */
export function isReadable(rights: BookRights): boolean {
  return READABLE_RIGHTS.includes(rights);
}

/**
 * Returns the rights status for a record, or null if the value is not a known
 * status. Used by normalizers to reject invalid/injected values.
 */
export function parseRights(value: unknown): BookRights | null {
  if (typeof value !== "string") return null;
  const v = value as BookRights;
  return v === "public_domain" || v === "cc" || v === "free" || v === "restricted"
    ? v
    : null;
}

/** Throws if `book.rights` does not permit reading. For content providers. */
export function assertReadable(book: Book): void {
  if (!isReadable(book.rights)) {
    throw new ProviderError(
      "invalid_data",
      `Content not enabled: "${book.title}" has rights "${book.rights}"`,
      book.source
    );
  }
}

/**
 * Given a raw signals object from a provider and the jurisdiction confidence,
 * produce a conservative rights classification.
 *
 * `signals` shape is intentionally loose (keys used by providers); returns
 * "restricted" whenever we can't be confident — metadata can exist, but read
 * access must stay off.
 */
export function classifyRights(
  signals: {
    gutenbergCopyright?: boolean | null;
    openLibraryEbookAccess?: string;
    rights?: unknown;
  },
  opts: { jurisdictionSigned?: boolean } = {}
): BookRights {
  // Explicit value wins — used for curated/verified seeds.
  const explicit = parseRights(signals.rights);
  if (explicit) return explicit;

  // Gutendex `copyright:false` means PG lists it as public domain in the US
  // catalog. We treat that as strong-but-not-absolute evidence: readable.
  if (signals.gutenbergCopyright === false) {
    return "public_domain";
  }

  // Open Library `ebook_access: "public"` => borrowing/public lending catalog.
  // This alone is not enough for free redistribution; treat as metadata.
  if (signals.openLibraryEbookAccess === "public") {
    return opts.jurisdictionSigned ? "public_domain" : "restricted";
  }

  // Anything we cannot verify stays restricted (metadata only, no read access).
  return "restricted";
}
