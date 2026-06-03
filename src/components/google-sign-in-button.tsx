"use client";

import { BadgeCheck } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  nextPath?: string;
  className?: string;
  label?: string;
};

export function GoogleSignInButton({
  nextPath = "/table",
  className = "primary-button",
  label = "Continue with Google"
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="sign-in-block">
      <button className={className} type="button" onClick={handleSignIn} disabled={isLoading}>
        <BadgeCheck size={20} />
        {isLoading ? "Redirecting..." : label}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
