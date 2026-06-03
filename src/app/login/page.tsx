import Link from "next/link";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { DoodleCup } from "@/components/doodle";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; description?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? "/table";

  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="login-title">
        <p className="eyebrow">customer sign-in</p>
        <h1 id="login-title">Welcome back</h1>
        <DoodleCup />
        <p className="tagline">Sign in with Google to browse the menu and order at your table.</p>
        {params.error ? (
          <div className="form-error-block" style={{ margin: "12px 0", textAlign: "center" }}>
            <p className="form-error" style={{ marginBottom: "4px" }}>Sign-in could not complete.</p>
            {params.description ? (
              <p className="form-error" style={{ fontSize: "14px", color: "var(--coral)", marginBottom: "8px", fontWeight: "bold" }}>
                Error reason: {params.description}
              </p>
            ) : null}
            <p className="session-note" style={{ fontSize: "14px", lineHeight: "1.4" }}>
              💡 <strong>Troubleshooting Tip:</strong> Make sure you have copied the <strong>Auth Client ID</strong> and <strong>Client Secret</strong> from your configs.txt and pasted them into your <strong>Supabase Dashboard &gt; Providers &gt; Google</strong> settings page, and that you have registered your redirect URI in your Google Cloud Console!
            </p>
          </div>
        ) : null}
        <GoogleSignInButton nextPath={nextPath} />

        <Link href="/" className="secondary-button">
          Back to home
        </Link>
      </section>
    </main>
  );
}
