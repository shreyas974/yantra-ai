'use client';
import { useEffect, useState } from 'react';
export default function Page() { const [items, setItems] = useState<any[]>([]), [message, setMessage] = useState(''); async function load() { try {
    const r = await fetch('/api/notifications');
    if (!r.ok)
        throw Error();
    const d = await r.json();
    setItems(d.notifications);
}
catch {
    setMessage('Unable to load notifications.');
} } useEffect(() => { load(); }, []); async function read(id?: string) { const r = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); if (r.ok)
    load();
else
    setMessage('Unable to mark notification read.'); } return <div className="space-y-5"><h1 className="text-3xl font-bold">Notifications</h1><p role="status">{message}</p>{items.length > 0 && <button className="btn-secondary" onClick={() => read()}>Mark all read</button>}{!items.length && <p className="panel p-6 text-gray-400">You’re all caught up. Registration and organizer updates will appear here.</p>}{items.map(i => <article key={i.id} className="panel p-5 space-y-3"><p className="eyebrow">{i.readAt ? 'READ' : 'NEW'} · {new Date(i.createdAt).toLocaleString()}</p><h2 className="font-bold text-xl">{i.title}</h2><p className="text-gray-300">{i.message}</p>{!i.readAt && <button className="text-orange-200" onClick={() => read(i.id)}>Mark read</button>}</article>)}</div>; }
