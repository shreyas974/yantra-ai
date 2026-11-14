'use client';
import { useEffect, useState } from 'react';
export default function CountdownTimer({ targetDateStr = '', timezone = 'UTC' }: {
    targetDateStr?: string;
    timezone?: string;
}) {
    const [remaining, setRemaining] = useState<number | null>(null);
    const valid = /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(targetDateStr) && Number.isFinite(Date.parse(targetDateStr));
    useEffect(() => { if (!valid) {
        setRemaining(null);
        return;
    } const tick = () => setRemaining(Math.max(0, Date.parse(targetDateStr) - Date.now())); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [targetDateStr, valid]);
    if (!valid)
        return <p className="text-xs text-gray-400 font-mono">COUNTDOWN<br /><span className="text-gray-200 mt-2 inline-block">Dates to be announced</span></p>;
    if (remaining === null)
        return <p className="text-xs text-gray-400">Loading countdown…</p>;
    if (remaining === 0)
        return <p className="text-xs text-orange-200">Event start time reached.<br />Check the official schedule.</p>;
    const seconds = Math.floor(remaining / 1000);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
    return <div role="timer" aria-label={`Countdown to event in ${timezone}`}><div className="flex gap-3">{values.map((v, i) => <div className="text-center" key={i}><strong className="text-xl font-mono text-current">{String(v).padStart(2, '0')}</strong><span className="block text-[11px] text-gray-500">{['DAYS', 'HRS', 'MIN', 'SEC'][i]}</span></div>)}</div><p className="text-[11px] text-gray-500 mt-2">{timezone}</p></div>;
}
