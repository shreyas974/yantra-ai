import { BRAND } from './brand';
import crypto from "crypto";
import { publicContent } from "./content";
import { db } from "./db";
// Public pages read this on every request; a short per-instance cache keeps
// them fast while organizer edits still appear within seconds.
const PUBLIC_CACHE_MS = 30_000;
let configCache: { value: Promise<Record<string, string>>; expiresAt: number } | undefined;
let statsCache: { value: Promise<{ participants: number; teams: number }>; expiresAt: number } | undefined;
function cached<T>(entry: { value: Promise<T>; expiresAt: number } | undefined, load: () => Promise<T>, store: (e: { value: Promise<T>; expiresAt: number }) => void): Promise<T> {
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    const value = load();
    store({ value, expiresAt: Date.now() + PUBLIC_CACHE_MS });
    value.catch(() => store({ value, expiresAt: 0 }));
    return value;
}
export function invalidateEventConfigCache() { configCache = undefined; statsCache = undefined; }
export function getEventConfigMap(): Promise<Record<string, string>> {
    return cached(configCache, loadEventConfigMap, e => { configCache = e; });
}
async function loadEventConfigMap(): Promise<Record<string, string>> {
    const [configs, content] = await Promise.all([db.eventConfig.findMany(), publicContent()]);
    const map: Record<string, string> = {};
    for (const c of configs) {
        map[c.key] = c.value;
    }
    if (content) {
        map.tracks = JSON.stringify(content.tracks);
        map.schedule = JSON.stringify(content.schedule.map(s => ({ phase: s.title, description: s.description, time: s.startsAt ? new Intl.DateTimeFormat('en-IN', { timeZone: map.event_timezone || 'UTC', dateStyle: 'medium', timeStyle: 'short' }).format(s.startsAt) : 'To be announced.' })));
        map.faqs = JSON.stringify(content.faqs.map(f => ({ q: f.title, a: f.description })));
        map.prizes = JSON.stringify(content.prizes);
        map.sponsors = JSON.stringify(content.sponsors);
    }
    return map;
}
export function getPublicStats() {
    return cached(statsCache, loadPublicStats, e => { statsCache = e; });
}
async function loadPublicStats() {
    const [participantCount, teamCount] = await Promise.all([
        db.user.count({ where: { emailVerified: true, role: "USER" } }),
        db.team.count(),
    ]);
    return {
        participants: participantCount,
        teams: teamCount,
    };
}
export function generateRegistrationId(prefix: string = BRAND.registrationPrefix): string {
    return `${prefix}-${crypto.randomBytes(9).toString("hex").toUpperCase()}`;
}
