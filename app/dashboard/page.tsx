import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEventConfigMap } from "@/lib/event-config";
import { prisma } from "@/lib/db";
import { CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const config = await getEventConfigMap();
  const announcements = await prisma.announcement.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const team = user.teamMembership?.team;
  const submission = team?.submission;

  return (
    <div className="space-y-6">
      {/* Registration Status Banner */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-mono">Registration Status</div>
            <div className="flex items-center gap-2 mt-1">
              {!submission ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
                  <AlertCircle className="w-3.5 h-3.5" /> NOT SUBMITTED
                </span>
              ) : submission.status === "PENDING" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" /> PENDING ORGANIZER REVIEW
                </span>
              ) : submission.status === "APPROVED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> REGISTRATION APPROVED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/40 text-red-300 border border-red-500/30">
                  <XCircle className="w-3.5 h-3.5" /> REJECTED
                </span>
              )}

              {submission && (
                <span className="font-mono text-xs text-cyan-400 font-bold ml-2">
                  ID: {submission.registrationId}
                </span>
              )}
            </div>
            {submission?.rejectionReason && (
              <p className="text-xs text-red-300 mt-2">
                Reason: {submission.rejectionReason}
              </p>
            )}
          </div>

          <Link
            href="/dashboard/registration"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            Review Registration <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
          <div className="text-xs text-gray-400 uppercase font-mono">1. Email Verification</div>
          <div className="text-sm font-semibold flex items-center gap-2">
            {user.emailVerified ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Action Required
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Essential to join or lead teams.</p>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
          <div className="text-xs text-gray-400 uppercase font-mono">2. Profile Setup</div>
          <div className="text-sm font-semibold flex items-center gap-2">
            {user.profile ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Not Completed
              </span>
            )}
          </div>
          <Link href="/dashboard/profile" className="text-xs text-cyan-400 hover:underline block">
            Edit profile →
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
          <div className="text-xs text-gray-400 uppercase font-mono">3. Team Roster</div>
          <div className="text-sm font-semibold flex items-center gap-2">
            {team ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {team.name} ({team.members.length} members)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> No Team
              </span>
            )}
          </div>
          <Link href="/dashboard/team" className="text-xs text-cyan-400 hover:underline block">
            Manage team →
          </Link>
        </div>
      </div>

      {/* Announcements */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Official Hackathon Announcements
        </h3>
        {announcements.length === 0 ? (
          <p className="text-xs text-gray-400">No announcements published yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{a.title}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
