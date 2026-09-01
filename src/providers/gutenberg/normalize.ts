import type { Book, BookAuthor, BookFormat, BookGenre, BookRights } from "@/providers/types";
import { classifyRights } from "@/providers/rights";
import { normalizeLanguage } from "@/providers/language";

/**
 * Gutendex (Project Gutenberg mirror API) JSON -> normalized Book[].
 *
 * `copyright: false` is Gutenberg's "public domain in the US" signal; we treat
 * it as strong evidence and classify those as `public_domain`. Records where
 * copyright is true/unknown become `restricted` (metadata only).
 *
 * Content is fetched separately via `getContent` from the `text/plain; charset=utf-8`
 * URL, which is the cleanest plain-text rendering Gutenberg publishes.
 */

interface GutendexAuthor {
  name?: string;
  birth_year?: number | null;
  death_year?: number | null;
}

interface GutendexDoc {
  id?: number;
  title?: string;
  authors?: GutendexAuthor[];
  translators?: GutendexAuthor[];
  summaries?: string[];
  subjects?: string[];
  bookshelves?: string[];
  languages?: string[];
  copyright?: boolean | null;
  media_type?: string;
  download_count?: number;
  formats?: Record<string, string>;
}

export interface GutendexResponse {
  count?: number;
  next?: string | null;
  results?: GutendexDoc[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Possible plain-text content URLs, best first. */
const TEXT_PRIORITY = [
  "text/plain; charset=utf-8",
  "text/plain; charset=us-ascii",
  "text/plain; charset=iso-8859-1",
  "text/plain",
];

/** Cover from Gutenberg's published cache, when present. */
function coverUrl(doc: GutendexDoc): string | null {
  const url = doc.formats?.["image/jpeg"];
  return url && url.startsWith("http") ? url : null;
}

/** The content URL we will fetch for the normalized reader text. */
export function plainTextUrl(doc: GutendexDoc): string | null {
  if (!doc.formats) return null;
  for (const mime of TEXT_PRIORITY) {
    const url = doc.formats[mime];
    if (url && url.startsWith("http")) return url;
  }
  return null;
}

function toFormats(doc: GutendexDoc): BookFormat[] {
  const out: BookFormat[] = [];
  for (const [mime, url] of Object.entries(doc.formats ?? {})) {
    if (!url || typeof url !== "string" || !url.startsWith("http")) continue;
    out.push({ format: mime, url });
  }
  return out;
}

function authors(doc: GutendexDoc): BookAuthor[] {
  return (doc.authors ?? []).map((a, i) => ({
    id: `gut-${doc.id ?? "x"}-a${i}`,
    name: a.name ?? `Unknown ${i + 1}`,
  }));
}

export function normalizeGutendexDoc(doc: GutendexDoc): Book | null {
  const title = doc.title?.trim();
  const id = doc.id;
  if (!title || id == null) return null;

  const language = normalizeLanguage(doc.languages?.[0]);
  const rights: BookRights = classifyRights({ gutenbergCopyright: doc.copyright });

  const description = (doc.summaries ?? [])[0] || null;
  const genres: BookGenre[] = (doc.subjects ?? [])
    .slice(0, 8)
    .map((name) => {
      const slug = slugify(name);
      return { id: slug, name, slug };
    });

  return {
    id: `gut-${id}`,
    title,
    description,
    language,
    source: "gutenberg",
    sourceId: String(id),
    rights,
    status: "published",
    coverUrl: coverUrl(doc),
    authors: authors(doc),
    genres,
    formats: toFormats(doc),
  };
}

export function normalizeGutendexSearch(payload: GutendexResponse): Book[] {
  const out: Book[] = [];
  for (const doc of payload.results ?? []) {
    const b = normalizeGutendexDoc(doc);
    if (b) out.push(b);
  }
  return out;
}
