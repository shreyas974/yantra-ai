"use client";

import React, { useEffect, useState } from "react";

interface CountdownProps {
  targetDateStr?: string;
  timezone?: string;
}

export default function CountdownTimer({ targetDateStr = "To be announced.", timezone = "Asia/Kolkata" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (!targetDateStr || targetDateStr === "To be announced." || isNaN(Date.parse(targetDateStr))) {
      setIsConfigured(false);
      return;
    }

    setIsConfigured(true);
    const target = new Date(targetDateStr).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (!isConfigured) {
    return (
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-violet-500/30 bg-violet-950/20 text-violet-300 font-mono text-sm shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>Event Countdown: Dates <strong>To be announced.</strong></span>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-3 font-mono">
      {[
        { label: "DAYS", val: timeLeft.days },
        { label: "HOURS", val: timeLeft.hours },
        { label: "MINS", val: timeLeft.minutes },
        { label: "SECS", val: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center p-3 rounded-lg bg-surface/80 border border-violet-500/20 min-w-[70px]">
          <span className="text-2xl font-bold text-cyan-400">{String(item.val).padStart(2, "0")}</span>
          <span className="text-[10px] text-gray-400 tracking-wider">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
