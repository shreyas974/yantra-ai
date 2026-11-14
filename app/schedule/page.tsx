import { getEventConfigMap } from "@/lib/event-config";
import { Calendar, Clock } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function SchedulePage() {
    const config = await getEventConfigMap();
    let schedule = [];
    try {
        schedule = JSON.parse(config["schedule"] || "[]");
    }
    catch {
        schedule = [];
    }
    return (<div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Event Schedule</h1>
        <p className="text-gray-400">Timeline and milestones for YANTRA AI participants.</p>
      </div>

      <div className="space-y-6 border-l border-violet-500/30 pl-5">
        {!schedule.length && <p className="panel p-6 text-gray-400">Official dates and milestones: To be announced.</p>}
        {schedule.map((item: any, idx: number) => (<div key={idx} className="flex gap-6 p-6 rounded-xl bg-surface border border-surface-border items-start">
            <div className="w-10 h-10 rounded-lg bg-violet-950/50 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-300"/>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-lg font-bold text-white">{item.phase}</h3>
                <span className="font-mono text-xs text-orange-300 font-semibold">{item.time}</span>
              </div>
              <p className="text-sm text-gray-400">{item.description}</p>
            </div>
          </div>))}
      </div>
    </div>);
}
