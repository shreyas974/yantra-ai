import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Shield, Users, Settings, Bell, Mail, Cpu, LayoutDashboard, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-violet-950/30 border border-violet-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-900/50 border border-violet-500/40">
            <Shield className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">CHAD Administrator Console</h1>
            <p className="text-xs text-violet-300 font-mono">Logged in as {user.email} (Persisted Admin Role)</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Participant Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-2">
          <nav className="p-2 rounded-xl bg-surface border border-surface-border space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              Metrics & Overview
            </Link>
            <Link
              href="/admin/registrations"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Registrations & Review
            </Link>
            <Link
              href="/admin/config"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              Event Configuration
            </Link>
            <Link
              href="/admin/announcements"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Bell className="w-4 h-4 text-pink-400" />
              Announcements
            </Link>
            <Link
              href="/admin/messages"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              Contact Inquiries
            </Link>
            <Link
              href="/admin/problem-statements"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-muted transition-colors"
            >
              <Cpu className="w-4 h-4 text-teal-400" />
              Problem Statements
            </Link>
          </nav>
        </aside>

        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
