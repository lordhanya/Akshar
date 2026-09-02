import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regression guard for the "theme toggle not working" bug.
 *
 * The reader once applied its stored theme with a bare
 *   `if (mounted) setTheme(settings.theme)`
 * on every mount. Combined with the reader's default `sepia` theme, opening a
 * book **clobbered** whatever theme the user had chosen globally (e.g. via the
 * header toggle): set Dark, open a book, and it silently reverted to Sepia —
 * making the global theme toggle appear broken.
 *
 * The fix gates the application behind a first-open guard so the reader only
 * calls `setTheme` when the user explicitly changes the theme (via the Aa
 * control), and otherwise inherits the currently active theme.
 *
 * This is a source-level guard because the Reader client component depends on
 * next-themes, localStorage and a DOM, which aren't available in the node test
 * environment; the invariant we assert is exactly the one that was violated.
 */
describe("Reader theme application (do not clobber the global theme)", () => {
  const src = readFileSync(resolve(__dirname, "reader.tsx"), "utf8");

  it("does not call setTheme unconditionally on mount", () => {
    // There must be no bare `if (mounted) setTheme(...)` — the original bug.
    expect(/if\s*\(\s*mounted\s*\)\s*setTheme\s*\(/.test(src)).toBe(false);
  });

  it("first-pass guard appears before it ever applies setTheme", () => {
    const guard = src.indexOf("themeAppliedRef");
    const apply = src.indexOf("setTheme(settings.theme)");
    expect(guard).toBeGreaterThan(-1);
    expect(apply).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(apply);
  });

  it("only applies the theme on an explicit change (skip on first open)", () => {
    // The guarded effect must skip applying on the first post-mount pass.
    expect(src).toContain(
      "if (!themeAppliedRef.current) {"
    );
    expect(src).toContain("themeAppliedRef.current = true;");
    expect(src).toContain("return;");
  });
});
