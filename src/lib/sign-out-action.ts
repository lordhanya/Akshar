"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Sign the current user out, then return to the home page. */
export async function signOut(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    /* best-effort — fall through to redirect even if the session is stale */
  }
  redirect("/");
}
