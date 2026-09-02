"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionNav } from "@/components/reader/section-nav";
import { ReaderSettingsControl } from "@/components/reader/reader-settings";
import {
  saveReadingProgress,
  type SavedReadingProgress,
} from "@/lib/reader/actions";
import type { ReaderBook, ReaderSection } from "@/lib/reader/load";
import {
  clampOffset,
  computePct,
  initialLocator,
  normalizeSection,
  resolveResume,
  sectionWeights,
  type ReaderLocator,
  type ReaderProgress,
} from "@/lib/reader/progress";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  serializeSettings,
  settingsToCssVars,
  type ReaderSettings,
} from "@/lib/reader/settings";
import {
  progressKey,
  parseStoredProgress,
  serializeProgress,
} from "@/lib/reader/storage";

/**
 * The reader: a calm vertical reading environment.
 *
 * Responsibilities:
 * - Continuous scroll over all sections (no paging).
 * - Deterministic, content-weighted reading progress + locator.
 * - Debounced persistence — anonymous to localStorage, authenticated to the
 *   server (Neon). Never on every scroll.
 * - Resume: conflict-resolve local vs server, then scroll to the saved spot.
 * - Compact settings (theme/size/line-height/width) that recede while reading.
 */

const SETTINGS_KEY = "kitap:reader:settings";
// Where the "current line" sits within the scroll viewport (px from top).
const ANCHOR_PX = 64;
// Persist at most this often, and after scroll settles.
const SAVE_DEBOUNCE_MS = 1500;
const PUSH_ANCHOR_PX = 120;

