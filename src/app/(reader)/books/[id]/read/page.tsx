import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reader } from "@/components/reader/reader";
import { loadReaderContent } from "@/lib/reader/load";
import { getReadingProgress } from "@/lib/reader/actions";
import { isInLibrary } from "@/lib/library-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await loadReaderContent(id).catch(() => null);
  if (!result?.ok) return { title: "Reader" };
  return {
    title: result.book.title,
    description: `Read ${result.book.title} by ${result.book.authors.join(", ")} in the Akshar reader.`,
  };
}

function Unavailable({
  reason,
  bookId,
}: {
  reason: string;
  bookId: string;
}) {
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 text-center">
        <h1 className="font-heading text-xl font-semibold">Reading unavailable</h1>
        <p className="mt-3 text-muted-foreground">{reason}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/books/${bookId}`}>
            <ArrowLeft data-icon="inline-start" /> Back to book
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function ReadPage({ params }: PageProps) {
  const { id } = await params;
  const result = await loadReaderContent(id).catch(() => null);

  if (!result) {
    return <Unavailable reason="We couldn't load this book right now." bookId={id} />;
  }
  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    if (result.reason === "not_readable") {
      return (
        <Unavailable
          reason="This book is metadata-only, so reading isn't available."
          bookId={id}
        />
      );
    }
    return (
      <Unavailable
        reason="This book has no readable content yet. It may be added soon."
        bookId={id}
      />
    );
  }

  const [initialProgress, inLibrary] = await Promise.all([
    result.userId
      ? getReadingProgress(result.book.id).catch(() => null)
      : Promise.resolve(null),
    result.userId
      ? isInLibrary(result.book.id).catch(() => false)
      : Promise.resolve(false),
  ]);

  return (
    <Reader
      book={result.book}
      content={result.content}
      userId={result.userId}
      initialProgress={initialProgress}
      inLibrary={inLibrary}
    />
  );
}
