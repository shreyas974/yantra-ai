import { Cpu } from "lucide-react";

export default function ProblemStatementsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.2)]">
        <Cpu className="w-8 h-8 text-cyan-400" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
        Problem Statements
      </h1>

      <div className="p-8 rounded-2xl bg-surface/70 border border-violet-500/30 max-w-2xl mx-auto">
        <p className="text-2xl font-mono text-cyan-300 font-bold tracking-wide">
          “Problem statements will be announced soon. Stay tuned!”
        </p>
      </div>

      <p className="text-sm text-gray-400 max-w-lg mx-auto">
        All problem statements, challenge datasets, and scoring rubrics are held under strict embargo until the official kickoff milestone to ensure equal opportunity for every competing team.
      </p>
    </div>
  );
}
