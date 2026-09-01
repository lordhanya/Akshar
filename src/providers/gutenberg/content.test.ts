import { describe, it, expect } from "vitest";
import { parseGutenbergText } from "./content";

describe("parseGutenbergText", () => {
  const GUT_HEADER = `The Project Gutenberg eBook of Test Book
This ebook is for the use of anyone anywhere in the United States...

*** START OF THE PROJECT GUTENBERG EBOOK TEST BOOK ***`;

  const GUT_FOOTER = `*** END OF THE PROJECT GUTENBERG EBOOK TEST BOOK ***
The Project Gutenberg eBook of Test Book`;
  it("strips the Gutenberg header and footer boilerplate", () => {
    const raw = `${GUT_HEADER}

CHAPTER I.

The first paragraph has several words in it.

A second paragraph.

CHAPTER II.

Another chapter begins here.

${GUT_FOOTER}`;
    const out = parseGutenbergText("gut-1", "en", raw);
    const all = out.sections.map((s) => s.paragraphs.join(" ")).join(" ");
    expect(all).not.toContain("Project Gutenberg eBook");
    expect(all).not.toContain("*** START OF");
    expect(all).not.toContain("*** END OF");
    expect(out.sections[0].heading).toBe("CHAPTER I.");
    expect(out.wordCount).toBeGreaterThan(0);
  });

  it("groups paragraph lines split across source lines into one paragraph", () => {
    const raw = `${GUT_HEADER}

CHAPTER I.

These first and
second lines are one
single paragraph.

${GUT_FOOTER}`;
    const out = parseGutenbergText("gut-1", "en", raw);
    expect(out.sections[0].paragraphs[0]).toBe(
      "These first and second lines are one single paragraph."
    );
  });

  it("falls back to a single section when no headings are present", () => {
    const raw = `${GUT_HEADER}

Just some body text with no chapter markers at all in this file.

It stays in one section.

${GUT_FOOTER}`;
    const out = parseGutenbergText("gut-1", "en", raw);
    expect(out.sections.length).toBe(1);
    expect(out.sections[0].paragraphs.length).toBeGreaterThan(0);
  });

  it("handles raw text with no Gutenberg markers", () => {
    const out = parseGutenbergText("gut-2", "en", "A book with no header or footer.");
    expect(out.sections.length).toBe(1);
    expect(out.sections[0].paragraphs[0]).toBe("A book with no header or footer.");
  });

  it("drops divider and decorative-only lines", () => {
    const raw = `${GUT_HEADER}

CHAPTER I.

______

* * *

Real content paragraph.

${GUT_FOOTER}`;
    const out = parseGutenbergText("gut-1", "en", raw);
    const all = out.sections.map((s) => s.paragraphs.join(" ")).join(" ");
    expect(all).toContain("Real content paragraph.");
    expect(all).not.toContain("______");
  });
});
