import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function Page() {
    const items = await db.problemStatement.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'asc' } });
    return <div className="max-w-5xl mx-auto px-6 py-20 space-y-8"><p className="eyebrow">THE CHALLENGES</p><h1 className="text-5xl font-bold">Problem statements</h1>{!items.length ? <div className="panel p-10"><p className="text-xl text-orange-200">Problem statements will be announced soon. Stay tuned!</p></div> : items.map(s => <article className="panel p-8 space-y-4" key={s.id}><p className="eyebrow">{s.identifier} · {s.track}</p><h2 className="text-2xl font-bold">{s.title}</h2><p className="whitespace-pre-wrap text-gray-300">{s.description}</p>{s.evaluationCriteria && <p className="whitespace-pre-wrap">{s.evaluationCriteria}</p>}{s.datasetsUrl && <a className="text-orange-200 underline" href={s.datasetsUrl} rel="noopener noreferrer">Supporting resources</a>}</article>)}</div>;
}
