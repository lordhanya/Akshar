/**
 * Content sanitization for the reader.
 *
 * The normalized content model stores each paragraph as plain text, and the
 * reader renders it with React's auto-escaping (`{text}`), so script injection
 * is already impossible by construction. This sanitizer is a defensive second
 * layer: it strips any residual HTML-like markup and dangerous control
 * characters before a paragraph reaches the DOM. The reader never injects
 * arbitrary HTML (`dangerouslySetInnerHTML`) sourced from book content.
 */

const TAG_RE = /<[^>]*>/g;

/**
 * Normalize a raw paragraph into safe text for rendering.
 * - Removes any HTML tag markup (defensive; content is expected to be plain).
 * - Strips control characters (keeps newlines, which display as spaces).
 * - Trims leading/trailing whitespace but keeps internal newlines.
 */
export function sanitizeParagraph(raw: string): string {
  if (!raw) return "";
  const noTags = raw.replace(TAG_RE, "");
  // Remove C0/C1 control characters except newline.
  const noControl = noTags.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
  // Zero-width and format characters can break text selection/reading.
  const cleaned = noControl.replace(/[\u200B-\u200F\uFEFF]/g, "");
  return cleaned.replace(/[ \t]*\n[ \t]*/g, "\n").trim();
}

/**
 * Sanitize a full section's paragraphs in place of the whole book, returning
 * only the paragraphs (headings stay unsanitized but are rendered as text too).
 */
export function sanitizeParagraphs(paragraphs: string[]): string[] {
  return (Array.isArray(paragraphs) ? paragraphs : []).map(sanitizeParagraph);
}

/** True when a paragraph contains anything the sanitizer would strip. */
export function isUnsafe(raw: string): boolean {
  return /<[^>]*>/.test(raw);
}

/** True when a section is empty after sanitization (nothing to render). */
export function isEmptySection(
  sections: { heading?: string | null; paragraphs?: string[] }[],
  index: number
): boolean {
  const s = sections[index];
  if (!s) return true;
  const heading = s.heading?.trim();
  const paras = Array.isArray(s.paragraphs)
    ? s.paragraphs.filter((p) => sanitizeParagraph(p).length > 0)
    : [];
  return !heading && paras.length === 0;
}
