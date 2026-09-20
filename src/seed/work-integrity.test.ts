import { describe, it, expect } from "vitest";
import { curatedSeed } from "./data/curated";
import { isReadable } from "@/providers/rights";

// Correct work identity for every Project Gutenberg source the catalogue
// claims to read from. Key: the Gutenberg id a readable record MUST reference.
// Value: a representative title phrase that the record's title must match.
//
// This manifest is the source of truth for the gut-* ↔ work mapping. Records
// pointing at a Gutenberg id whose actual work is a *different book* (wrong
// edition/volume selected while metadata stayed correct) fail loudly here.
// Audit 2026-09-20: 14516 (Punch, or the London Charivari), 4504 (Brentano,
// German), 25503 (Le Tour du Monde, French), 216 (Tao Teh King), 74 (Tom
// Sawyer) were all mis-mapped; their correct ids are 16317, 4507, 2388,
// 1021 and 209 respectively.
const EXPECTED_GUTENBERG_WORK: Record<string, string> = {
  "1342": "Pride and Prejudice",
  "84": "Frankenstein",
  "76": "Huckleberry Finn",
  "98": "Tale of Two Cities",
  "1661": "Sherlock Holmes",
  "43": "Dr Jekyll and Mr Hyde",
  "11": "Alice in Wonderland",
  "25344": "Scarlet Letter",
  "2701": "Moby Dick",
  "174": "Dorian Gray",
  "2680": "Meditations",
  "1497": "Republic",
  "1998": "Zarathustra",
  "46": "Christmas Carol",
  "132": "Art of War",
  "1232": "The Prince",
  "16317": "The Art of Public Speaking",
  "4507": "Man Thinketh",
  "2388": "Bhagavad Gita",
  "1021": "Congo and Other Poems",
  "16328": "Beowulf",
  "1727": "Odyssey",
  "345": "Dracula",
  "1260": "Jane Eyre",
  "209": "The Turn of the Screw",
  "36": "War of the Worlds",
  "120": "Treasure Island",
  "2800": "The Koran",
  "1228": "Origin of Species",
  "205": "Walden",
  "35": "Time Machine",
  "5230": "Invisible Man",
  "164": "Twenty Thousand Leagues",
  "18857": "Journey to the Centre of the Earth",
  "1268": "Mysterious Island",
  "201": "Flatland",
  "1524": "Hamlet",
  "1513": "Romeo and Juliet",
  "1533": "Macbeth",
  "2542": "A Doll's House",
  "12242": "Emily Dickinson",
  "1041": "Sonnets",
  "20": "Paradise Lost",
  "135": "Les Miserables",
  "2600": "War and Peace",
  "768": "Wuthering Heights",
  "514": "Little Women",
  "730": "Oliver Twist",
  "21839": "Sense and Sensibility",
  "2814": "Dubliners",
  "219": "Heart of Darkness",
  "55": "Wizard of Oz",
  "16": "Peter Pan",
  "2591": "Grimms Fairy Tales",
  "1952": "Yellow Wallpaper",
  "3600": "Montaigne",
};

function normalize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function signatureMatches(recordTitle: string, signature: string): boolean {
  const title = normalize(recordTitle);
  const sig = normalize(signature);
  // Every significant word of one side must appear in the other, in either
  // direction. Tolerant of a record title being shorter or longer than the
  // canonical Gutenberg title (drops subtitles, localizes titles, etc.).
  return [...sig].every((w) => title.has(w)) || [...title].every((w) => sig.has(w));
}

describe("seed catalog → Gutenberg work integrity", () => {
  const readableGutenberg = curatedSeed.filter(
    (s) => s.source === "gutenberg" && isReadable(s.rights)
  );

  it("manifests exactly the readable Gutenberg sources (no orphans, no unknowns)", () => {
    const usedIds = new Set(readableGutenberg.map((s) => s.sourceId));
    const manifestIds = Object.keys(EXPECTED_GUTENBERG_WORK);
    expect(manifestIds.length).toBe(readableGutenberg.length);
    for (const id of manifestIds) expect(usedIds.has(id)).toBe(true);
    for (const s of readableGutenberg) {
      expect(EXPECTED_GUTENBERG_WORK[s.sourceId]).toBeTruthy();
    }
  });

  it("each readable record points at a Gutenberg work whose title matches the record", () => {
    for (const s of readableGutenberg) {
      const signature = EXPECTED_GUTENBERG_WORK[s.sourceId];
      expect(
        signature,
        `${s.id} ("${s.title}") has no manifest entry for Gutenberg ${s.sourceId}; ` +
          `this id is not a readable source in the catalogue.`
      ).toBeTruthy();
      expect(
        signatureMatches(s.title, signature),
        `${s.id} ("${s.title}") references Gutenberg ${s.sourceId}` +
          (signature ? ` — resolves to "${signature}", not a matching work` : "")
      ).toBe(true);
    }
  });

  it("each readable record's ids and URLs all reference the same Gutenberg work", () => {
    for (const s of readableGutenberg) {
      const id = s.sourceId;
      expect(s.contentUrl).toBe(`https://www.gutenberg.org/ebooks/${id}.txt.utf-8`);
      if (s.coverUrl) {
        expect(s.coverUrl).toContain(`/cache/epub/${id}/`);
      }
    }
  });
});