import React from "react";
import Link from "next/link";
import { Cpu, Terminal, Shield, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/50 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-base text-white tracking-wider">CHAD</span>
            </div>
            <p className="text-gray-400">
              The premier Artificial Intelligence & Machine Learning hackathon.
            </p>
            <p className="font-mono text-cyan-400 font-semibold tracking-wide">
              “Code. Create. Conquer.”
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-cyan-400 transition-colors">About CHAD</Link></li>
              <li><Link href="/tracks" className="hover:text-cyan-400 transition-colors">Innovation Tracks</Link></li>
              <li><Link href="/schedule" className="hover:text-cyan-400 transition-colors">Schedule & Phases</Link></li>
              <li><Link href="/prizes" className="hover:text-cyan-400 transition-colors">Prizes & Awards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/rules" className="hover:text-cyan-400 transition-colors">Competition Rules</Link></li>
              <li><Link href="/faq" className="hover:text-cyan-400 transition-colors">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact Organizers</Link></li>
              <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Problem Statements</h4>
            <p className="text-gray-400 mb-2">
              Official challenge statements are governed by the hackathon committee.
            </p>
            <p className="font-mono text-violet-300 text-[11px]">
              “Problem statements will be announced soon. Stay tuned!”
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CHAD Hackathon Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-cyan-400">Privacy Policy</Link>
            <Link href="/rules" className="hover:text-cyan-400">Rules & Code of Conduct</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
