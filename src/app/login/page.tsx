"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setMessage("");
        setError("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/quotes");
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage("Check your email for a password reset link.");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage("Password updated. You can sign in now.");
    setMode("login");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-[14px] border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-accent">
            HAMBISA <span className="text-foreground">CRM</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Africa · Rural Retail &amp; Operations</p>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setMessage("");
              }}
              className="text-left text-xs text-accent hover:underline"
            >
              Forgot password?
            </button>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            {message && (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label className="label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            {message && (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="btn-secondary w-full"
            >
              Back to sign in
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <p className="text-sm text-muted">Choose a new password for your account.</p>
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
