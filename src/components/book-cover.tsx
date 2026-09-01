import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Book cover with a graceful fallback.
 *
 * Covers are remote (Gutenberg / Open Library) and can be slow, missing, or
 * blocked by referrer policies. We always render a stable frame and swap in
 * a quiet placeholder (an empty book with the title's initial) when a cover
 * is unavailable.
 */
export function BookCover({
  src,
  alt,
  className,
  sizes = "(min-width: 640px) 12rem, 8rem",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized
        className={cn("object-cover object-center", className)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/60 text-muted-foreground",
        className
      )}
      aria-label={alt}
      role="img"
    >
      <BookOpen className="size-6 opacity-50" />
      <span className="px-2 text-center font-heading text-lg leading-none text-muted-foreground/80">
        {initial(alt)}
      </span>
    </div>
  );
}

function initial(title: string): string {
  const t = title.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}
