"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import PasswordField from "@/components/PasswordField";
import { passwordSchema } from "@/lib/policies";
function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        const valid = passwordSchema.safeParse(password);
        if (!valid.success) {
            setError(valid.error.errors[0].message);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Reset failed.");
            }
            else {
                setSuccess(true);
            }
        }
        catch {
            setError("Network error occurred.");
        }
        finally {
            setLoading(false);
        }
    };
    if (success)
        return (<div className="auth-success" role="status">
        <span className="auth-success-icon"><CheckCircle2 size={30} /></span>
        <h2>Password updated.</h2>
        <p>Your password has been reset and all existing sessions were signed out. Sign in with your new password.</p>
        <Link href="/login" className="auth-submit">Sign in now <ArrowUpRight size={18} /></Link>
      </div>);
    return (<>
      <div className="auth-head">
        <p className="eyebrow">NEW PASSWORD</p>
        <h2>Choose a new password</h2>
        <p>Use 12 or more characters you don’t use elsewhere.</p>
      </div>
      {!token && <div className="auth-alert" role="alert"><AlertCircle size={17} /><span>This reset link is incomplete. <Link href="/forgot-password">Request a new one.</Link></span></div>}
      {error && (<div className="auth-alert" role="alert"><AlertCircle size={17} /><span>{error}</span></div>)}
      <form onSubmit={handleReset} className="auth-form">
        <PasswordField id="reset-password" label="New password" autoComplete="new-password" meter required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="12–72 characters" />
        <PasswordField id="reset-confirm" label="Confirm new password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
        <button type="submit" disabled={loading || !token} className="auth-submit">{loading ? <><Loader2 size={18} className="animate-spin" /> Updating…</> : <>Update password <ArrowUpRight size={18} /></>}</button>
      </form>
    </>);
}
export default function ResetPasswordPage() {
    return (<AuthShell eyebrow="ACCOUNT RECOVERY" title={<>A fresh start,<br /><em>securely.</em></>} intro="Set a new password for your YANTRA AI account. Every other signed-in device will be signed out.">
      <Suspense fallback={<p className="auth-fine">Loading…</p>}><ResetPasswordContent /></Suspense>
    </AuthShell>);
}
