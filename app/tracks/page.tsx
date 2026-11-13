import { getEventConfigMap } from "@/lib/event-config";
import { Cpu, Eye, MessageSquare, Activity, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const config = await getEventConfigMap();
  let tracks = [];
  try {
    tracks = JSON.parse(config["tracks"] || "[]");
  } catch {
    tracks = [];
  }

  const icons = [Cpu, Eye, MessageSquare, Activity, Globe];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Innovation Tracks</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Explore the focus tracks curated for the CHAD Hackathon. Choose the domain that matches your team’s passion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tracks.map((track: any, index: number) => {
          const IconComponent = icons[index % icons.length];
          return (
            <div key={track.id} className="p-8 rounded-2xl bg-surface border border-surface-border space-y-4 hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{track.title}</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{track.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
