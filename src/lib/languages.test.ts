import { describe, it, expect } from "vitest";
import { languageLabel } from "./languages";

describe("languageLabel", () => {
  it("returns English for the English code", () => {
    expect(languageLabel("en")).toBe("English");
  });

  it("renders Assamese in Assamese script", () => {
    expect(languageLabel("as")).toBe("অসমীয়া");
  });

  it("renders Bengali and Hindi in their scripts", () => {
    expect(languageLabel("bn")).toBe("বাংলা");
    expect(languageLabel("hi")).toBe("हिन्दी");
  });

  it("uppercases unknown codes as a safe fallback", () => {
    expect(languageLabel("xx")).toBe("XX");
    expect(languageLabel("")).toBe("");
  });
});
