"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, Send, ShieldCheck, ArrowRight } from "lucide-react";

export default function RegistrationSubmissionPage() {
  const [data, setData] = useState<{
    user: any;
    team: any;
    config: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg?: string }>({ type: "idle" });

  const loadData = async () => {
    try {
      const [profRes, teamRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/team"),
      ]);
      const profData = await profRes.json();
      const teamData = await teamRes.json();
      setData({
        user: profData.profile,
        team: teamData.team,
        config: {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitRegistration = async () => {
    if (!confirm("Submit team registration for official organizer review?")) return;
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const res = await fetch("/api/registration/submit", { method: "POST" });
      const resData = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: resData.error || "Failed to submit registration." });
      } else {
        setStatus({ type: "success", msg: resData.message });
        loadData();
      }
    } catch {
      setStatus({ type: "error", msg: "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Checking eligibility...</div>;
  }

  const team = data?.team;
  const isLeader = team?.leaderId;
  const submission = team?.submission;

  return (
    <div className="p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Registration Submission</h1>
        <p className="text-xs text-gray-400">
          Verify all prerequisite milestones before team submission. Submissions are processed atomically.
        </p>
      </div>

      {status.type === "success" && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{status.msg}</span>
        </div>
      )}

      {status.type === "error" && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{status.msg}</span>
        </div>
      )}

      {submission && (
        <div className="p-4 rounded-xl bg-surface-muted border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono uppercase">Submitted Registration</span>
            <span className="font-mono text-cyan-400 font-bold text-sm">{submission.registrationId}</span>
          </div>
          <div className="text-sm font-semibold text-white">
            Status: <span className="text-amber-400">{submission.status}</span>
          </div>
          {submission.rejectionReason && (
            <p className="text-xs text-red-300">Rejection note: {submission.rejectionReason}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider">Prerequisite Checklist</h3>

        <div className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between">
          <div className="text-xs text-gray-200">1. Email verification</div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between">
          <div className="text-xs text-gray-200">2. Profile completed & rules accepted</div>
          {data?.user ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Link href="/dashboard/profile" className="text-xs text-cyan-400 hover:underline">
              Complete now →
            </Link>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between">
          <div className="text-xs text-gray-200">3. Team formed (1 to 4 members)</div>
          {team ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Link href="/dashboard/team" className="text-xs text-cyan-400 hover:underline">
              Create/Join team →
            </Link>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-surface-border">
        <button
          onClick={handleSubmitRegistration}
          disabled={submitting || !team}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 text-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting Registration..." : "Submit Registration for Review"}
        </button>
        <p className="text-[11px] text-gray-400 mt-2">
          * Note: Registration submissions open officially once organizers configure deadlines and publish official rules.
        </p>
      </div>
    </div>
  );
}
