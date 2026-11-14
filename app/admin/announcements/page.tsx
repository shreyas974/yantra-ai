'use client';
import { useEffect, useState } from 'react';
const blank = { id: '', title: '', content: '', status: 'DRAFT', scheduledFor: '', sendEmail: false };
export default function Page() {
    const [items, setItems] = useState<any[]>([]), [form, setForm] = useState(blank), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [firebaseMode, setFirebaseMode] = useState(true);
    async function load() { const r = await fetch('/api/admin/announcements'); const d = await r.json(); setItems(d.announcements || []); }
    useEffect(() => { load(); fetch('/api/auth/me').then(r => r.json()).then(d => setFirebaseMode(d.authMode === 'firebase')); }, []);
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        const r = await fetch('/api/admin/announcements', { method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: form.id || undefined, scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null }) });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setForm(blank);
        setMessage('Announcement saved.');
        load();
    }
    catch (e) {
        setMessage(String(e));
    }
    finally {
        setBusy(false);
    } }
    async function remove(id: string) { if (!confirm('Delete announcement?'))
        return; const r = await fetch('/api/admin/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, confirm: true }) }); if (r.ok)
        load();
    else
        setMessage('Deletion failed.'); }
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Announcements</h1><p role="status">{message}</p><form onSubmit={save} className="panel p-6 space-y-4"><label className="field">Title<input required minLength={3} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label className="field">Message<textarea required minLength={5} rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}/></label><label className="field">Publication<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>DRAFT</option><option>PUBLISHED</option><option>SCHEDULED</option></select></label>{form.status === 'SCHEDULED' && <label className="field">Publish at (browser timezone)<input required type="datetime-local" value={form.scheduledFor.slice(0, 16)} onChange={e => setForm({ ...form, scheduledFor: e.target.value })}/></label>}{form.status === 'PUBLISHED' && !firebaseMode && <label className="flex gap-3"><input type="checkbox" checked={form.sendEmail} onChange={e => setForm({ ...form, sendEmail: e.target.checked })}/>Also email verified participants</label>}<div className="flex gap-3"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save announcement'}</button><button type="button" className="btn-secondary" onClick={() => setForm(blank)}>Clear form</button></div></form>{!items.length && <p className="text-gray-400">No announcements yet.</p>}{items.map(i => <article className="panel p-5 space-y-3" key={i.id}><p className="eyebrow">{i.status}{i.scheduledFor && ` · ${new Date(i.scheduledFor).toLocaleString()}`}</p><h2 className="text-xl">{i.title}</h2><p className="text-gray-300 whitespace-pre-wrap">{i.content}</p><div className="flex gap-4"><button className="btn-secondary" onClick={() => setForm({ ...blank, ...i, scheduledFor: i.scheduledFor || '' })}>Edit</button><button className="text-red-300" onClick={() => remove(i.id)}>Delete</button></div></article>)}</div>;
}
