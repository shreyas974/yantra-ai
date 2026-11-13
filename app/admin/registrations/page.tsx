"use client";

import React, { useState, useEffect } from "react";
import { Download, CheckCircle, XCircle, Search, Clock, FileSpreadsheet } from "lucide-react";

export default function AdminRegistrationsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const loadSubmissions = () => {
    setLoading(true);
    const url = `/api/admin/registrations?status=${filter === "ALL" ? "" : filter}&q=${encodeURIComponent(query)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const handleAction = async (submissionId: string, status: "APPROVED" | "REJECTED") => {
    let rejectionReason: string | null = null;
    if (status === "REJECTED") {
      rejectionReason = prompt("Enter rejection reason for participant review:");
      if (!rejectionReason) return;
    } else {
      if (!confirm("Confirm approval of this team's registration?")) return;
    }

    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, status, rejectionReason }),
      });
      if (res.ok) {
        loadSubmissions();
      } else {
        const d = await res.json();
        alert(d.error || "Action failed");
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Registration Submissions</h2>
          <p className="text-xs text-gray-400">Review, approve, and export submitted team rosters.</p>
        </div>

        <div className="flex gap-2">
          <a
            href="/api/admin/export?type=participants"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-gray-200 hover:text-white"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Participants CSV
          </a>
          <a
            href="/api/admin/export?type=teams"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-gray-200 hover:text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export Teams CSV
          </a>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg bg-surface border border-surface-border p-1 text-xs">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === st ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSubmissions();
          }}
          className="flex-1 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Registration ID, Team Name, or Email"
            className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-gray-300 hover:text-white"
          >
            Search
          </button>
        </form>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading registrations...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 p-8 rounded-2xl bg-surface border border-surface-border">
          No registration submissions matching filter.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-xl bg-surface border border-surface-border space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {sub.registrationId}
                  </span>
                  <span className="text-white font-bold text-base">{sub.team.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      sub.status === "APPROVED"
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                        : sub.status === "REJECTED"
                        ? "bg-red-950/60 text-red-300 border border-red-500/30"
                        : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {sub.status !== "APPROVED" && (
                    <button
                      onClick={() => handleAction(sub.id, "APPROVED")}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Approve
                    </button>
                  )}
                  {sub.status !== "REJECTED" && (
                    <button
                      onClick={() => handleAction(sub.id, "REJECTED")}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="pt-2 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {sub.team.members.map((m: any) => (
                  <div key={m.id} className="p-2 rounded bg-surface-muted border border-surface-border">
                    <div className="font-semibold text-white truncate">
                      {m.user.profile?.fullName || m.user.email}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{m.user.profile?.collegeOrg || "No Org"}</div>
                    <div className="text-[10px] text-cyan-400 font-mono truncate">{m.user.profile?.skills || "N/A"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
