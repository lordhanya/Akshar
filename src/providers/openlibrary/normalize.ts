import type {
  Book,
  BookAuthor,
  BookGenre,
  BookRights,
} from "@/providers/types";
import { classifyRights } from "@/providers/rights";
import { normalizeLanguage } from "@/providers/language";

/**
 * Open Library search JSON -> normalized Book[].
 *
 * Open Library is a discovery/metadata source only — never our ebook-content
 * provider. Its `ebook_access: "public"` indicates the work is in Open
 * Library's lending catalog, which is NOT authorization to freely redistribute
 * the text. So, unless jurisdiction is signed for a specific record, OL-derived
 * books default to `restricted` (metadata visible, read access off).
 */

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  language?: string[];
  subject?: string[];
  ebook_access?: string;
  description?: string | { value?: string };
}

export interface OpenLibrarySearchResponse {
  numFound?: number;
  docs?: OpenLibraryDoc[];
}

/** Author id normalized from an Open Library author key (/authors/OL161167A). */
export function authorIdFromKey(key: string | undefined, fallbackName: string): string {
  const raw = key ?? "";
  const m = raw.match(/OL(\d+)A/i);
  if (m) return `ol-${m[1]}`;
  // Deterministic fallback id from name so seeds stay stable.
  return `ol-name-${slugify(fallbackName)}`;
}

/** Book id normalized from an Open Library work key (/works/OL262421W). */
export function bookIdFromKey(key: string | undefined, title: string): string {
  const m = key?.match(/OL(\d+)W/i);
  if (m) return `ol-${m[1]}`;
  return `ol-title-${slugify(title)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function coverUrl(coverI: number | undefined): string | null {
  return coverI != null ? `https://covers.openlibrary.org/b/id/${coverI}-M.jpg` : null;
}

function descriptions(doc: OpenLibraryDoc): string | null {
  if (typeof doc.description === "string") return doc.description;
  if (doc.description && typeof doc.description.value === "string") {
    return doc.description.value;
  }
  return null;
}

export function normalizeOpenLibraryDoc(
  doc: OpenLibraryDoc,
  opts: { jurisdictionSigned?: boolean } = {}
): Book | null {
  const title = doc.title?.trim();
  if (!title) return null;

  const language = normalizeLanguage(doc.language?.[0]);
  const rights: BookRights = classifyRights(
    { openLibraryEbookAccess: doc.ebook_access },
    { jurisdictionSigned: opts.jurisdictionSigned }
  );

  const authors: BookAuthor[] = (doc.author_name ?? []).map((name, i) => ({
    id: authorIdFromKey(doc.author_key?.[i], name),
    name,
  }));

  const genres: BookGenre[] = (doc.subject ?? []).slice(0, 8).map((name) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
  }));

  const id = bookIdFromKey(doc.key, title);

  return {
    id,
    title,
    subtitle: doc.subtitle?.trim() || null,
    description: descriptions(doc),
    language,
    source: "openlibrary",
    sourceId: (doc.key ?? id).replace(/^\/+/, ""),
    rights,
    status: "published",
    coverUrl: coverUrl(doc.cover_i),
    authors,
    genres,
    formats: [],
    createdAt: doc.first_publish_year ? new Date(doc.first_publish_year, 0, 1) : undefined,
  };
}

export function normalizeOpenLibrarySearch(payload: OpenLibrarySearchResponse): Book[] {
  const docs = payload.docs ?? [];
  const out: Book[] = [];
  for (const doc of docs) {
    const b = normalizeOpenLibraryDoc(doc);
    if (b) out.push(b);
  }
  return out;
}
