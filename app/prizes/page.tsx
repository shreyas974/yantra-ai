import { getEventConfigMap } from "@/lib/event-config";
import { Trophy, Award, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrizesPage() {
  const config = await getEventConfigMap();
  const prizesText = config["prizes"] || "To be announced.";

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Prizes & Recognitions</h1>
        <p className="text-gray-400">Rewarding groundbreaking innovation in Artificial Intelligence.</p>
      </div>

      <div className="p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Prize Pool & Track Awards</h2>
        <p className="text-cyan-400 font-mono text-lg font-semibold">
          {prizesText === "To be announced." ? "To be announced." : prizesText}
        </p>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Official prize structures, sponsor bounties, and certificate criteria will be published by the organizing committee.
        </p>
      </div>
    </div>
  );
}
