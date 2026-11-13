import { prisma } from "@/lib/db";
import { Cpu, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProblemStatementsPage() {
  const statements = await prisma.problemStatement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Problem Statement Management Infrastructure</h2>
        <p className="text-xs text-gray-400">
          Curate, review, and schedule official hackathon challenge statements and dataset links.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs text-violet-300 space-y-1">
        <p className="font-semibold">Critical Content Rule Active:</p>
        <p>Problem statement storage begins strictly empty until official challenges are formulated by the organizing jury.</p>
      </div>

      {statements.length === 0 ? (
        <div className="text-center py-12 p-8 rounded-2xl bg-surface border border-surface-border space-y-2">
          <Cpu className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-300">Storage is currently empty.</h3>
          <p className="text-xs text-cyan-400 font-mono">
            “Problem statements will be announced soon. Stay tuned!”
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {statements.map((s) => (
            <div key={s.id} className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{s.title}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-muted text-cyan-400 font-mono">
                  {s.track}
                </span>
              </div>
              <p className="text-xs text-gray-300">{s.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
