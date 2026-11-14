import CountUp from "@/components/CountUp";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Users, UserCheck, ShieldAlert, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminOverviewPage() {
    if ((await getCurrentUser())?.role !== "ADMIN")
        redirect("/login");
    const [totalUsers, verifiedUsers, totalTeams, pendingSubmissions, approvedSubmissions, rejectedSubmissions, messagesCount, auditLogs,] = await Promise.all([
        db.user.count({ where: { role: "USER" } }),
        db.user.count({ where: { role: "USER", emailVerified: true } }),
        db.team.count(),
        db.registrationSubmission.count({ where: { status: "PENDING" } }),
        db.registrationSubmission.count({ where: { status: "APPROVED" } }),
        db.registrationSubmission.count({ where: { status: "REJECTED" } }),
        db.contactMessage.count({ where: { isRead: false } }),
        db.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { user: { select: { email: true } } },
        }),
    ]);
    const teams = await db.team.findMany({ select: { _count: { select: { members: true } } } });
    const sizes = teams.reduce<Record<number, number>>((acc, t) => { const n = t._count.members; acc[n] = (acc[n] || 0) + 1; return acc; }, {});
    const registrations = await db.registrationSubmission.findMany({ select: { submittedAt: true }, orderBy: { submittedAt: 'asc' } });
    const trends = registrations.reduce<Record<string, number>>((acc, r) => { const day = r.submittedAt.toISOString().slice(0, 10); acc[day] = (acc[day] || 0) + 1; return acc; }, {});
    const pendingMail = await db.emailOutbox.count({ where: { deliveredAt: null } });
    return (<div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>USERS</span>
            <Users className="w-4 h-4 text-orange-300"/>
          </div>
          <CountUp className="block text-3xl font-bold tracking-tight text-white mt-2" value={totalUsers} />
          <div className="text-[11px] text-gray-400 mt-1">{verifiedUsers} verified</div>
        </div>

        <div className="metric-card p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>TEAMS</span>
            <Users className="w-4 h-4 text-emerald-400"/>
          </div>
          <CountUp className="block text-3xl font-bold tracking-tight text-white mt-2" value={totalTeams} />
          <div className="text-[11px] text-gray-400 mt-1">formed teams</div>
        </div>

        <div className="metric-card p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>PENDING</span>
            <Clock className="w-4 h-4 text-amber-400"/>
          </div>
          <CountUp className="block text-3xl font-bold tracking-tight text-amber-300 mt-2" value={pendingSubmissions} />
          <div className="text-[11px] text-gray-400 mt-1">awaiting review</div>
        </div>

        <div className="metric-card p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>APPROVED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
          </div>
          <CountUp className="block text-3xl font-bold tracking-tight text-emerald-300 mt-2" value={approvedSubmissions} />
          <div className="text-[11px] text-gray-400 mt-1">{rejectedSubmissions} rejected</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5"><div className="panel p-6"><h2 className="text-lg font-bold mb-4">Team size distribution</h2>{Object.keys(sizes).length ? Object.entries(sizes).map(([size, count]) => <p className="text-sm text-gray-300 py-2" key={size}>{size} members <span className="float-right text-orange-200">{count} teams</span></p>) : <p className="text-gray-400 text-sm">No teams yet.</p>}</div><div className="panel p-6"><h2 className="text-lg font-bold mb-4">Registration trends (UTC)</h2>{Object.keys(trends).length ? Object.entries(trends).slice(-14).map(([date, count]) => <p className="text-sm text-gray-300 py-2" key={date}>{date}<span className="float-right text-orange-200">{count}</span></p>) : <p className="text-gray-400 text-sm">No submissions yet.</p>}</div></div>
      <p className="panel p-4 text-sm text-gray-400">Queued or failed email deliveries: {pendingMail}. Unread contact messages: {messagesCount}.</p>
      {/* Audit Log Stream */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Recent Security & Administrative Audit Logs
        </h3>
        <div className="divide-y divide-surface-border">
          {auditLogs.map((log) => (<div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-orange-300 font-semibold">{log.action}</span>
                <span className="text-gray-400">{log.entityType}</span>
                {log.user?.email && <span className="text-gray-500">by {log.user.email}</span>}
              </div>
              <span className="text-gray-500 font-mono">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>))}
        </div>
      </div>
    </div>);
}
