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
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionNav } from "@/components/reader/section-nav";
import { ReaderSettingsControl } from "@/components/reader/reader-settings";
import { LibraryPrompt } from "@/components/library-prompt";
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
 * - Book opening cover section on fresh reads (excluded from progress).
 */

const SETTINGS_KEY = "kitap:reader:settings";
// Where the "current line" sits within the scroll viewport (px from top).
const ANCHOR_PX = 64;
// Persist at most this often, and after scroll settles.
const SAVE_DEBOUNCE_MS = 3000;
const PUSH_ANCHOR_PX = 120;

export function Reader({
  book,
  content,
  userId,
  initialProgress,
  inLibrary,
}: {
  book: ReaderBook;
  content: ReaderSection[];
  userId: string | null;
  initialProgress: SavedReadingProgress | null;
  inLibrary: boolean;
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
  const rafRef = useRef<number>(0);

  const weights = useMemo(() => sectionWeights(content), [content]);
  const isAssamese = book.language === "as";
  const hasCover = Boolean(book.coverUrl);

  // ---- Settings: load from localStorage after mount, persist on change ----
  useEffect(() => {
    let loaded = DEFAULT_SETTINGS;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) loaded = normalizeSettings(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    const current =
      resolvedTheme === "light" || resolvedTheme === "dark" || resolvedTheme === "sepia"
        ? resolvedTheme
        : loaded.theme;
    loaded = { ...loaded, theme: current };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loaded);
    setMounted(true);
  }, [resolvedTheme]);

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
  // Offsets by cover height so section indices remain content-only.
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
      void saveReadingProgress(book.id, {
        locator: pending.locator,
        pct: pending.pct,
      }).catch(() => {
        /* persistence failure must not break reading */
      });
      return;
    }

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

    // Always store the latest progress for saving (even if UI is throttled).
    const progress: ReaderProgress = { locator, pct: p, updatedAt: Date.now() };
    pendingRef.current = progress;

    // Update UI instantly — progress bar should track scroll in real time.
    setActiveSection(active);
    setPct(p);

    // Debounce the actual save — wait for stable reading position.
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
      const resolved = resolveResume(local, server);
      target = resolved.progress;
      if (resolved.source === "local" && target) {
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
        {/* Book opening cover — shown only on fresh reads, excluded from progress. */}
        {hasCover && (
          <div
            className="flex flex-col items-center px-6 pt-16 pb-12 sm:pt-24 sm:pb-16"
          >
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-lg ring-1 ring-foreground/10 sm:max-w-[280px]">
              <Image
                src={book.coverUrl!}
                alt={`Cover of ${book.title}`}
                fill
                sizes="(min-width: 640px) 280px, 240px"
                unoptimized
                className="object-cover object-center"
                draggable={false}
                priority
              />
            </div>
            <h1 className="mt-8 text-center font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {book.title}
            </h1>
            {book.authors.length > 0 && (
              <p className="mt-2 text-center text-base text-muted-foreground sm:text-lg">
                {book.authors.join(", ")}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground/70">
              <span className="uppercase tracking-wider">
                {book.language === "en"
                  ? "English"
                  : book.language === "as"
                    ? "Assamese"
                    : book.language.toUpperCase()}
              </span>
            </div>
            <span className="mt-8 text-sm text-muted-foreground/50">
              ↓ Start reading
            </span>
          </div>
        )}

        {/* No-cover fallback header — shown when there is no cover image. */}
        {!hasCover && (
          <div className="flex flex-col items-center px-6 pt-16 pb-8 sm:pt-24 sm:pb-12">
            <div
              className="flex aspect-[2/3] w-full max-w-[240px] flex-col items-center justify-center gap-3 rounded-lg bg-muted/60 ring-1 ring-foreground/10 sm:max-w-[280px]"
              aria-label={`Cover of ${book.title}`}
              role="img"
            >
              <BookOpen className="size-8 text-muted-foreground/50" />
              <span className="px-4 text-center font-heading text-3xl leading-none text-muted-foreground/60">
                {book.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="mt-8 text-center font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {book.title}
            </h1>
            {book.authors.length > 0 && (
              <p className="mt-2 text-center text-base text-muted-foreground sm:text-lg">
                {book.authors.join(", ")}
              </p>
            )}
            <span className="mt-8 text-sm text-muted-foreground/50">
              ↓ Start reading
            </span>
          </div>
        )}

        {/* Book content — all progress tracking is over these sections only. */}
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

      {/* Library prompt — appears once after content loads, dismissible. */}
      {mounted && (
        <LibraryPrompt
          bookId={book.id}
          title={book.title}
          inLibrary={inLibrary}
          userId={userId}
        />
      )}
    </div>
  );
}
