"use client";

import { useState, useTransition } from "react";
import { Bookmark, Check } from "lucide-react";
import { toggleReadLater } from "@/lib/read-later-actions";
import { cn } from "@/lib/utils";

/**
 * Bookmark toggle for Read Later — shown as an overlay icon on book cards.
 * Optimistic UI with graceful rollback on failure.
 */
export function ReadLaterButton({
  bookId,
  inReadLater: initial,
  title,
}: {
  bookId: string;
  inReadLater: boolean;
  title: string;
}) {
  const [inReadLater, setInReadLater] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      const res = await toggleReadLater(bookId);
      if (res.ok) setInReadLater(res.inReadLater);
      else setError(res.error ?? "Couldn't update.");
    });
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={pending}
        aria-label={inReadLater ? `Remove ${title} from Read Later` : `Save ${title} for later`}
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background",
          inReadLater && "text-primary"
        )}
      >
        {inReadLater ? (
          <Check className="size-4" />
        ) : (
          <Bookmark className="size-4" />
        )}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap text-xs text-destructive">
          {error}
        </p>
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}
