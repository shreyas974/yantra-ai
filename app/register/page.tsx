"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cpu, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join CHAD Hackathon</h1>
          <p className="text-xs text-gray-400 font-mono">Create your participant account to begin</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Account Created!</h3>
            <p className="text-sm text-gray-300">
              A verification link has been sent to <strong>{email}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-surface-muted border border-surface-border text-left text-xs text-gray-300 space-y-2">
              <span className="font-semibold text-cyan-400 block">Next Steps:</span>
              <p>1. In local dev mode, inspect emails in <code>work/mail/</code>.</p>
              <p>2. Open the verification link to verify your email.</p>
              <p>3. Complete your participant profile and join or create a team.</p>
            </div>
            <Link
              href="/login"
              className="inline-block mt-2 px-6 py-2.5 rounded-lg bg-surface border border-surface-border text-xs font-semibold text-white hover:bg-surface-border transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="you@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="Re-enter password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {loading ? "Creating Account..." : "Sign Up"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-surface-border text-center text-xs text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
