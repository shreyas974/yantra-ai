"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-xs text-gray-400">Enter your account email to receive a password reset link.</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-sm text-gray-200">
              If an account with that email exists, password reset instructions have been generated.
            </p>
            <p className="text-xs text-gray-400">
              Check your local mail folder (<code>work/mail/</code>).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="you@domain.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-sm"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
