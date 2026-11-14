'use client';
import { useEffect, useState } from 'react';

export default function Page() {
    const [password, setPassword] = useState('');
    const [verificationPassword, setVerificationPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [firebaseMode, setFirebaseMode] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => setFirebaseMode(d.authMode === 'firebase'));
    }, []);

    async function remove(e: React.FormEvent) {
        e.preventDefault();
        if (!confirm('Permanently delete your YANTRA AI account and profile?')) return;
        setBusy(true);
        try {
            const response = await fetch('/api/account', {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, confirm: confirmation }),
            });
            const data = await response.json();
            if (response.ok) window.location.assign('/');
            else setMessage(data.error);
        } catch { setMessage('Connection failed. Please try again.'); }
        finally { setBusy(false); }
    }

    async function resend(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: verificationPassword }),
            });
            const data = await response.json();
            setMessage(response.ok ? 'Verification email requested. Open its link, then return to your dashboard.' : data.error);
            setVerificationPassword('');
        } catch { setMessage('Connection failed. Please try again.'); }
        finally { setBusy(false); }
    }

    return <div className="space-y-6">
        <h1 className="text-3xl font-bold">Account settings</h1>
        <p role="status">{message}</p>
        <form onSubmit={resend} className="panel p-6 space-y-4">
            <h2 className="text-xl">Email verification</h2>
            {firebaseMode && <label className="field">Current password<input type="password" required autoComplete="current-password" value={verificationPassword} onChange={e => setVerificationPassword(e.target.value)} /></label>}
            <button disabled={busy} className="btn-secondary">Resend verification email</button>
            <p><a href="/forgot-password" className="text-orange-200 underline">Reset your password</a></p>
        </form>
        <form onSubmit={remove} className="panel p-6 space-y-4">
            <h2 className="text-xl text-red-300">Delete account</h2>
            <p className="text-gray-400 text-sm">Leave your team first. Deletion removes your profile, sessions and notifications. Organizer audit history is retained without your account reference.</p>
            <label className="field">Current password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
            <label className="field">Type DELETE to confirm<input required pattern="DELETE" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
            <button disabled={busy} className="btn-secondary text-red-300">Permanently delete account</button>
        </form>
    </div>;
}
