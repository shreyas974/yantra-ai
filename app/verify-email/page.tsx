"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(tokenFromUrl ? "loading" : "idle");
  const [message, setMessage] = useState("");

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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Email Verification</h1>

        {status === "loading" && (
          <div className="py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-gray-300">Verifying your token with CHAD server...</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Verification Complete</h3>
            <p className="text-sm text-gray-300">{message}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/dashboard/profile"
                className="w-full py-2.5 rounded-xl font-bold text-black bg-cyan-400 hover:bg-cyan-300 text-sm"
              >
                Complete Profile
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-xl text-gray-300 bg-surface-muted hover:bg-surface-border text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Verification Failed</h3>
            <p className="text-sm text-red-300">{message}</p>
            <p className="text-xs text-gray-400">Tokens are single-use and expire in 24 hours.</p>
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-4 text-left">
            <p className="text-xs text-gray-400">
              Paste the verification token from your email confirmation JSON or click the direct link in the email.
            </p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here"
              className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
            />
            <button
              onClick={() => verifyToken(token)}
              disabled={!token}
              className="w-full py-2.5 rounded-xl font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-sm"
            >
              Verify Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
