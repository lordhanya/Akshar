/**
 * Regression guards for the reader book-opening cover feature.
 *
 * The cover sits above the content sections in the same scroll container.
 * Progress tracking must remain content-only — the cover must not appear in
 * sectionRefs, must not be included in sectionWeights, and geometry must
 * compute positions directly from the DOM without offsetting by cover height
 * (the cover is part of the scroll content, so its height is already reflected
 * in section positions).
 *
 * These are source-level checks (no DOM required) because the Reader is a
 * client component with next-themes / localStorage dependencies.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readerSrc = readFileSync(
  resolve(__dirname, "reader.tsx"),
  "utf8"
);

const loadSrc = readFileSync(
  resolve(process.cwd(), "src/lib/reader/load.ts"),
  "utf8"
);

describe("Reader cover feature", () => {
  it("ReaderBook type includes coverUrl", () => {
    expect(loadSrc).toContain("coverUrl: string | null;");
  });

  it("loadReaderContent passes coverUrl to the ReaderBook", () => {
    expect(loadSrc).toContain("coverUrl: book.coverUrl ?? null,");
  });

  it("Reader component accepts coverUrl via ReaderBook type", () => {
    // The Reader uses ReaderBook directly — coverUrl is in the type, not
    // declared inline. Verify it reads book.coverUrl in the component body.
    expect(readerSrc).toContain("book.coverUrl");
    expect(readerSrc).toContain("hasCover = Boolean(book.coverUrl)");
  });

  it("cover element is not tracked in sectionRefs", () => {
    // The cover div must NOT have a ref={...} that writes to sectionRefs.
    // Only content sections should appear in sectionRefs.
    const coverBlock = readerSrc.indexOf("Book opening cover");
    const contentBlock = readerSrc.indexOf("Book content");
    expect(coverBlock).toBeGreaterThan(-1);
    expect(contentBlock).toBeGreaterThan(-1);
    expect(coverBlock).toBeLessThan(contentBlock);

    // Verify sectionRefs ref callback only appears in the content block.
    const sectionRefsInCover = readerSrc.indexOf(
      "sectionRefs.current[i] = el",
    );
    expect(sectionRefsInCover).toBeGreaterThan(contentBlock);
  });

  it("geometry does not use coverHeightRef (bug fix)", () => {
    // The cover is part of the scroll content — its height is already reflected
    // in the section positions via the DOM. Adding coverHeightRef would double-
    // count the cover and break progress tracking.
    expect(readerSrc).not.toContain("coverHeightRef");
    expect(readerSrc).not.toContain("coverRef");
  });

  it("cover uses BookCover component or a CSS fallback", () => {
    // Must have either <BookCover or the fallback <div with BookOpen icon.
    const hasBookCover = readerSrc.includes("<BookCover");
    const hasFallback = readerSrc.includes("BookOpen") &&
      readerSrc.includes("Cover of");
    expect(hasBookCover || hasFallback).toBe(true);
  });

  it("cover container has relative positioning for Image fill", () => {
    // The cover image uses next/image with fill, so its parent must be relative.
    expect(readerSrc).toMatch(/relative.*aspect-\[2\/3\]/);
  });

  it("resume layout effect does not reference the cover", () => {
    // The resume scroll logic must use geometry(locator.section) which is
    // already offset by coverHeightRef — no special cover skip needed.
    const resumeStart = readerSrc.indexOf("Resume: resolve local vs server");
    const resumeBlock = readerSrc.slice(
      resumeStart,
      readerSrc.indexOf("Keep a keep-alive flush", resumeStart)
    );
    // Should not contain any cover-specific scroll logic (e.g. "scrollPastCover")
    expect(resumeBlock).not.toContain("scrollPastCover");
    expect(resumeBlock).not.toContain("coverRef.current.scrollTop");
  });

  it("handleScroll uses geometry which already offsets by cover", () => {
    const scrollStart = readerSrc.indexOf("Scroll handling: compute locator");
    const scrollBlock = readerSrc.slice(
      scrollStart,
      readerSrc.indexOf("Resume:", scrollStart)
    );
    // handleScroll must call geometry(i) — the offset is handled inside geometry.
    expect(scrollBlock).toContain("geometry(i)");
    expect(scrollBlock).toContain("geometry(active)");
  });
});
