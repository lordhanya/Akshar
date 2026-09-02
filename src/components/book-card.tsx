import Link from "next/link";
import { BookOpen, SearchX } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { ReadLaterButton } from "@/components/read-later-button";
import type { CatalogBook } from "@/lib/books";
import { availabilityFromReadable, availabilityLabel } from "@/lib/availability";
import { cn } from "@/lib/utils";

/**
 * A single catalog book card.
 *
 * Only useful signals — cover, title, author, language — and an obvious
 * availability state. We never imply a book is readable when the rights
 * guardrail forbids it.
 */
export function BookCard({
  book,
  className,
  sizes,
  inReadLater,
}: {
  book: CatalogBook;
  className?: string;
  sizes?: string;
  inReadLater?: boolean;
}) {
  return (
    <Link
      href={`/books/${book.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-card pb-3 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={book.title}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40">
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]">
          <BookCover
            src={book.coverUrl}
            alt={book.title}
            sizes={sizes ?? "(min-width: 768px) 12rem, 9rem"}
          />
        </div>
        {/* Bookmark overlay — top-right corner */}
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <ReadLaterButton
            bookId={book.id}
            inReadLater={inReadLater ?? false}
            title={book.title}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pt-3">
        <h3 className="line-clamp-2 font-heading text-sm leading-snug font-medium">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.authors.join(", ") || "Unknown author"}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            {languageLabel(book.language)}
          </span>
          <AvailabilityBadge readable={book.readable} />
        </div>
      </div>
    </Link>
  );
}

export function AvailabilityBadge({
  readable,
  className,
}: {
  readable: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.68rem] font-medium",
        readable ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
        className
      )}
    >
      {readable ? (
        <>
          <BookOpen className="size-3" />
          {availabilityLabel(availabilityFromReadable(readable))}
        </>
      ) : (
        <>
          <SearchX className="size-3" />
          {availabilityLabel(availabilityFromReadable(readable))}
        </>
      )}
    </span>
  );
}

export function languageLabel(code: string): string {
  const map: Record<string, string> = {
    en: "English",
    as: "অসমীয়া",
    hi: "हिन्दी",
    bn: "বাংলা",
    fr: "French",
    de: "German",
    es: "Spanish",
    und: "Unknown",
  };
  return map[code] ?? code.toUpperCase();
}
