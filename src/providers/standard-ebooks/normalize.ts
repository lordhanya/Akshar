import { XMLParser } from "fast-xml-parser";
import type { Book, BookRights } from "@/providers/types";

/**
 * Standard Ebooks — discovery only, via the free New Releases Atom feed.
 *
 * Background: the full Standard Ebooks OPDS catalog is a paid (Patrons Circle)
 * benefit, which the plan forbids relying on. The open New Releases feed serves
 * only the ~15 most recent titles (no search or full-catalog paging), so it is
 * a lightweight discovery feed rather than a catalogue source.
 *
 * Rights: the feed states works are "Public domain in the United States… check
 * local laws." Our primary audience is in India, where US-only public domain
 * does not automatically apply. Therefore every Standard Ebooks record is
 * classified `restricted` (metadata visible, Read access off) unless the caller
 * overrides rights with a verified classification.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

interface AtomAuthor {
  name?: string;
}

interface AtomEntry {
  title?: string;
  id?: string;
  author?: AtomAuthor | AtomAuthor[];
  summary?: { "#text"?: string } | string;
  category?: { "@_term"?: string } | { "@_term"?: string }[];
  link?: { "@_href"?: string; "@_type"?: string } | { "@_href"?: string }[];
  rights?: string;
  published?: string;
}

export interface AtomFeed {
  feed?: { entry?: AtomEntry | AtomEntry[] };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstAuthor(entry: AtomEntry): string {
  const a = Array.isArray(entry.author) ? entry.author[0] : entry.author;
  return a?.name?.trim() ?? "Unknown";
}

function summaryText(summary: AtomEntry["summary"]): string | null {
  if (!summary) return null;
  if (typeof summary === "string") return summary;
  return summary["#text"] ?? null;
}

function categories(entry: AtomEntry): { id: string; name: string; slug: string }[] {
  const cats = entry.category;
  const list = Array.isArray(cats) ? cats : cats ? [cats] : [];
  return list
    .map((c) => c["@_term"]?.trim())
    .filter((n): n is string => Boolean(n))
    .slice(0, 8)
    .map((name) => {
      const slug = slugify(name);
      return { id: slug, name, slug };
    });
}

/** The canonical ebook page URL, used as the record id + attribution. */
function bookUrl(entry: AtomEntry): string | null {
  const id = entry.id?.trim();
  return id && /^https?:\/\//.test(id) ? id : null;
}

function rightsFor(entry: AtomEntry, override?: BookRights): BookRights {
  if (override) return override;
  return "restricted";
}

export function normalizeAtomEntry(
  entry: AtomEntry,
  opts: { rightsOverride?: BookRights } = {}
): Book | null {
  const title = entry.title?.trim();
  const url = bookUrl(entry);
  if (!title || !url) return null;

  const authorName = firstAuthor(entry);
  const sourceId = url.replace(/^https?:\/\/standardebooks\.org/, "").replace(/^\/+/, "");

  return {
    id: `se-${slugify(sourceId)}`,
    title,
    description: summaryText(entry.summary),
    language: "en",
    source: "standard_ebooks",
    sourceId,
    rights: rightsFor(entry, opts.rightsOverride),
    status: "published",
    coverUrl: null,
    authors: [{ id: `se-author-${slugify(authorName)}`, name: authorName }],
    genres: categories(entry),
    formats: [],
  };
}

export function parseAtomFeed(xml: string): Book[] {
  let parsed: AtomFeed;
  try {
    parsed = parser.parse(xml) as AtomFeed;
  } catch {
    return [];
  }
  const feed = parsed?.feed;
  if (!feed?.entry) return [];
  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  const out: Book[] = [];
  for (const e of entries) {
    const b = normalizeAtomEntry(e);
    if (b) out.push(b);
  }
  return out;
}
