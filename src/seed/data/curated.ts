import type { SeedBook } from "@/seed/types";

/**
 * Curated seed catalogue — verified public-domain classics.
 *
 * Every record was verified live against Project Gutenberg via Gutendex
 * (`copyright: false` => public domain in the US catalog) on 2026-09-01.
 * `sourceId` is the real Gutenberg id, `contentUrl` is the real plain-text
 * download URL, and `provenance` records where each was confirmed.
 *
 * The Assamese catalogue is intentionally EMPTY (see `// seed/assamese`)
 * because none of the approved providers carries verifiable Assamese content;
 * per the plan we do not fabricate records.
 */
export const curatedSeed: SeedBook[] = [
  {
    id: "gut-1342",
    title: "Pride and Prejudice",
    description:
      "Elizabeth Bennet must learn to see past first impressions and hasty judgments when the proud Mr. Darcy enters her world.",
    language: "en",
    source: "gutenberg",
    sourceId: "1342",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    authors: [{ name: "Jane Austen", slug: "jane-austen" }],
    genres: ["Romance", "Classic Literature", "Domestic Fiction"],
    contentUrl: "https://www.gutenberg.org/ebooks/1342.txt.utf-8",
    provenance: "Verified via Gutendex id 1342 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-84",
    title: "Frankenstein; or, The Modern Prometheus",
    description:
      "Victor Frankenstein creates a living creature and abandons it, setting both on a dark path of vengeance and tragedy.",
    language: "en",
    source: "gutenberg",
    sourceId: "84",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    authors: [{ name: "Mary Wollstonecraft Shelley", slug: "mary-wollstonecraft-shelley" }],
    genres: ["Gothic Fiction", "Horror", "Science Fiction"],
    contentUrl: "https://www.gutenberg.org/ebooks/84.txt.utf-8",
    provenance: "Verified via Gutendex id 84 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-76",
    title: "Adventures of Huckleberry Finn",
    description:
      "Huck escapes his abusive father and flees down the Mississippi with Jim, an escaped enslaved man seeking freedom.",
    language: "en",
    source: "gutenberg",
    sourceId: "76",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/76/pg76.cover.medium.jpg",
    authors: [{ name: "Mark Twain", slug: "mark-twain" }],
    genres: ["Adventure", "Classic Literature", "Bildungsroman"],
    contentUrl: "https://www.gutenberg.org/ebooks/76.txt.utf-8",
    provenance: "Verified via Gutendex id 76 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-98",
    title: "A Tale of Two Cities",
    description:
      "Love, sacrifice, and resurrection amid the terror of the French Revolution, set between London and Paris.",
    language: "en",
    source: "gutenberg",
    sourceId: "98",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg",
    authors: [{ name: "Charles Dickens", slug: "charles-dickens" }],
    genres: ["Historical Fiction", "Classic Literature", "Romance"],
    contentUrl: "https://www.gutenberg.org/ebooks/98.txt.utf-8",
    provenance: "Verified via Gutendex id 98 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-1661",
    title: "The Adventures of Sherlock Holmes",
    description:
      "Twelve detective tales featuring Sherlock Holmes and Dr. Watson, his matchless method and enduring cases.",
    language: "en",
    source: "gutenberg",
    sourceId: "1661",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    authors: [{ name: "Arthur Conan Doyle", slug: "arthur-conan-doyle" }],
    genres: ["Mystery", "Short Stories", "Detective Fiction"],
    contentUrl: "https://www.gutenberg.org/ebooks/1661.txt.utf-8",
    provenance: "Verified via Gutendex id 1661 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-43",
    title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
    description:
      "Lawyer Utterson investigates the curious, disturbing bond between his friend Dr. Jekyll and the monstrous Edward Hyde.",
    language: "en",
    source: "gutenberg",
    sourceId: "43",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/43/pg43.cover.medium.jpg",
    authors: [{ name: "Robert Louis Stevenson", slug: "robert-louis-stevenson" }],
    genres: ["Gothic Fiction", "Horror", "Classics"],
    contentUrl: "https://www.gutenberg.org/ebooks/43.txt.utf-8",
    provenance: "Verified via Gutendex id 43 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-11",
    title: "Alice's Adventures in Wonderland",
    description:
      "A curious girl follows a White Rabbit down a rabbit hole into a world of whimsical, illogical creatures.",
    language: "en",
    source: "gutenberg",
    sourceId: "11",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    authors: [{ name: "Lewis Carroll", slug: "lewis-carroll" }],
    genres: ["Fantasy", "Children's Literature", "Nonsense"],
    contentUrl: "https://www.gutenberg.org/ebooks/11.txt.utf-8",
    provenance: "Verified via Gutendex id 11 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-25344",
    title: "The Scarlet Letter",
    description:
      "Hester Prynne, condemned for adultery in Puritan Massachusetts, must wear a scarlet \u201cA\u201d while guarding a secret.",
    language: "en",
    source: "gutenberg",
    sourceId: "25344",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/25344/pg25344.cover.medium.jpg",
    authors: [{ name: "Nathaniel Hawthorne", slug: "nathaniel-hawthorne" }],
    genres: ["Historical Fiction", "Classic Literature", "Romance"],
    contentUrl: "https://www.gutenberg.org/ebooks/25344.txt.utf-8",
    provenance: "Verified via Gutendex id 25344 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-2701",
    title: "Moby Dick; Or, The Whale",
    description:
      "Ishmael narrates Captain Ahab's obsessive hunt for the white sperm whale that maimed him, aboard the Pequod.",
    language: "en",
    source: "gutenberg",
    sourceId: "2701",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    authors: [{ name: "Herman Melville", slug: "herman-melville" }],
    genres: ["Adventure", "Sea Stories", "Classic Literature"],
    contentUrl: "https://www.gutenberg.org/ebooks/2701.txt.utf-8",
    provenance: "Verified via Gutendex id 2701 (copyright:false), 2026-09-01",
  },
  {
    id: "gut-174",
    title: "The Picture of Dorian Gray",
    description:
      "A beautiful young man wishes his painted portrait would age instead of him, and his wish becomes terrifyingly real.",
    language: "en",
    source: "gutenberg",
    sourceId: "174",
    rights: "public_domain",
    coverUrl: "https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg",
    authors: [{ name: "Oscar Wilde", slug: "oscar-wilde" }],
    genres: ["Gothic Fiction", "Philosophical Fiction", "Classics"],
    contentUrl: "https://www.gutenberg.org/ebooks/174.txt.utf-8",
    provenance: "Verified via Gutendex id 174 (copyright:false), 2026-09-01",
  },
];
