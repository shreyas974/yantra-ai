"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Cpu, User, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Quick client check for auth state
    fetch("/api/profile")
      .then((res) => {
        if (res.ok) {
          fetch("/api/admin/metrics").then((adminRes) => {
            setUser({ email: "user", role: adminRes.ok ? "ADMIN" : "USER" });
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/tracks", label: "Tracks" },
    { href: "/schedule", label: "Schedule" },
    { href: "/prizes", label: "Prizes" },
    { href: "/rules", label: "Rules" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 via-cyan-500 to-emerald-400 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-[#0a0a12] rounded-[7px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400">
              CHAD
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              Code. Create. Conquer.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
                pathname === link.href ? "text-cyan-400 border-b-2 border-cyan-400 pb-0.5" : "text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth / Action */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-950/30 text-violet-300 text-xs font-medium hover:bg-violet-900/50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-surface-border text-xs font-medium text-gray-200 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-surface transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-surface"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-surface-border bg-background/95 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2 rounded-lg bg-surface text-sm font-medium text-gray-200"
            >
              Dashboard
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-bold text-sm"
            >
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
