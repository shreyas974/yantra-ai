import { prisma } from "@/lib/db";
import { Users, UserCheck, ShieldAlert, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    verifiedUsers,
    totalTeams,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    messagesCount,
    auditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.team.count(),
    prisma.registrationSubmission.count({ where: { status: "PENDING" } }),
    prisma.registrationSubmission.count({ where: { status: "APPROVED" } }),
    prisma.registrationSubmission.count({ where: { status: "REJECTED" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>USERS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">{verifiedUsers} verified</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>TEAMS</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalTeams}</div>
          <div className="text-[11px] text-gray-400 mt-1">formed teams</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>PENDING</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-2">{pendingSubmissions}</div>
          <div className="text-[11px] text-gray-400 mt-1">awaiting review</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>APPROVED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">{approvedSubmissions}</div>
          <div className="text-[11px] text-gray-400 mt-1">{rejectedSubmissions} rejected</div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Recent Security & Administrative Audit Logs
        </h3>
        <div className="divide-y divide-surface-border">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 font-semibold">{log.action}</span>
                <span className="text-gray-400">{log.entityType}</span>
                {log.user?.email && <span className="text-gray-500">by {log.user.email}</span>}
              </div>
              <span className="text-gray-500 font-mono">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
