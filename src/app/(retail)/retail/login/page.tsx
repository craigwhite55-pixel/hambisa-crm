"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginAppToggle } from "@/components/auth/LoginAppToggle";

export default function RetailLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

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

    router.push("/retail/import");
    router.refresh();
  }

  return (
    <div className="retail-app flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md retail-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-accent">
            Hambisa Retail Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted">Performance Tracker · POS Analytics</p>
        </div>

        <LoginAppToggle active="retail" variant="retail" />

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

          {error && (
            <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
