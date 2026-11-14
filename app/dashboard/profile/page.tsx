"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";
export default function ProfilePage() {
    const [formData, setFormData] = useState({
        fullName: "",
        collegeOrg: "",
        cityState: "",
        skills: "",
        aiExperience: "",
        phone: "",
        department: "",
        studyYear: "",
        githubUrl: "",
        linkedinUrl: "",
        portfolioUrl: "",
        privacyConsent: false,
        rulesAccepted: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{
        type: "idle" | "success" | "error";
        msg?: string;
    }>({ type: "idle" });
    useEffect(() => {
        fetch("/api/profile")
            .then((res) => res.json())
            .then((data) => {
            if (data.profile) {
                setFormData({
                    fullName: data.profile.fullName || "",
                    collegeOrg: data.profile.collegeOrg || "",
                    cityState: data.profile.cityState || "",
                    skills: data.profile.skills || "",
                    aiExperience: data.profile.aiExperience || "",
                    phone: data.profile.phone || "",
                    department: data.profile.department || "",
                    studyYear: data.profile.studyYear || "",
                    githubUrl: data.profile.githubUrl || "",
                    linkedinUrl: data.profile.linkedinUrl || "",
                    portfolioUrl: data.profile.portfolioUrl || "",
                    privacyConsent: !!data.profile.privacyConsent,
                    rulesAccepted: !!data.profile.rulesAccepted,
                });
            }
        })
            .finally(() => setLoading(false));
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: "idle" });
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setStatus({ type: "error", msg: data.error || "Failed to save profile." });
            }
            else {
                setStatus({ type: "success", msg: "Profile saved successfully." });
            }
        }
        catch {
            setStatus({ type: "error", msg: "Network error occurred." });
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return <div className="text-center py-12 text-gray-400">Loading profile data...</div>;
    }
    return (<div className="p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Participant Profile</h1>
        <p className="text-xs text-gray-400">Complete all required fields to qualify for registration submission.</p>
      </div>

      {status.type === "success" && (<div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0"/>
          <span>{status.msg}</span>
        </div>)}

      {status.type === "error" && (<div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0"/>
          <span>{status.msg}</span>
        </div>)}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="field-1" className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
            <input id="field-1" type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
          <div>
            <label htmlFor="field-2" className="block text-xs font-medium text-gray-300 mb-1">College or Organization *</label>
            <input id="field-2" type="text" required value={formData.collegeOrg} onChange={(e) => setFormData({ ...formData, collegeOrg: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="field-3" className="block text-xs font-medium text-gray-300 mb-1">City and State *</label>
            <input id="field-3" type="text" required value={formData.cityState} onChange={(e) => setFormData({ ...formData, cityState: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
          <div>
            <label htmlFor="field-4" className="block text-xs font-medium text-gray-300 mb-1">Technical Skills *</label>
            <input id="field-4" type="text" required value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="e.g. PyTorch, Next.js, Transformers, OpenCV" className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
        </div>

        <div>
          <label htmlFor="field-5" className="block text-xs font-medium text-gray-300 mb-1">AI/ML Experience & Interests *</label>
          <textarea id="field-5" required rows={3} value={formData.aiExperience} onChange={(e) => setFormData({ ...formData, aiExperience: e.target.value })} placeholder="Briefly describe your background in machine learning, projects built, or research areas..." className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none resize-none"></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-6" className="block text-xs font-medium text-gray-300 mb-1">Phone (Optional)</label>
            <input id="field-6" type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
          <div>
            <label htmlFor="field-7" className="block text-xs font-medium text-gray-300 mb-1">Department (Optional)</label>
            <input id="field-7" type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
          <div>
            <label htmlFor="field-8" className="block text-xs font-medium text-gray-300 mb-1">Study Year (Optional)</label>
            <input id="field-8" type="text" value={formData.studyYear} onChange={(e) => setFormData({ ...formData, studyYear: e.target.value })} placeholder="e.g. 3rd Year" className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-9" className="block text-xs font-medium text-gray-300 mb-1">GitHub URL</label>
            <input id="field-9" type="url" value={formData.githubUrl} onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none" placeholder="https://github.com/..."/>
          </div>
          <div>
            <label htmlFor="field-10" className="block text-xs font-medium text-gray-300 mb-1">LinkedIn URL</label>
            <input id="field-10" type="url" value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none" placeholder="https://linkedin.com/in/..."/>
          </div>
          <div>
            <label htmlFor="field-11" className="block text-xs font-medium text-gray-300 mb-1">Portfolio URL</label>
            <input id="field-11" type="url" value={formData.portfolioUrl} onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-surface-border text-white text-sm focus:border-orange-300 focus:outline-none" placeholder="https://..."/>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={formData.privacyConsent} onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })} className="mt-1 w-4 h-4 rounded border-gray-700 bg-background text-orange-300 focus:ring-cyan-400"/>
            <span className="text-xs text-gray-300">
              I consent to the processing of my participant information under the{" "}
              <a href="/privacy" target="_blank" className="text-orange-300 underline">Privacy Policy</a>. *
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.rulesAccepted} onChange={(e) => setFormData({ ...formData, rulesAccepted: e.target.checked })} className="mt-1 w-4 h-4 rounded border-gray-700 bg-background text-orange-300 focus:ring-cyan-400"/>
            <span className="text-xs text-gray-300">
              I accept the current published hackathon rules. Leave unchecked until official rules are published; required before registration submission.
            </span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-black bg-orange-300 hover:bg-orange-200 text-sm disabled:opacity-50">
          <Save className="w-4 h-4"/>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>);
}
