'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, GraduationCap, ShieldCheck } from 'lucide-react';

export default function DemoAccess() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  async function enter(role: 'student' | 'admin') {
    setPending(role); setMessage('');
    try {
      const res = await fetch('/api/demo/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to sign in.');
      router.push(data.redirect); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to connect.'); }
    finally { setPending(null); }
  }
  return <div className="panel p-6 space-y-4">
    <p className="eyebrow">LOCAL DEMO ACCOUNTS</p>
    <p className="text-sm text-gray-400">Try both roles. Changes are saved in the separate local demo schema. These accounts cannot sign in through this shortcut in production.</p>
    <div className="flex flex-wrap gap-3">
      <button className="btn-primary" disabled={pending !== null} onClick={() => enter('student')}><GraduationCap size={18} />{pending === 'student' ? 'Signing in…' : 'Try student dashboard'}<ArrowUpRight size={17} /></button>
      <button className="btn-secondary" disabled={pending !== null} onClick={() => enter('admin')}><ShieldCheck size={18} />{pending === 'admin' ? 'Signing in…' : 'Try organizer dashboard'}<ArrowUpRight size={17} /></button>
    </div>
    {message && <p role="alert" className="text-sm text-red-300">{message}</p>}
  </div>;
}
