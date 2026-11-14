import { invalidateEventConfigCache } from '@/lib/event-config';
import { BRAND, EVENT_KEY } from '@/lib/brand';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeUrl } from '@/lib/policies';
const types = ['tracks', 'schedule', 'prizes', 'faqs', 'sponsors'] as const;
const schema = z.object({ type: z.enum(types), id: z.string().optional(), title: z.string().trim().min(2).max(200), description: z.string().max(10000).default(''), published: z.boolean().default(false), position: z.number().int().min(0).max(10000).default(0), startsAt: z.string().datetime({ offset: true }).nullable().optional(), url: safeUrl.nullable().optional() });
const models = { tracks: db.track, schedule: db.scheduleItem, prizes: db.prize, faqs: db.fAQ, sponsors: db.sponsor };
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const type = req.nextUrl.searchParams.get('type') as typeof types[number];
    if (!types.includes(type))
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    const items = await (models[type] as any).findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return NextResponse.json({ items });
}
export async function POST(req: NextRequest) {
  try { return await handlePOST(req); } finally { invalidateEventConfigCache(); }
}
async function handlePOST(req: NextRequest) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { type, id, startsAt, url, ...data } = parsed.data;
    const event = await db.event.upsert({ where: { slug: EVENT_KEY }, create: { slug: EVENT_KEY, title: BRAND.name }, update: {} });
    const payload = { ...data, eventId: event.id, ...(type === 'schedule' ? { startsAt: startsAt ? new Date(startsAt) : null } : {}), ...(type === 'sponsors' ? { url: url || null } : {}) };
    const item = id ? await (models[type] as any).update({ where: { id }, data: payload }) : await (models[type] as any).create({ data: payload });
    await db.auditLog.create({ data: { userId: user.id, action: 'CONTENT_SAVED', entityType: type, entityId: item.id } });
    return NextResponse.json({ success: true, item });
}
export async function DELETE(req: NextRequest) {
  try { return await handleDELETE(req); } finally { invalidateEventConfigCache(); }
}
async function handleDELETE(req: NextRequest) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { type, id, confirm } = await req.json();
    if (!types.includes(type) || !id || confirm !== true)
        return NextResponse.json({ error: 'Confirm deletion and specify content.' }, { status: 400 });
    await (models[type as typeof types[number]] as any).delete({ where: { id } });
    await db.auditLog.create({ data: { userId: user.id, action: 'CONTENT_DELETED', entityType: type, entityId: id } });
    return NextResponse.json({ success: true });
}
