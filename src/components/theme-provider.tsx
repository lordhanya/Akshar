"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps the app in next-themes so light / dark / sepia reading modes can be
 * switched and persisted. Modes are applied as classes on <html> (e.g.
 * `class="dark"`, `class="sepia"`), matching the CSS tokens in globals.css.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
