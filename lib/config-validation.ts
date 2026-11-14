import { z } from 'zod';
const text = z.string().max(20000);
const bool = z.enum(['true', 'false']);
const date = z.string().refine(v => v === '' || (/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v))), 'Use an ISO date with timezone, or leave empty.');
export const configSchemas: Record<string, z.ZodTypeAny> = {
    event_name: text, event_tagline: text, event_theme: text, event_description: text, event_dates: text, event_starts_at: date, event_timezone: z.string().refine(v => { try {
        new Intl.DateTimeFormat('en', { timeZone: v });
        return true;
    }
    catch {
        return false;
    } }, 'Invalid timezone'),
    event_venue: text, event_mode: text, contact_email: z.union([z.string().email(), z.literal(''), z.literal('To be announced.')]), contact_details: text, eligibility: text, organizers: text,
    registration_open: bool, registration_deadline: date, team_editing_deadline: date, allow_solo: bool, rules_published: bool, rules_version: z.string().min(1).max(30), rules_content: text,
    min_team_size: z.string().regex(/^([1-9]|[1-4][0-9]|50)$/), max_team_size: z.string().regex(/^([1-9]|[1-4][0-9]|50)$/),
    registration_prefix: z.string().regex(/^[A-Z0-9-]{2,30}$/),
};
