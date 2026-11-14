"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowUpRight } from "lucide-react";
import AuthShell from "@/components/AuthShell";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(tokenFromUrl ? "loading" : "idle");
  const [message, setMessage] = useState("");
  const [firebaseMode, setFirebaseMode] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setFirebaseMode(d.authMode === "firebase"));
  }, []);

  const verifyToken = async (tok: string) => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
      } else {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
      }
    } catch {
      setStatus("error");
      setMessage("Network error occurred.");
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  return (
    <>
      <div className="auth-head">
        <p className="eyebrow">EMAIL VERIFICATION</p>
        <h2>Confirm your email</h2>
      </div>

      {status === "loading" && (
        <div className="auth-success" role="status">
          <span className="auth-success-icon"><Loader2 size={30} className="animate-spin" /></span>
          <p>Verifying your link…</p>
        </div>
      )}

      {status === "success" && (
        <div className="auth-success" role="status">
          <span className="auth-success-icon"><CheckCircle2 size={30} /></span>
          <h2>You’re verified.</h2>
          <p>{message}</p>
          <Link href="/dashboard/profile" className="auth-submit">Complete your profile <ArrowUpRight size={18} /></Link>
          <Link href="/dashboard" className="auth-ghost">Go to dashboard</Link>
        </div>
      )}

      {status === "error" && (
        <div className="auth-success" role="alert">
          <span className="auth-success-icon is-error"><AlertCircle size={30} /></span>
          <h2>Verification failed.</h2>
          <p>{message}</p>
          <p className="auth-fine">Links are single-use and expire after 24 hours. Sign in and resend one from Account settings.</p>
          <Link href="/login" className="auth-ghost">Go to sign in</Link>
        </div>
      )}

      {status === "idle" && firebaseMode && (
        <div className="auth-form">
          <p className="auth-copy">Open the verification link we emailed you. Once verified, sign in to continue your registration.</p>
          <Link href="/login" className="auth-submit">Continue to sign in <ArrowUpRight size={18} /></Link>
          <Link href="/dashboard/settings" className="auth-ghost">Request another verification email</Link>
        </div>
      )}

      {status === "idle" && !firebaseMode && (
        <div className="auth-form">
          <div className="auth-field">
            <label htmlFor="verify-token">Verification token</label>
            <input id="verify-token" type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the token from your email" />
          </div>
          <button onClick={() => verifyToken(token)} disabled={!token} className="auth-submit">Verify now <ArrowUpRight size={18} /></button>
        </div>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell eyebrow="ALMOST THERE" title={<>One click<br /><em>and you’re in.</em></>} intro="Verifying your email unlocks your profile, team creation and event registration.">
      <Suspense fallback={<p className="auth-fine">Loading…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
