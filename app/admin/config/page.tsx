"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2 } from "lucide-react";

export default function AdminConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => setConfig(data.configs || {}))
      .finally(() => setLoading(false));
  }, []);

  const updateKey = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 2000);
      }
    } catch {
      alert("Failed to update");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading configurations...</div>;
  }

  const fields = [
    { key: "registration_open", label: "Registration Submissions Open (true/false)", type: "select", options: ["false", "true"] },
    { key: "rules_published", label: "Official Rules Published (true/false)", type: "select", options: ["false", "true"] },
    { key: "event_dates", label: "Event Dates Display (e.g. 2026-12-05T09:00:00Z or text)", type: "text" },
    { key: "event_timezone", label: "Event Timezone", type: "text" },
    { key: "event_venue", label: "Event Venue", type: "text" },
    { key: "registration_deadline", label: "Registration Deadline", type: "text" },
    { key: "min_team_size", label: "Minimum Team Size", type: "text" },
    { key: "max_team_size", label: "Maximum Team Size", type: "text" },
    { key: "prizes", label: "Prizes Information", type: "textarea" },
    { key: "rules_content", label: "Rules Content (Markdown / Text)", type: "textarea" },
  ];

  return (
    <div className="p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Event Configuration</h2>
        <p className="text-xs text-gray-400">
          Modify event dates, rules publication, registration open/closed states, and team size limits.
        </p>
      </div>

      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300">{f.label}</label>
              {savedKey === f.key && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            {f.type === "select" ? (
              <select
                value={config[f.key] || "false"}
                onChange={(e) => updateKey(f.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none"
              >
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                rows={4}
                value={config[f.key] || ""}
                onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                onBlur={(e) => updateKey(f.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none font-mono"
              ></textarea>
            ) : (
              <input
                type="text"
                value={config[f.key] || ""}
                onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                onBlur={(e) => updateKey(f.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
