import React from "react";
import { Cpu, Target, Sparkles, Shield, Rocket } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">About CHAD</h1>
        <p className="text-xl font-mono text-cyan-400">“Code. Create. Conquer.”</p>
        <p className="text-gray-400 max-w-2xl mx-auto">
          CHAD is an elite Artificial Intelligence and Machine Learning hackathon engineered to bring together visionary developers, researchers, and creators to build the next frontier of intelligent systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-3">
          <Target className="w-8 h-8 text-violet-400" />
          <h3 className="text-lg font-bold text-white">Code</h3>
          <p className="text-sm text-gray-400">
            Write high-performance algorithms, train and fine-tune state-of-the-art models, and build robust software pipelines.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-3">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Create</h3>
          <p className="text-sm text-gray-400">
            Transform theoretical research into deployed products that solve complex real-world problems.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-3">
          <Rocket className="w-8 h-8 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Conquer</h3>
          <p className="text-sm text-gray-400">
            Showcase technical excellence before industry leaders, mentors, and peers to claim championship honors.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-surface/50 border border-surface-border space-y-4">
        <h2 className="text-2xl font-bold text-white">Ethical AI & Open Innovation</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          CHAD champions responsible AI development. Participants are encouraged to evaluate transparency, algorithmic fairness, safety, and energy efficiency alongside raw model benchmark performance.
        </p>
      </div>
    </div>
  );
}
