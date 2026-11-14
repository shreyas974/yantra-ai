'use client';
import { useEffect, useState } from 'react';
import CountUp from './CountUp';
export type Participation = { participants: number; teams: number } | null;
export default function LiveParticipation({ initial }: { initial: Participation }) {
  const [stats, setStats] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/event/status', { signal: controller.signal });
        if (!response.ok) { setStats(null); return; }
        const data = await response.json();
        setStats(data.stats);
      } catch { if (!controller.signal.aborted) setStats(null); }
    };
    const interval = setInterval(refresh, 60000);
    return () => { clearInterval(interval); controller.abort(); };
  }, []);
  return <><div className="participation-cell">{stats ? <CountUp className="stat-number" value={stats.participants} /> : <span className="stat-number">—</span>}<span>{stats ? 'Verified participants' : 'Live count unavailable'}</span></div><div className="participation-cell">{stats ? <CountUp className="stat-number" value={stats.teams} /> : <span className="stat-number">—</span>}<span>{stats ? 'Teams formed' : 'Live count unavailable'}</span></div></>;
}
