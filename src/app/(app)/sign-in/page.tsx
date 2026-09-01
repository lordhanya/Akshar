import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to keep your reading progress in sync across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
