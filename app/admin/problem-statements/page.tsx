'use client';
import { useEffect, useState } from 'react';
const blank = { id: '', identifier: '', title: '', track: '', description: '', datasetsUrl: '', evaluationCriteria: '', status: 'DRAFT' };
export default function Page() {
    const [items, setItems] = useState<(typeof blank)[]>([]), [form, setForm] = useState(blank), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    async function load() { const r = await fetch('/api/admin/problem-statements'); const d = await r.json(); setItems(d.statements || []); }
    useEffect(() => { load(); }, []);
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        const r = await fetch('/api/admin/problem-statements', { method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: form.id || undefined, identifier: form.identifier || null }) });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setForm(blank);
        setMessage('Official statement saved.');
        load();
    }
    catch (e) {
        setMessage(String(e));
    }
    finally {
        setBusy(false);
    } }
    async function remove(id: string) { if (!confirm('Permanently delete this statement?'))
        return; const r = await fetch('/api/admin/problem-statements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, confirm: true }) }); if (r.ok)
        load();
    else
        setMessage('Deletion failed.'); }
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Problem statements</h1><p className="panel p-5 text-orange-200">Problem statements will be announced soon. Stay tuned!</p><p className="text-gray-400">Add only official content supplied by organizers. This module starts empty.</p><p role="status">{message}</p><form className="panel p-6 space-y-4" onSubmit={save}>{(['identifier', 'title', 'track', 'description', 'datasetsUrl', 'evaluationCriteria'] as const).map(k => <label className="field" key={k}>{({ identifier: 'Official identifier', title: 'Title', track: 'Track', description: 'Official description', datasetsUrl: 'Supporting resource URL', evaluationCriteria: 'Official evaluation criteria' })[k]}{['description', 'evaluationCriteria'].includes(k) ? <textarea rows={5} required={k === 'description'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}/> : <input type={k === 'datasetsUrl' ? 'url' : 'text'} required={k === 'title'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}/>}</label>)}<label className="field">Visibility<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>DRAFT</option><option>PUBLISHED</option></select></label><div className="flex gap-3"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save statement'}</button><button type="button" className="btn-secondary" onClick={() => setForm(blank)}>Clear form</button></div></form>{items.length === 0 && <p className="text-gray-400">No statements in storage.</p>}{items.map(i => <article className="panel p-5" key={i.id}><p className="eyebrow">{i.status} · {i.identifier}</p><h2 className="text-xl my-3">{i.title}</h2><button className="btn-secondary" onClick={() => setForm({ ...blank, ...i, datasetsUrl: i.datasetsUrl || '', evaluationCriteria: i.evaluationCriteria || '' })}>Edit / change visibility</button><button className="ml-4 text-red-300" onClick={() => remove(i.id)}>Delete</button></article>)}</div>;
}
