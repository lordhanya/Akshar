"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { friendlyResetPasswordError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam ? friendlyResetPasswordError(errorParam) : null,
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-destructive">
          Invalid or missing reset link. Please request a new one.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword,
      token: token ?? undefined,
    });
    setLoading(false);
    if (error) {
      setError(friendlyResetPasswordError(error.code ?? undefined));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/sign-in"), 3000);
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Your password has been reset. Redirecting to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
