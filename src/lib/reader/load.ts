import { getBookById } from "@/lib/books";
import { getCachedContent } from "@/lib/content-cache";
import { getSession } from "@/lib/session";
import { sanitizeParagraph, sanitizeParagraphs } from "./sanitize";
import { isReadable } from "@/providers";

/**
 * Server-side reader content loader.
 *
 * Loads the book + its normalized cached content, enforces the rights gate,
 * and sanitizes every paragraph into safe plain text before handing it to the
 * client. The returned shape is small and serializable; the heavy book text
 * travels as an RSC payload only when a user actually opens the reader.
 */

export interface ReaderSection {
  heading: string;
  paragraphs: string[];
}

export interface ReaderBook {
  id: string;
  title: string;
  authors: string[];
  language: string;
}

export type ReaderLoadResult =
  | {
      ok: true;
      book: ReaderBook;
      content: ReaderSection[];
      userId: string | null;
    }
  | { ok: false; reason: "not_found" | "not_readable" | "no_content" };

export async function loadReaderContent(
  bookId: string
): Promise<ReaderLoadResult> {
  const book = await getBookById(bookId).catch(() => null);
  if (!book) return { ok: false, reason: "not_found" };
  if (!isReadable(book.rights)) return { ok: false, reason: "not_readable" };

  const content = await getCachedContent(bookId).catch(() => null);
  if (!content || !content.sections.length) {
    return { ok: false, reason: "no_content" };
  }

  const sections: ReaderSection[] = content.sections.map((s) => ({
    heading:
      s.heading && typeof s.heading === "string"
        ? sanitizeParagraph(s.heading)
        : "",
    paragraphs: sanitizeParagraphs(
      Array.isArray(s.paragraphs) ? s.paragraphs : []
    ),
  }));

  const session = await getSession().catch(() => null);

  return {
    ok: true,
    book: {
      id: book.id,
      title: book.title,
      authors: book.authors,
      language: book.language,
    },
    content: sections,
    userId: session?.user?.id ?? null,
  };
}
