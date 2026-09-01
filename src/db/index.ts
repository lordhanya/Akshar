import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

/**
 * Neon serverless HTTP client (₹0 free tier, no separate server).
 *
 * Uses both the application schema and the Better Auth generated schema so
 * that Drizzle knows about every table (auth + app). The connection string
 * is read at request time so nothing is baked into the bundle at build time.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, {
  schema: { ...appSchema, ...authSchema },
});
