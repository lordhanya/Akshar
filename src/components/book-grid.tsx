import { BookCard } from "@/components/book-card";
import type { CatalogBook } from "@/lib/books";
import { cn } from "@/lib/utils";

/** Responsive grid of book cards used across discovery pages. */
export function BookGrid({
  books,
  className,
}: {
  books: CatalogBook[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        className
      )}
    >
      {books.map((book) => (
        <li key={book.id} className="min-w-0">
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
