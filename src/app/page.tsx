import { LogIn } from "lucide-react";
import Link from "next/link";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { DoodleCup } from "@/components/doodle";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="landing-title">
        <p className="eyebrow">smart cafe ordering</p>
        <h1 id="landing-title">BrewBoard</h1>
        <DoodleCup />
        <p className="tagline">your daily cup, beautifully ordered</p>
        <div className="landing-actions">
          <GoogleSignInButton nextPath="/table" />
          <Link href="/admin/login" className="secondary-button">
            <LogIn size={20} />
            Staff Login
          </Link>
        </div>
        <p className="session-note">
          BrewBoard automatically saves and restores your active table context if your session is refreshed.
        </p>
      </section>
    </main>
  );
}

