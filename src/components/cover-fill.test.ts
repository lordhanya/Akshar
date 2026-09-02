/**
 * Structural regression guard: wherever `<Image fill>` renders a book cover,
 * the parent container must have `position: relative` — otherwise Next.js
 * logs a console warning and the image mis-sizes.
 *
 * Covers are rendered via `<BookCover>` (src/components/book-cover.tsx)
 * which always passes `fill`. Any caller must wrap the BookCover in a
 * container that includes `relative` in its className.
 *
 * This test reads source files and asserts the pattern directly. It does not
 * depend on DOM rendering (which is a node-only test environment) and will
 * catch a future accidental removal of `relative` from a cover parent.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Given source text and the line(s) containing `<BookCover`, find the nearest
 * preceding `<div>` tag (the direct parent) and check that it has a valid
 * positioning context (`relative`, `absolute`, `fixed`, or `sticky`) —
 * required for Next.js `<Image fill>` to work.
 *
 * In JSX the parent div is usually 1–2 lines before <BookCover; we walk
 * backwards over blank lines and short indented fragments to find it.
 */
function assertCoverParentHasRelative(source: string, filename: string) {
  const coverIdx = source.indexOf("<BookCover");
  expect(coverIdx).toBeGreaterThanOrEqual(0);

  // Walk backwards from <BookCover, skipping blank lines, to find the line
  // containing the opening <div tag.
  let searchEnd = coverIdx;
  while (searchEnd > 0) {
    const prevNewline = source.lastIndexOf("\n", searchEnd - 1);
    if (prevNewline < 0) break;
    const line = source.slice(prevNewline + 1, searchEnd).trim();
    searchEnd = prevNewline;
    if (line === "") continue; // skip blank lines
    if (line.includes("<div")) {
      // Found the parent div's opening tag.
      expect(line).toMatch(/position:|relative|absolute|fixed|sticky/);
      return;
    }
    // If the line doesn't contain <div, keep going (might be an intermediate
    // JSX wrapper like the grid container).
  }
  expect.fail(`No parent <div> found before <BookCover in ${filename}`);
}

/**
 * Walk backwards from an `<Image` tag (with `fill`) to find its parent `<div`
 * and verify it has a positioning context. Same logic as assertCoverParentHasRelative
 * but targets a bare `<Image` tag.
 */
function assertImageFillParentHasRelative(
  source: string,
  filename: string,
  imagePattern: RegExp = /<Image\s/
) {
  const imageMatch = source.match(imagePattern);
  expect(imageMatch).not.toBeNull();
  const imageIdx = imageMatch!.index!;

  let searchEnd = imageIdx;
  while (searchEnd > 0) {
    const prevNewline = source.lastIndexOf("\n", searchEnd - 1);
    if (prevNewline < 0) break;
    const line = source.slice(prevNewline + 1, searchEnd).trim();
    searchEnd = prevNewline;
    if (line === "") continue;
    if (line.includes("<div")) {
      expect(line).toMatch(/position:|relative|absolute|fixed|sticky/);
      return;
    }
  }
  expect.fail(`No parent <div> found before <Image in ${filename}`);
}

describe("BookCover fill layout (parent must be relative)", () => {
  it("book detail page wraps BookCover in a relative container", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/(app)/books/[id]/page.tsx"),
      "utf-8"
    );
    assertCoverParentHasRelative(
      source,
      "src/app/(app)/books/[id]/page.tsx"
    );
  });

  it("book card wraps BookCover in a relative container", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/book-card.tsx"),
      "utf-8"
    );
    assertCoverParentHasRelative(source, "src/components/book-card.tsx");
  });
});

describe("Reader cover Image fill layout (parent must be relative)", () => {
  it("reader cover wraps Image in a relative container", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/reader/reader.tsx"),
      "utf-8"
    );
    // The reader uses <Image src={book.coverUrl!} ... fill ...> directly.
    assertImageFillParentHasRelative(
      source,
      "src/components/reader/reader.tsx",
      /<Image\s+src=\{book\.coverUrl/
    );
  });
});
