"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid staff credentials.");
      setIsSubmitting(false);
      return;
    }

    const next = searchParams.get("next") ?? "/admin/dashboard";
    router.replace(next);
    router.refresh();
  }

  return (
    <form className="landing-card action-card caramel" onSubmit={handleSubmit}>
      <p className="eyebrow">staff login</p>
      <h1>Café dashboard</h1>
      <p className="tagline">Shared staff account for orders and menu management.</p>
      <label htmlFor="staff-email">Email</label>
      <input
        id="staff-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <label htmlFor="staff-password">Password</label>
      <input
        id="staff-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        <LogIn size={18} />
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <Link href="/" className="secondary-button">
        Back to home
      </Link>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="landing-page">
      <Suspense fallback={<p className="landing-card">Loading...</p>}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
