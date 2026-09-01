import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  FONT_SIZES,
  LINE_HEIGHTS,
  READING_WIDTHS,
  normalizeSettings,
  settingsToCssVars,
  sizeLabel,
  serializeSettings,
  type ReaderSettings,
} from "./settings";

function settings(partial: Partial<ReaderSettings>): ReaderSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

describe("normalizeSettings", () => {
  it("returns defaults for missing/invalid input", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings("nonsense")).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps out-of-range step indexes", () => {
    expect(normalizeSettings(settings({ size: 999 })).size).toBe(
      FONT_SIZES.length - 1
    );
    expect(normalizeSettings(settings({ size: -5 })).size).toBe(0);
    expect(normalizeSettings(settings({ width: 50 })).width).toBe(
      READING_WIDTHS.length - 1
    );
  });

  it("rejects an unknown theme and falls back to the default", () => {
    const n = normalizeSettings(settings({ theme: "midnight" as ReaderSettings["theme"] }));
    expect(n.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it("accepts a valid theme", () => {
    expect(normalizeSettings(settings({ theme: "dark" })).theme).toBe("dark");
  });
});

describe("settingsToCssVars", () => {
  it("maps indexes to concrete css values", () => {
    const vars = settingsToCssVars(settings({ size: 1, lineHeight: 1, width: 2 }));
    expect(vars["--reading-size"]).toBe(`${FONT_SIZES[1]}rem`);
    expect(vars["--reading-leading"]).toBe(String(LINE_HEIGHTS[1]));
    expect(vars["--reading-width"]).toBe(`${READING_WIDTHS[2]}rem`);
  });
});

describe("sizeLabel / serializeSettings", () => {
  it("produces a percentage label", () => {
    expect(sizeLabel(1)).toBe(`${FONT_SIZES[1] * 100}%`);
  });

  it("round-trips through JSON", () => {
    const s = settings({ theme: "sepia", size: 2, lineHeight: 3, width: 0 });
    expect(JSON.parse(serializeSettings(s))).toEqual(s);
  });
});
