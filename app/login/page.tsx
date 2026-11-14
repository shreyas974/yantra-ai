"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import PasswordField from "@/components/PasswordField";
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login failed.");
            }
            else {
                router.push(data.user?.role === "ADMIN" ? "/admin" : "/dashboard");
                router.refresh();
                return;
            }
        }
        catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };
    return (<AuthShell eyebrow="WELCOME BACK" title={<>Pick up<br />where you <em>left off.</em></>} intro="Sign in to manage your profile, your team and your registration — or to run the event as an organizer.">
      <div className="auth-head">
        <p className="eyebrow">SIGN IN</p>
        <h2>Welcome back to YANTRA AI</h2>
        <p>New here? <Link href="/register">Create an account</Link></p>
      </div>

      {error && (<div className="auth-alert" role="alert"><AlertCircle size={17} /><span>{error}</span></div>)}

      <form onSubmit={handleLogin} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
        </div>
        <div className="auth-field-row">
          <PasswordField id="login-password" label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          <Link href="/forgot-password" className="auth-forgot">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowUpRight size={18} /></>}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <Link href="/guest" className="auth-ghost">Explore as a guest <ArrowUpRight size={16} /></Link>
      <p className="auth-fine">Organizer access is granted by the event owner. Signing up creates a participant account.</p>
    </AuthShell>);
}
