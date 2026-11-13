"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // Honeypot
  });
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg?: string }>({
    type: "idle",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", msg: data.error || "Failed to send message." });
      } else {
        setStatus({ type: "success", msg: data.message });
        setFormData({ name: "", email: "", subject: "", message: "", website: "" });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Contact Organizers</h1>
        <p className="text-gray-400">Have questions about tracks, requirements, or sponsorship? Reach out to us.</p>
      </div>

      <div className="p-8 rounded-2xl bg-surface border border-surface-border">
        {status.type === "success" ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Message Delivered</h3>
            <p className="text-gray-300 text-sm">{status.msg}</p>
            <button
              onClick={() => setStatus({ type: "idle" })}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-surface-muted border border-surface-border text-gray-200"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status.type === "error" && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{status.msg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Honeypot field (hidden from view) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Message *</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-cyan-400 focus:outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {status.type === "loading" ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
