'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import BrandMark from './BrandMark';
import { BRAND } from '@/lib/brand';

const links = [
  ['/', 'Home'], ['/about', 'About'], ['/tracks', 'Tracks'], ['/schedule', 'Schedule'],
  ['/prizes', 'Awards'], ['/rules', 'Rules'], ['/faq', 'FAQ'], ['/contact', 'Contact'],
] as const;
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const workspace = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  useEffect(() => {
    setOpen(false);
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal }).then(r => r.ok ? r.json() : null)
      .then(data => setUser(data?.user || null)).catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);
  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      setUser(null); router.push('/login'); router.refresh();
    } catch { window.alert('Sign-out could not complete. Please try again.'); }
    finally { setLoggingOut(false); }
  }
  const actions = <>{user ? <>
    <Link className="nav-signin" href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}>{user.role === 'ADMIN' ? 'Organizer console' : 'My dashboard'} <ArrowUpRight size={15} /></Link>
    <button onClick={logout} disabled={loggingOut} className="nav-icon" aria-label="Sign out"><LogOut size={17} /></button>
  </> : <><Link href="/login" className="nav-signin">Sign in</Link><Link className="nav-register" href="/register">Join the hackathon <ArrowUpRight size={16} /></Link></>}</>;
  return <header className={`site-header ${workspace ? 'header-dark' : 'header-light'}`}>
    <div className="nav-container">
      <Link href="/" className="brand-lockup" aria-label={`${BRAND.name} home`}><BrandMark /><span className="brand-type">YANTRA<span className="brand-ai">AI</span><small>HUMAN IDEAS. MACHINE INTELLIGENCE.</small></span></Link>
      <nav aria-label="Main navigation" className="desktop-links">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="desktop-actions">{actions}</div>
      <button className="mobile-toggle" ref={trigger} onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}<div className="mobile-actions">{actions}</div><Link href="/guest">Guest, student & organizer access <ArrowUpRight size={16} /></Link></nav>}
  </header>;
}
