"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, MailCheck, AlertCircle } from "lucide-react";
import AuthShell from "@/components/AuthShell";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (response.status === 429) {
                setError("Too many requests. Please wait a minute and try again.");
                return;
            }
            setSubmitted(true);
        }
        catch {
            setError("Network error. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return (<AuthShell eyebrow="ACCOUNT RECOVERY" title={<>Locked out?<br /><em>Let’s fix that.</em></>} intro="We’ll email you a secure link to choose a new password. For your security, the link expires shortly.">
      <Link href="/login" className="auth-back"><ArrowLeft size={15} /> Back to sign in</Link>
      {submitted ? (<div className="auth-success" role="status">
          <span className="auth-success-icon"><MailCheck size={30} /></span>
          <h2>Check your inbox.</h2>
          <p>If an account exists for <strong>{email}</strong>, a password reset link is on its way.</p>
          <Link href="/login" className="auth-submit">Return to sign in <ArrowUpRight size={18} /></Link>
        </div>) : (<>
          <div className="auth-head">
            <p className="eyebrow">RESET PASSWORD</p>
            <h2>Forgot your password?</h2>
            <p>Enter the email address you signed up with.</p>
          </div>
          {error && <div className="auth-alert" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="forgot-email">Email address</label>
              <input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            </div>
            <button type="submit" disabled={loading} className="auth-submit">{loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <>Send reset link <ArrowUpRight size={18} /></>}</button>
          </form>
        </>)}
    </AuthShell>);
}
