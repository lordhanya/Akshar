import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { sendPasswordResetEmail } from "@/lib/resend";

/**
 * Better Auth instance (email + password only for Phase 0).
 *
 * The user is the first/primary tester, so OAuth is intentionally omitted.
 * It can be added later if it materially improves the sign-in UX.
 *
 * The Drizzle adapter is given the Better Auth schema explicitly so it can
 * resolve the user / session / account / verification models.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...authSchema,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, token }) => {
      const baseUrl = process.env.APP_BASE_URL || process.env.BETTER_AUTH_URL;
      const resetUrl = `${baseUrl}/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent("/reset-password")}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [nextCookies()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
