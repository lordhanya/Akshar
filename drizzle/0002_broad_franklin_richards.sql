CREATE TABLE "book_content" (
	"bookId" text PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"sections" jsonb NOT NULL,
	"sourceUrl" text,
	"sourceSha256" text,
	"word_count" integer,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_content" ADD CONSTRAINT "book_content_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_content_language_idx" ON "book_content" USING btree ("language");