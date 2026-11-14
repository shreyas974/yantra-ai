import { EVENT_KEY } from './brand';
import { db } from './db';
export async function publicContent() {
    const event = await db.event.findUnique({ where: { slug: EVENT_KEY }, include: { tracks: { where: { published: true }, orderBy: { position: 'asc' } }, schedule: { where: { published: true }, orderBy: { position: 'asc' } }, prizes: { where: { published: true }, orderBy: { position: 'asc' } }, faqs: { where: { published: true }, orderBy: { position: 'asc' } }, sponsors: { where: { published: true }, orderBy: { position: 'asc' } } } });
    return event;
}
export const visibleAnnouncements = () => ({ OR: [{ status: 'PUBLISHED' as const }, { status: 'SCHEDULED' as const, scheduledFor: { lte: new Date() } }] });
