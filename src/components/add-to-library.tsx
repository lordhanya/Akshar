"use client";

import { useState, useTransition } from "react";
import { BookMarked, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleInLibrary } from "@/lib/library-actions";

/**
 * "Add to Library" toggle for signed-in users, with optimistic UI.
 * Ragged gracefully: if the server action fails it returns to the prior state.
 */
export function AddToLibraryButton({
  bookId,
  inLibrary: initialInLibrary,
  title,
}: {
  bookId: string;
  inLibrary: boolean;
  title: string;
}) {
  const [inLibrary, setInLibrary] = useState(initialInLibrary);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const res = await toggleInLibrary(bookId);
      if (res.ok) setInLibrary(res.inLibrary);
      else setError(res.error ?? "Couldn’t update your library.");
    });
  }

  return (
    <div>
      <Button
        variant={inLibrary ? "secondary" : "outline"}
        size="lg"
        onClick={onToggle}
        disabled={pending}
      >
        {inLibrary ? (
          <>
            <Check data-icon="inline-start" />
            In your library
          </>
        ) : (
          <>
            <BookMarked data-icon="inline-start" />
            Add to library
          </>
        )}
      </Button>
      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
      <span className="sr-only">Book: {title}</span>
    </div>
  );
}
