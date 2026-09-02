"use client";

import { useState, useTransition } from "react";
import { Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleReadLater } from "@/lib/read-later-actions";

export function RemoveFromReadLaterButton({
  bookId,
  title,
  onRemoved,
}: {
  bookId: string;
  title: string;
  onRemoved?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const res = await toggleReadLater(bookId);
      if (res.ok) {
        setConfirming(false);
        onRemoved?.();
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemove();
          }}
          disabled={isPending}
          aria-label={`Confirm remove ${title}`}
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }}
          disabled={isPending}
          aria-label="Cancel remove"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      aria-label={`Remove ${title} from Read Later`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
