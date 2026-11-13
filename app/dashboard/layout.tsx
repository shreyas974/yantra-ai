import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { User, Users, FileCheck2, LayoutDashboard, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner if email unverified */}
      {!user.emailVerified && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Your email (<strong>{user.email}</strong>) is not verified. Please verify your email via the link in <code>work/mail/</code> to unlock team creation and submission.
            </span>
          </div>
          <Link
            href="/verify-email"
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-bold shrink-0 hover:bg-amber-300 transition-colors"
          >
            Enter Token
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="md:col-span-1 space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">Participant</div>
            <div className="text-sm font-bold text-white truncate">{user.email}</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted border border-surface-border">
              {user.emailVerified ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
          </div>

          <nav className="p-2 rounded-xl bg-surface border border-surface-border space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              Overview
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <User className="w-4 h-4 text-violet-400" />
              Profile
            </Link>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Team & Invites
            </Link>
            <Link
              href="/dashboard/registration"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Registration
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-violet-300 bg-violet-950/30 border border-violet-500/20 hover:bg-violet-900/40 transition-colors mt-4"
              >
                <Shield className="w-4 h-4 text-violet-400" />
                Admin Panel
              </Link>
            )}
          </nav>
        </aside>

        {/* Content area */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
