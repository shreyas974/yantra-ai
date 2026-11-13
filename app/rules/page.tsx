import { getEventConfigMap } from "@/lib/event-config";
import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const config = await getEventConfigMap();
  const rulesPublished = config["rules_published"] === "true";
  const rulesContent = config["rules_content"] || "To be announced.";

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Rules & Guidelines</h1>
        <p className="text-gray-400">Core principles, eligibility standards, and competition rules.</p>
      </div>

      {!rulesPublished ? (
        <div className="p-8 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Official Rules Pending Publication</h3>
          <p className="text-gray-300 text-sm">
            {rulesContent}
          </p>
          <p className="text-xs text-gray-400">
            Registration submissions will open once the official rules are published by organizers.
          </p>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-surface border border-surface-border text-gray-300 space-y-4">
          <p className="whitespace-pre-line">{rulesContent}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">General Eligibility & Fair Play</h2>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Teams may consist of 1 to 4 participants. Solo participation is permitted.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>All participants must verify their individual email address and complete their profile before team submission.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Projects must be built during the official hackathon hacking window. Pre-built entire applications are prohibited.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Plagiarism, harassing conduct, or disruptive activities will result in immediate disqualification.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
