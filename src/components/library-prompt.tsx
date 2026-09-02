"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toggleInLibrary } from "@/lib/library-actions";

const DISMISS_KEY_PREFIX = "kitap:library-prompt:";

function getDismissKey(bookId: string) {
  return `${DISMISS_KEY_PREFIX}${bookId}`;
}

function isDismissed(bookId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(getDismissKey(bookId)) === "1";
  } catch {
    return true;
  }
}

function dismiss(bookId: string) {
  try {
    localStorage.setItem(getDismissKey(bookId), "1");
  } catch {
    /* ignore */
  }
}

/**
 * "Enjoying this book?" prompt shown after the reader content loads.
 * Appears only once per book, only for non-library books, and only for
 * authenticated users (anonymous users get a sign-in link).
 *
 * Dismissal is persisted in localStorage so it doesn't reappear on every visit.
 * Shows a brief checkmark on successful add before dismissing.
 */
export function LibraryPrompt({
  bookId,
  title: _title,
  inLibrary,
  userId,
}: {
  bookId: string;
  title: string;
  inLibrary: boolean;
  userId: string | null;
}) {
  const [visible, setVisible] = useState(() => {
    if (inLibrary) return false;
    return !isDismissed(bookId);
  });
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  // Auto-dismiss after showing success checkmark
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => {
      dismiss(bookId);
      setVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [added, bookId]);

  if (!visible || inLibrary) return null;

  function handleAdd() {
    startTransition(async () => {
      const res = await toggleInLibrary(bookId);
      if (res.ok) {
        setAdded(true);
      }
    });
  }

  function handleDismiss() {
    dismiss(bookId);
    setVisible(false);
  }

  return (
    <div className="pointer-events-auto fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border bg-card p-5 shadow-lg">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        {added ? (
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Check className="size-4 text-primary" />
            </div>
            <p className="text-sm font-medium">Added to your library</p>
          </div>
        ) : (
          <>
            <h3 className="pr-6 font-heading text-sm font-semibold">
              Enjoying this book?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Add it to your library so you can easily find it again and keep your
              reading progress synced.
            </p>
            <div className="mt-4 flex gap-2">
              {userId ? (
                <Button size="sm" onClick={handleAdd} disabled={pending}>
                  {pending ? "Adding..." : "Add to Library"}
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href={`/sign-in?next=/books/${bookId}/read`}>
                    Sign in to save
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not Now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
