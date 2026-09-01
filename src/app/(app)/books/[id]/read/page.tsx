import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookById } from "@/lib/books";
import { isReadable } from "@/providers";

export const metadata: Metadata = {
  title: "Reader",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The reader entry point (Phase 3).
 *
 * Phase 2 only routes "Read" here; the full reading UI (EPUB renderer,
 * controls, highlights, progress engine) is Phase 3 and intentionally not
 * built yet. This placeholder is strictly rights-gated: a non-readable book
 * never reaches this page via the details "Read" button.
 */
export default async function ReadPlaceholderPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBookById(id).catch(() => null);
  if (!book) notFound();
  if (!isReadable(book.rights)) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Reading unavailable
        </h1>
        <p className="mt-3 text-muted-foreground">
          This book is metadata-only, so reading isn’t available. You can still
          view its details.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/books/${id}`}>
            <ArrowLeft data-icon="inline-start" /> Back to book
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpen className="size-7" />
      </div>
      <h1 className="font-heading text-2xl font-semibold">
        The reader is coming in Phase 3
      </h1>
      <p className="mt-3 text-muted-foreground">
        “{book.title}” is ready and available to read. The full reading
        experience — chapters, progress and controls — is the next phase of
        কিতাপ.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/search">Browse more books</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/books/${id}`}>
            <ArrowLeft data-icon="inline-start" /> Book details
          </Link>
        </Button>
      </div>
    </div>
  );
}
