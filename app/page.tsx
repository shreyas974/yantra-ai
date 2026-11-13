import Link from "next/link";
import { Cpu, Terminal, Users, Award, Shield, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { getEventConfigMap, getPublicStats } from "@/lib/event-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [config, stats] = await Promise.all([
    getEventConfigMap(),
    getPublicStats(),
  ]);

  const eventDates = config["event_dates"] || "To be announced.";
  const eventTimezone = config["event_timezone"] || "Asia/Kolkata";
  const eventVenue = config["event_venue"] || "To be announced.";
  const registrationOpen = config["registration_open"] === "true";

  let tracks = [];
  try {
    tracks = JSON.parse(config["tracks"] || "[]");
  } catch {
    tracks = [];
  }

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center space-y-8 pt-10 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Artificial Intelligence & Machine Learning Hackathon</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white">
            CHAD
          </h1>
          <p className="text-2xl sm:text-3xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 font-bold">
            “Code. Create. Conquer.”
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Unite with the next generation of AI engineers, researchers, and innovators.
            Tackle frontier challenges in neural architecture, vision systems, and generative intelligence.
          </p>
        </div>

        {/* Real Countdown */}
        <div className="flex justify-center pt-2">
          <CountdownTimer targetDateStr={eventDates} timezone={eventTimezone} />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5"
          >
            Register Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/problem-statements"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-gray-200 bg-surface hover:bg-surface-muted border border-surface-border transition-colors"
          >
            Problem Statements
          </Link>
        </div>

        {/* Key Event Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 text-sm">
          <div className="p-4 rounded-xl bg-surface/60 border border-surface-border flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Dates</span>
            <span className="text-white font-semibold mt-1">{eventDates}</span>
          </div>
          <div className="p-4 rounded-xl bg-surface/60 border border-surface-border flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Venue</span>
            <span className="text-white font-semibold mt-1">{eventVenue}</span>
          </div>
          <div className="p-4 rounded-xl bg-surface/60 border border-surface-border flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
            <span className={`font-semibold mt-1 ${registrationOpen ? "text-emerald-400" : "text-amber-400"}`}>
              {registrationOpen ? "Registrations Open" : "Registrations Opening Soon"}
            </span>
          </div>
        </div>
      </section>

      {/* Real Database Metrics Section */}
      <section className="border border-surface-border rounded-2xl bg-surface/40 backdrop-blur p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono">Live Ecosystem Metrics</h2>
          <p className="text-2xl font-bold text-white mt-1">Real-Time Participation</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-xl bg-surface/80 border border-surface-border">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              {stats.participants}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-2 font-mono">Verified Participants</div>
          </div>
          <div className="p-6 rounded-xl bg-surface/80 border border-surface-border">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {stats.teams}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-2 font-mono">Formed Teams</div>
          </div>
          <div className="p-6 rounded-xl bg-surface/80 border border-surface-border">
            <div className="text-4xl font-extrabold text-violet-400">
              {tracks.length}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-2 font-mono">AI/ML Tracks</div>
          </div>
          <div className="p-6 rounded-xl bg-surface/80 border border-surface-border">
            <div className="text-4xl font-extrabold text-emerald-400">
              1-4
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-2 font-mono">Team Size Limit</div>
          </div>
        </div>
      </section>

      {/* Tracks Preview */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-violet-400 font-mono">Focus Domains</h2>
            <p className="text-3xl font-extrabold text-white mt-1">Hackathon Innovation Tracks</p>
          </div>
          <Link href="/tracks" className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:underline">
            View All Tracks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map((track: any) => (
            <div
              key={track.id}
              className="group p-6 rounded-2xl bg-surface/60 border border-surface-border hover:border-violet-500/50 hover:bg-surface/90 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-950/50 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{track.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{track.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Statement Notice */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-violet-950/40 via-surface to-cyan-950/40 border border-violet-500/30 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Official Problem Statements</h3>
        <p className="text-cyan-300 font-mono text-base font-semibold">
          “Problem statements will be announced soon. Stay tuned!”
        </p>
        <p className="text-xs text-gray-400 max-w-xl mx-auto">
          Statements and evaluation criteria are released simultaneously to all registered teams to ensure fairness.
        </p>
      </section>
    </div>
  );
}
