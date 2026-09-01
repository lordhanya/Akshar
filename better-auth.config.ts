import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

/**
 * CLI-only configuration used to generate the Better Auth database schema.
 *
 * This exists separately from the runtime auth instance (src/auth.ts) so the
 * `@better-auth/cli generate` command can derive the auth tables without a
 * live database connection or TS path aliases.
 *
 * Generates to: src/db/auth-schema.ts
 *   npx @better-auth/cli generate --config better-auth.config.ts \
 *     --output src/db/auth-schema.ts
 */
const sql = neon(
  process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/dev"
);
const db = drizzle(sql);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {},
  }),
  emailAndPassword: {
    enabled: true,
  },
});
