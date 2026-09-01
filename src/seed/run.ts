import "dotenv/config";
import { seedCatalog } from "./index";

/**
 * Standalone seed CLI.
 *
 *   npx tsx src/seed/run.ts                 # seed metadata only
 *   npx tsx src/seed/run.ts --fetch-content # also fetch + cache readable content
 *   npx tsx src/seed/run.ts --only 1342 --only 84
 */
async function main() {
  const args = process.argv.slice(2);
  const fetchContent = args.includes("--fetch-content");
  const only: string[] = [];
  args.forEach((a, i) => {
    if (a === "--only" && args[i + 1]) only.push(args[i + 1]);
  });

  const result = await seedCatalog({ fetchContent, only });
  console.log(
    `\nSeed complete: ${result.seeded} seeded, ${result.failed} failed, ` +
      `${result.assamese} Assamese (curated)`
  );
  if (result.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