export function Reader({
  book,
  content,
  userId,
  initialProgress,
}: {
  book: ReaderBook;
  content: ReaderSection[];
  userId: string | null;
  initialProgress: SavedReadingProgress | null;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  // Guards against re-applying the stored theme on first open, which would
  // clobber a theme the user chose globally (e.g. via the header toggle).
  const themeAppliedRef = useRef(false);
  const [activeSection, setActiveSection] = useState(0);
  const [pct, setPct] = useState(0);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const pendingRef = useRef<ReaderProgress | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumedRef = useRef(false);

  const weights = useMemo(() => sectionWeights(content), [content]);
  const isAssamese = book.language === "as";

  // ---- Settings: load from localStorage after mount, persist on change ----
  useEffect(() => {
    let loaded = DEFAULT_SETTINGS;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) loaded = normalizeSettings(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // Sync the reader's displayed theme with the theme the app currently has
    // (resolvedTheme) rather than the stored one, so opening the reader never
    // overrides a theme the user chose globally — the stored value is instead
    // remembered purely as a preference for future explicit changes.
    const current =
      resolvedTheme === "light" || resolvedTheme === "dark" || resolvedTheme === "sepia"
        ? resolvedTheme
        : loaded.theme;
    loaded = { ...loaded, theme: current };
    // Reading localStorage after hydration requires a post-mount setState;
    // a lazy initializer can't see window on the server render. This is a
    // deliberate, hydration-safe exception to the "set state in effect" rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loaded);
    setMounted(true);
  }, [resolvedTheme]);

  // Apply the theme only when the user actively changes it (e.g. via the Aa
  // control), never on first open, so the reader inherits — and preserves —
  // whatever theme is active globally.
  useEffect(() => {
    if (!mounted) return;
    if (!themeAppliedRef.current) {
      themeAppliedRef.current = true;
      return;
    }
    setTheme(settings.theme);
  }, [mounted, settings.theme, setTheme]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(SETTINGS_KEY, serializeSettings(settings));
    } catch {
      /* ignore */
    }
  }, [mounted, settings]);

  // ---- Geometry helpers over the scroll container ----
  const geometry = useCallback(
    (index: number): { top: number; height: number } | null => {
      const el = sectionRefs.current[index];
      const scroller = scrollerRef.current;
      if (!el || !scroller) return null;
      const elRect = el.getBoundingClientRect();
      const rect = scroller.getBoundingClientRect();
      return {
        top: elRect.top - rect.top + scroller.scrollTop,
        height: el.offsetHeight,
      };
    },
    []
  );

  // ---- Flush pending progress to the right store ----
  const flushSave = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    if (userId) {
      // Authenticated: server is the source of truth (cross-device Resume).
      void saveReadingProgress(book.id, {
        locator: pending.locator,
        pct: pending.pct,
      }).catch(() => {
        /* persistence failure must not break reading */
      });
      return;
    }

    // Anonymous: persist locally.
    try {
      window.localStorage.setItem(
        progressKey(book.id),
        serializeProgress(pending)
      );
    } catch {
      /* ignore */
    }
  }, [book.id, userId]);

  // ---- Scroll handling: compute locator + pct, debounce-save ----
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || content.length === 0) return;

    const anchorTop = scroller.scrollTop + ANCHOR_PX;
    let active = 0;
    for (let i = 0; i < content.length; i++) {
      const g = geometry(i);
      if (!g) continue;
      if (g.top <= anchorTop) active = i;
      else break;
    }
    let offset = 0;
    const g = geometry(active);
    if (g) {
      offset = clampOffset((anchorTop - g.top) / (g.height || 1));
    }

    const locator: ReaderLocator = { v: 1, section: active, offset };
    const p = computePct(weights, active, offset);

    setActiveSection(active);
    setPct(p);

    const progress: ReaderProgress = { locator, pct: p, updatedAt: Date.now() };
    pendingRef.current = progress;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [content.length, geometry, weights, flushSave]);

  // ---- Resume: resolve local vs server, then scroll to saved position ----
  useLayoutEffect(() => {
    if (resumedRef.current || content.length === 0) return;
    resumedRef.current = true;

    let local: ReaderProgress | null = null;
    try {
      local = parseStoredProgress(
        window.localStorage.getItem(progressKey(book.id))
      );
    } catch {
      /* ignore */
    }

    let target: ReaderProgress | null = null;
    if (userId) {
      const server: ReaderProgress | null = initialProgress
        ? { ...initialProgress, updatedAt: initialProgress.updatedAt }
        : null;
      // For an authed reader we reconcile local (anon) + server and migrate.
      const resolved = resolveResume(local, server);
      target = resolved.progress;
      if (resolved.source === "local" && target) {
        // Migrate the newer local position to the server, then clear local.
        void saveReadingProgress(book.id, {
          locator: target.locator,
          pct: target.pct,
        }).catch(() => {});
        try {
          window.localStorage.removeItem(progressKey(book.id));
        } catch {
          /* ignore */
        }
      }
    } else if (local) {
      target = local;
    }

    const locator: ReaderLocator = target
      ? {
          v: 1,
          section: normalizeSection(target.locator.section, content.length),
          offset: clampOffset(target.locator.offset),
        }
      : initialLocator();

    const scroller = scrollerRef.current;
    const g = geometry(locator.section);
    if (scroller && g) {
      const wantAnchor = Math.min(
        scroller.scrollHeight - scroller.clientHeight,
        g.top + g.height * locator.offset - ANCHOR_PX
      );
      scroller.scrollTop = Math.max(0, wantAnchor);
      // Compute the visible state right away so the UI is truthful on load.
      const anchorTop = scroller.scrollTop + ANCHOR_PX;
      let active = 0;
      for (let i = 0; i < content.length; i++) {
        const gg = geometry(i);
        if (!gg) break;
        if (gg.top <= anchorTop) active = i;
        else break;
      }
      let offsetSec = 0;
      const gg = geometry(active);
      if (gg) offsetSec = clampOffset((anchorTop - gg.top) / (gg.height || 1));
      setActiveSection(active);
      setPct(computePct(weights, active, offsetSec));
    } else if (scroller) {
      scroller.scrollTop = 0;
    }
  }, [
    content.length,
    geometry,
    initialProgress,
    book.id,
    userId,
    weights,
  ]);

  // ---- Keep a keep-alive flush on tab close / hide ----
  useEffect(() => {
    function flush() {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      flushSave();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [flushSave]);

  // ---- Helper to scroll to a section ----
  const goToSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= content.length) return;
      const scroller = scrollerRef.current;
      const g = geometry(index);
      if (!scroller || !g) return;
      scroller.scrollTop = Math.max(
        0,
        Math.min(
          scroller.scrollHeight - scroller.clientHeight,
          g.top - PUSH_ANCHOR_PX
        )
      );
    },
    [content.length, geometry]
  );

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && !e.altKey && !e.metaKey) {
        const prev = Math.max(0, activeSection - 1);
        if (prev !== activeSection) {
          e.preventDefault();
          goToSection(prev);
        }
      } else if (e.key === "ArrowRight" && !e.altKey && !e.metaKey) {
        const next = Math.min(content.length - 1, activeSection + 1);
        if (next !== activeSection) {
          e.preventDefault();
          goToSection(next);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSection, content.length, goToSection]);

  const readingColumnStyle = {
    ...settingsToCssVars(settings),
    ...(isAssamese ? { fontFamily: "var(--font-assamese)" } : {}),
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* Top bar — recedes during reading (no shadow/card). */}
      <header className="border-b border-transparent select-none">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-3 py-2 sm:px-4">
          <Button asChild variant="ghost" size="sm" aria-label="Back to book">
            <Link href={`/books/${book.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <Link
            href={`/books/${book.id}`}
            className="min-w-0 flex-1 truncate text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            title={book.title}
          >
            {book.title}
          </Link>
          <div className="flex items-center gap-0.5">
            <SectionNav
              sections={content}
              activeIndex={activeSection}
              onSelect={goToSection}
            />
            <ReaderSettingsControl
              settings={settings}
              onChange={setSettings}
            />
          </div>
        </div>
      </header>

      {/* Scrollable reading column. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <article
          lang={isAssamese ? "as" : undefined}
          className="prose-reading mx-auto px-6 py-12 sm:px-8"
          style={readingColumnStyle}
        >
          {content.map((section, i) =>
            section.heading || section.paragraphs.length > 0 ? (
              <section
                key={i}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                data-section={i}
                aria-label={section.heading || `Section ${i + 1}`}
              >
                {section.heading ? <h2>{section.heading}</h2> : null}
                {section.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </section>
            ) : null
          )}
        </article>
      </div>

      {/* Bottom progress bar — calm, unobtrusive. */}
      <footer className="select-none">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground sm:px-4">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              goToSection(Math.max(0, activeSection - 1))
            }
            disabled={activeSection === 0}
            aria-label="Previous section"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-0 flex-1 truncate">
            {content[activeSection]?.heading || `Section ${activeSection + 1}`}
          </span>
          <span className="tabular-nums">
            {Math.round(pct * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              goToSection(Math.min(content.length - 1, activeSection + 1))
            }
            disabled={activeSection >= content.length - 1}
            aria-label="Next section"
          >
            <ChevronRight />
          </Button>
        </div>
      </footer>
    </div>
  );
}
