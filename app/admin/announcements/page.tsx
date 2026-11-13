"use client";

import React, { useState, useEffect } from "react";
import { Bell, Send, Trash2 } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED">("PUBLISHED");
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = () => {
    fetch("/api/admin/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        loadAnnouncements();
      }
    } catch {
      alert("Failed to publish announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          Create Hackathon Announcement
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Content *</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-background border border-surface-border text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-between">
            <select
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-white"
            >
              <option value="PUBLISHED">Publish Immediately</option>
              <option value="DRAFT">Save as Draft</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-black bg-cyan-400 hover:bg-cyan-300 text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Existing Announcements</h3>
        {announcements.map((a) => (
          <div key={a.id} className="p-4 rounded-xl bg-surface border border-surface-border flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{a.title}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-cyan-400 font-mono">
                  {a.status}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 whitespace-pre-line">{a.content}</p>
            </div>
            <button
              onClick={() => handleDelete(a.id)}
              className="p-1.5 text-gray-400 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
