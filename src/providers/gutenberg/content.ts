import type { BookContent, BookContentSection } from "@/providers/types";

/**
 * Convert a raw Project Gutenberg plain-text file into normalized sections.
 *
 * Gutenberg files carry a mandatory header ("The Project Gutenberg eBook of…",
 * license boilerplate) and a footer trailer. We strip those, then split the
 * body into chapters/sections by heading lines and paragraphs on blank lines.
 *
 * Normalizes var conventions and is deliberately defensive — if no section
 * markers are found the whole body becomes a single section.
 */

const START_MARKERS = [
  /\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK/i,
  /\*\*\* START OF .*? EBOOK/i,
];
const END_MARKERS = [
  /\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i,
  /\*\*\* END OF .*? EBOOK/i,
  /End of (the |this )?Project Gutenberg's/i,
];
const FOOTER_PROJECT_TAG = /^The Project Gutenberg eBook of /i;

const CHAPTER_RE =
  /^(chapter|book|part|volume|section|act|scene|stanza|canto|prologue|epilogue|introduction|preface)\b[\s.:,]*/i;

function indexOfLine(lines: string[], re: RegExp): number {
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i;
  }
  return -1;
}

function cleanParagraph(text: string): string | null {
  const t = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
  if (!t) return null;
  if (/^[_-]{3,}$/.test(t)) return null; // divider lines
  return t;
}

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 200) return false; // a sentence, not a heading
  // Titled numbers or Roman numerals like "I", "XII".
  if (/^[IVXLC]+\.?\s*$/i.test(trimmed)) return true;
  if (CHAPTER_RE.test(trimmed)) return true;
  // All-caps short standalone line (common Gutenberg chapter style).
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 1 && trimmed.length <= 90) {
    return true;
  }
  return false;
}

function extractBody(lines: string[]): string[] {
  let start = indexOfLine(lines, START_MARKERS[0]);
  if (start === -1) start = indexOfLine(lines, START_MARKERS[1]);
  let body = start === -1 ? lines : lines.slice(start + 1);

  let end = indexOfLine(body, END_MARKERS[0]);
  if (end === -1) end = indexOfLine(body, END_MARKERS[1]);
  if (end === -1) {
    // Older Gutenberg trailer forms.
    end = indexOfLine(body, FOOTER_PROJECT_TAG);
  }
  if (end !== -1) body = body.slice(0, end);

  return body;
}

export function parseGutenbergText(bookId: string, language: string, raw: string): BookContent {
  const lines = raw.split(/\r?\n/);
  const body = extractBody(lines);

  const sections: BookContentSection[] = [];
  let current: BookContentSection = { paragraphs: [] };
  let currentHeading: string | null = null;
  let wordCount = 0;

  const flush = () => {
    if (current.paragraphs.length) {
      if (currentHeading) (current as BookContentSection).heading = currentHeading;
      sections.push(current);
    }
    current = { paragraphs: [] };
    currentHeading = null;
  };

  let paragraphLines: string[] = [];
  for (const line of body) {
    const trimmed = line.trim();

    if (isHeading(line)) {
      // Finish any paragraph in progress, start a new section.
      if (paragraphLines.length) {
        const p = cleanParagraph(paragraphLines.join(" "));
        if (p) {
          current.paragraphs.push(p);
          wordCount += p.split(/\s+/).length;
        }
        paragraphLines = [];
      }
      if (currentHeading === null && current.paragraphs.length === 0) {
        currentHeading = trimmed;
      } else {
        flush();
        currentHeading = trimmed;
      }
      current.id = `sec-${sections.length}`;
      continue;
    }

    if (trimmed === "") {
      if (paragraphLines.length) {
        const p = cleanParagraph(paragraphLines.join(" "));
        if (p) {
          current.paragraphs.push(p);
          wordCount += p.split(/\s+/).length;
        }
        paragraphLines = [];
      }
      continue;
    }

    // Skip pure decorative lines like "* * *" or page numbers.
    if (/^[*\s]*$/.test(trimmed)) continue;
    if (/^[\d\sIVXLC]+$/.test(trimmed) && trimmed.length <= 6) continue;

    paragraphLines.push(trimmed);
  }

  if (paragraphLines.length) {
    const p = cleanParagraph(paragraphLines.join(" "));
    if (p) {
      current.paragraphs.push(p);
      wordCount += p.split(/\s+/).length;
    }
  }
  flush();

  return {
    bookId,
    language,
    sections,
    wordCount,
  };
}
