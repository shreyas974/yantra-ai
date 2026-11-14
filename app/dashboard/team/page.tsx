"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, UserPlus, LogOut, Shield, Trash2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
function TeamContent() {
    const searchParams = useSearchParams();
    const joinTokenParam = searchParams.get("joinToken") || "";
    const [teamData, setTeamData] = useState<{
        team: any;
        role: string | null;
        maxTeamSize?: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [teamName, setTeamName] = useState("");
    const [isSolo, setIsSolo] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [joinToken, setJoinToken] = useState(joinTokenParam);
    const [inviteLink, setInviteLink] = useState("");
    const [status, setStatus] = useState<{
        type: "idle" | "success" | "error";
        msg?: string;
    }>({ type: "idle" });
    const loadTeam = () => {
        fetch("/api/team")
            .then((res) => res.json())
            .then((data) => setTeamData(data))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        loadTeam();
    }, []);
    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "idle" });
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: teamName, isSolo }),
            });
            const data = await res.json();
            if (!res.ok) {
                setStatus({ type: "error", msg: data.error || "Failed to create team." });
            }
            else {
                setStatus({ type: "success", msg: "Team created successfully!" });
                loadTeam();
            }
        }
        catch {
            setStatus({ type: "error", msg: "Network error." });
        }
    };
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "idle" });
        try {
            const res = await fetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                setStatus({ type: "error", msg: data.error || "Failed to create invitation." });
            }
            else {
                setStatus({ type: "success", msg: data.message });
                setInviteLink(data.inviteUrl || "");
                setInviteEmail("");
                loadTeam();
            }
        }
        catch {
            setStatus({ type: "error", msg: "Network error." });
        }
    };
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "idle" });
        try {
            const res = await fetch("/api/team/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: joinToken }),
            });
            const data = await res.json();
            if (!res.ok) {
                setStatus({ type: "error", msg: data.error || "Failed to join team." });
            }
            else {
                setStatus({ type: "success", msg: data.message });
                setJoinToken("");
                loadTeam();
            }
        }
        catch {
            setStatus({ type: "error", msg: "Network error." });
        }
    };
    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this team?"))
            return;
        setStatus({ type: "idle" });
        try {
            const res = await fetch("/api/team/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
            const data = await res.json();
            if (!res.ok) {
                setStatus({ type: "error", msg: data.error || "Failed to leave team." });
            }
            else {
                setStatus({ type: "success", msg: data.message });
                loadTeam();
            }
        }
        catch {
            setStatus({ type: "error", msg: "Network error." });
        }
    };
    const handleKick = async (targetUserId: string) => {
        if (!confirm("Remove this member from the team?"))
            return;
        try {
            const res = await fetch("/api/team/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "kick", targetUserId }),
            });
            const data = await res.json();
            if (!res.ok)
                alert(data.error);
            else
                loadTeam();
        }
        catch {
            alert("Network error");
        }
    };
    const manage = async (action: string, targetUserId?: string) => {
        const name = action === 'rename' ? prompt('New team name', teamData?.team?.name) : undefined;
        if (action === 'rename' && !name)
            return;
        if (action === 'transfer_leader' && !confirm('Transfer leadership to this member?'))
            return;
        try {
            const r = await fetch('/api/team/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, targetUserId, name }) });
            const d = await r.json();
            setStatus({ type: r.ok ? 'success' : 'error', msg: r.ok ? 'Team updated.' : d.error });
            if (r.ok)
                loadTeam();
        }
        catch {
            setStatus({ type: 'error', msg: 'Unable to update team.' });
        }
    };
    if (loading) {
        return <div className="text-center py-12 text-gray-400">Loading team status...</div>;
    }
    const team = teamData?.team;
    const isLeader = teamData?.role === "LEADER";
    return (<div className="space-y-6">
      {status.type === "success" && (<div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0"/>
          <span>{status.msg}</span>
        </div>)}

      {status.type === "error" && (<div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0"/>
          <span>{status.msg}</span>
        </div>)}

      {!team ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team Form */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-300"/>
              Create a Team
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label htmlFor="field-1" className="block text-xs font-medium text-gray-300 mb-1">Team Name *</label>
                <input id="field-1" type="text" required value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. NeuralVoyagers" className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input type="checkbox" checked={isSolo} onChange={(e) => setIsSolo(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-background text-orange-300 focus:ring-cyan-400"/>
                <span>Solo Participation (1-member team)</span>
              </label>

              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-black bg-orange-300 hover:bg-orange-200 text-sm">
                Create Team
              </button>
            </form>
          </div>

          {/* Join Team Form */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-300"/>
              Join Existing Team
            </h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label htmlFor="field-2" className="block text-xs font-medium text-gray-300 mb-1">Invitation Token *</label>
                <input id="field-2" type="text" required value={joinToken} onChange={(e) => setJoinToken(e.target.value)} placeholder="Paste invite token from team leader" className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-violet-400 focus:outline-none"/>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-500 text-sm">
                Join Team
              </button>
            </form>
          </div>
        </div>) : (<div className="space-y-6">
          {/* Team Info Card */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase font-mono">Team Name</div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {team.name}
                  {team.isSolo && (<span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-orange-200">
                      Solo
                    </span>)}
                </h2>
              </div>
              <button onClick={handleLeave} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-950/30 text-xs font-semibold">
                <LogOut className="w-3.5 h-3.5"/>
                Leave Team
              </button>
            </div>

            {isLeader && <button className="btn-secondary" onClick={() => manage('rename')}>Rename team</button>}
            {team.submission && <p className="text-amber-300 text-sm">Registration status: {team.submission.status}. Pending and approved rosters are locked.</p>}
            {/* Members table */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
                Roster ({team.members.length} / {teamData?.maxTeamSize || 4})
              </h3>
              <div className="space-y-2">
                {team.members.map((m: any) => (<div key={m.id} className="p-3 rounded-xl bg-surface-muted border border-surface-border flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {m.user.profile?.fullName || m.user.email}
                        {m.role === "LEADER" && (<span className="text-[10px] px-2 py-0.5 rounded bg-violet-950/60 border border-violet-500/40 text-emerald-200 font-mono">
                            LEADER
                          </span>)}
                      </div>
                      <div className="text-xs text-gray-400">{m.user.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-orange-300">
                        {m.user.profile?.skills || "Profile pending"}
                      </span>
                      {isLeader && m.role !== "LEADER" && <button className="text-xs text-orange-200" onClick={() => manage('transfer_leader', m.userId)}>Make leader</button>}
                      {isLeader && m.role !== "LEADER" && (<button onClick={() => handleKick(m.userId)} className="p-1.5 text-gray-400 hover:text-red-400" title="Remove member">
                          <Trash2 className="w-4 h-4"/>
                        </button>)}
                    </div>
                  </div>))}
              </div>
            </div>
          </div>

          {/* Leader Invite Management */}
          {isLeader && team.members.length < (teamData?.maxTeamSize || 4) && !team.isSolo && (<div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-300"/>
                Invite Teammates
              </h3>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Teammate's verified email address" aria-label="Invited participant email" className="min-w-0 flex-1 px-3.5 py-2 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
                <button type="submit" className="px-5 py-2 rounded-lg font-bold text-black bg-orange-300 hover:bg-orange-200 text-xs shrink-0">
                  Generate Invite
                </button>
              </form>

              {inviteLink && (<div className="p-3 rounded-lg bg-surface-muted border border-surface-border flex items-center justify-between gap-2 text-xs text-orange-200 font-mono">
                  <span className="truncate">{inviteLink}</span>
                  <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="p-1 hover:text-white" title="Copy invite link">
                    <Copy className="w-4 h-4"/>
                  </button>
                </div>)}
            </div>)}
        </div>)}
    </div>);
}
export default function TeamPage() {
    return (<Suspense fallback={<div className="text-center py-12 text-gray-400">Loading team...</div>}>
      <TeamContent />
    </Suspense>);
}
