import { describe, it, expect } from "vitest";
import { normalizeLanguage } from "./language";

describe("normalizeLanguage", () => {
  it("passes through ISO 639-1 two-letter codes", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("as")).toBe("as");
  });

  it("maps MARC/ISO 639-3 three-letter codes (incl. Assamese)", () => {
    expect(normalizeLanguage("eng")).toBe("en");
    expect(normalizeLanguage("asm")).toBe("as");
    expect(normalizeLanguage("ben")).toBe("bn");
    expect(normalizeLanguage("hin")).toBe("hi");
  });

  it("maps legacy MARC variants", () => {
    expect(normalizeLanguage("fre")).toBe("fr");
    expect(normalizeLanguage("ger")).toBe("de");
    expect(normalizeLanguage("dut")).toBe("nl");
    expect(normalizeLanguage("chi")).toBe("zh");
  });

  it("reduces region variants to the primary language", () => {
    expect(normalizeLanguage("en-US")).toBe("en");
    expect(normalizeLanguage("pt_BR")).toBe("pt");
  });

  it("returns und for missing input", () => {
    expect(normalizeLanguage(undefined)).toBe("und");
    expect(normalizeLanguage(null)).toBe("und");
  });

  it("falls back to lowercased input for unmapped three-letter codes", () => {
    expect(normalizeLanguage("ZZZ")).toBe("zzz");
  });
});
