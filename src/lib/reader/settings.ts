/**
 * Reader typography/comfort settings.
 *
 * Kept deliberately compact: discrete, bounded choices for font size, line
 * height and reading width plus a theme. Settings are separate from reading
 * progress and are persisted locally (anonymous) — they are UI preferences,
 * not per-book state.
 */

export type ReaderTheme = "light" | "sepia" | "dark";

export const THEMES: ReaderTheme[] = ["light", "sepia", "dark"];

/** Available font sizes in rem. Index 1 is the calm default. */
export const FONT_SIZES = [0.95, 1.125, 1.25, 1.375, 1.5] as const;
export const LINE_HEIGHTS = [1.6, 1.75, 1.9, 2.05] as const;
/** Reading column widths in rem (mobile clamps to viewport). */
export const READING_WIDTHS = [26, 32, 38, 44] as const;

export interface ReaderSettings {
  theme: ReaderTheme;
  size: number;
  lineHeight: number;
  width: number;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "sepia",
  size: 1,
  lineHeight: 1,
  width: 1,
};

/** localStorage key for reader preferences (distinct from book progress). */
export const SETTINGS_STORAGE_KEY = "kitap:reader:settings";

function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(length - 1, Math.max(0, Math.round(index)));
}

/** Validate an untrusted parsed value (e.g. from localStorage) into settings. */
export function normalizeSettings(value: unknown): ReaderSettings {
  const v = (value ?? {}) as Partial<ReaderSettings>;
  const theme: ReaderTheme = THEMES.includes(v.theme as ReaderTheme)
    ? (v.theme as ReaderTheme)
    : DEFAULT_SETTINGS.theme;
  const size = clampIndex(v.size ?? DEFAULT_SETTINGS.size, FONT_SIZES.length);
  const lineHeight = clampIndex(
    v.lineHeight ?? DEFAULT_SETTINGS.lineHeight,
    LINE_HEIGHTS.length
  );
  const width = clampIndex(v.width ?? DEFAULT_SETTINGS.width, READING_WIDTHS.length);
  return { theme, size, lineHeight, width };
}

/** Resolve settings into CSS custom properties applied to the reading column. */
export function settingsToCssVars(settings: ReaderSettings): Record<string, string> {
  return {
    "--reading-size": `${FONT_SIZES[settings.size]}rem`,
    "--reading-leading": String(LINE_HEIGHTS[settings.lineHeight]),
    "--reading-width": `${READING_WIDTHS[settings.width]}rem`,
  };
}

/** Human label for the current font-size step (used in the Aa control). */
export function sizeLabel(index: number): string {
  return `${FONT_SIZES[clampIndex(index, FONT_SIZES.length)] * 100}%`;
}

/** Serialize settings to a JSON string safe for localStorage. */
export function serializeSettings(settings: ReaderSettings): string {
  return JSON.stringify(settings);
}
