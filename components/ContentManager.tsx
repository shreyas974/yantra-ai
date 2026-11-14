'use client';
import { useEffect, useState } from 'react';
type Item = {
    id?: string;
    title: string;
    description: string;
    published: boolean;
    position: number;
    startsAt?: string | null;
    url?: string | null;
};
const empty: Item = { title: '', description: '', published: false, position: 0 };
export default function ContentManager() {
    const [type, setType] = useState('tracks'), [items, setItems] = useState<Item[]>([]), [form, setForm] = useState<Item>(empty), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    async function load() { try {
        const r = await fetch(`/api/admin/content?type=${type}`);
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setItems(d.items);
    }
    catch (e) {
        setMessage(String(e));
    } }
    useEffect(() => { setForm(empty); load(); }, [type]);
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        const r = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null }) });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setForm(empty);
        setMessage('Content saved. Only published entries appear on public pages.');
        await load();
    }
    catch (e) {
        setMessage(String(e));
    }
    finally {
        setBusy(false);
    } }
    async function remove(id: string) { if (!confirm('Permanently delete this content?'))
        return; const r = await fetch('/api/admin/content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, confirm: true }) }); if (r.ok) {
        setMessage('Deleted');
        load();
    }
    else
        setMessage('Deletion failed.'); }
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Event content</h1><p className="text-gray-400">Draft content stays private. Publish only organizer-approved details.</p><label className="field">Content type<select value={type} onChange={e => setType(e.target.value)}>{['tracks', 'schedule', 'prizes', 'faqs', 'sponsors'].map(t => <option key={t}>{t}</option>)}</select></label><p role="status">{message}</p><form className="panel p-6 space-y-4" onSubmit={save}><h2 className="text-xl">{form.id ? 'Edit' : 'Create'} {type}</h2><label className="field">{type === 'faqs' ? 'Question' : 'Title'}<input required minLength={2} maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label className="field">{type === 'faqs' ? 'Answer' : 'Description'}<textarea rows={4} maxLength={10000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>{type === 'schedule' && <label className="field">Start time (your browser timezone)<input type="datetime-local" value={form.startsAt?.slice(0, 16) || ''} onChange={e => setForm({ ...form, startsAt: e.target.value })}/></label>}{type === 'sponsors' && <label className="field">Website<input type="url" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value || null })}/></label>}<label className="field">Display order<input type="number" min={0} value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) })}/></label><label className="flex gap-3"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}/>Publish on public pages</label><div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save content'}</button><button type="button" className="btn-secondary" onClick={() => setForm(empty)}>Clear form</button></div></form>{!items.length && <p className="panel p-6 text-gray-400">No content added yet.</p>}{items.map(i => <article className="panel p-5 space-y-3" key={i.id}><p className="eyebrow">{i.published ? 'Published' : 'Draft'}</p><h2 className="text-xl">{i.title}</h2><p className="text-gray-400 whitespace-pre-wrap">{i.description}</p><div className="flex gap-3"><button className="btn-secondary" onClick={() => setForm(i)}>Edit</button><button className="text-red-300" onClick={() => remove(i.id!)}>Delete</button></div></article>)}</div>;
}
