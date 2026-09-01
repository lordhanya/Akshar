import { headers } from "next/headers";
import { auth } from "@/auth";

/**
 * Returns the current session in a Server Component / Server Action.
 *
 * Returns `{ session, user }` when signed in, or `null` when anonymous.
 * Reading pages remain usable without a session (See plan: anonymous
 * reading is supported; sign-in is only needed to persist progress/library).
 */
export async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    // DB unavailable (e.g. DATABASE_URL not configured locally). Fall back to
    // anonymous so the shell still renders; signed-in features degrade gracefully.
    return null;
  }
}
