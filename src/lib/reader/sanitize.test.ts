import { describe, it, expect } from "vitest";
import {
  sanitizeParagraph,
  sanitizeParagraphs,
  isUnsafe,
  isEmptySection,
} from "./sanitize";

describe("sanitizeParagraph", () => {
  it("leaves plain text untouched (apart from trim)", () => {
    expect(sanitizeParagraph("  Hello world.  ")).toBe("Hello world.");
  });

  it("strips HTML tags defensively", () => {
    expect(sanitizeParagraph("Hello <script>alert(1)</script> world")).toBe(
      "Hello alert(1) world"
    );
    expect(sanitizeParagraph("<p>Some book text</p>")).toBe("Some book text");
  });

  it("strips control characters but keeps newlines", () => {
    expect(sanitizeParagraph("line one\nline two")).toBe("line one\nline two");
    expect(sanitizeParagraph("a\u0000b\u0007c")).toBe("abc");
  });

  it("removes zero-width / format characters", () => {
    expect(sanitizeParagraph("a\u200Bb\uFEFFc")).toBe("abc");
  });

  it("returns empty string for falsy input", () => {
    expect(sanitizeParagraph("")).toBe("");
    expect(sanitizeParagraph(null as unknown as string)).toBe("");
  });
});

describe("sanitizeParagraphs", () => {
  it("maps every paragraph", () => {
    expect(sanitizeParagraphs(["<b>x</b>", "y"])).toEqual(["x", "y"]);
  });

  it("handles non-array input", () => {
    expect(sanitizeParagraphs(null as unknown as string[])).toEqual([]);
  });
});

describe("isUnsafe", () => {
  it("flags markup and passes clean text", () => {
    expect(isUnsafe("<img onerror=alert(1)>")).toBe(true);
    expect(isUnsafe("Clean prose.")).toBe(false);
  });
});

describe("isEmptySection", () => {
  it("is empty when there is no heading and no non-empty paragraphs", () => {
    expect(isEmptySection([{ heading: null, paragraphs: ["", "  "] }], 0)).toBe(true);
  });

  it("is not empty when it has a heading or text", () => {
    expect(isEmptySection([{ heading: "X", paragraphs: [] }], 0)).toBe(false);
    expect(isEmptySection([{ heading: null, paragraphs: ["text"] }], 0)).toBe(false);
  });
});
