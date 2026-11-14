import { invalidateEventConfigCache } from '@/lib/event-config';
import { configSchemas } from "@/lib/config-validation";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEventConfigMap } from "@/lib/event-config";
import { logAuditEvent } from "@/lib/audit";
export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const configs = await getEventConfigMap();
    return NextResponse.json({ configs });
}
export async function POST(req: NextRequest) {
  try { return await handlePOST(req); } finally { invalidateEventConfigCache(); }
}
async function handlePOST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { key, value } = body;
        if (!key || typeof key !== "string" || value === undefined) {
            return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
        }
        const validator = configSchemas[key];
        if (!validator)
            return NextResponse.json({ error: 'Use the content manager for structured event content.' }, { status: 400 });
        const validation = validator.safeParse(value);
        if (!validation.success)
            return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
        const current = await getEventConfigMap();
        const next = { ...current, [key]: value };
        if (Number(next.min_team_size || 1) > Number(next.max_team_size || 4))
            return NextResponse.json({ error: 'Minimum size cannot exceed maximum.' }, { status: 400 });
        if (next.registration_open === 'true' && (next.rules_published !== 'true' || !Number.isFinite(Date.parse(next.registration_deadline)) || Date.parse(next.registration_deadline) <= Date.now()))
            return NextResponse.json({ error: 'Publish rules and configure a future registration deadline before opening registration.' }, { status: 400 });
        if (key === 'rules_content' && current.rules_published === 'true')
            return NextResponse.json({ error: 'Unpublish rules and update their version before changing published rules.' }, { status: 400 });
        if (key === 'rules_published' && value === 'true' && (!current.rules_content || current.rules_content.startsWith('Official competition rules will')))
            return NextResponse.json({ error: 'Enter organizer-approved rules before publishing.' }, { status: 400 });
        const updated = await db.transaction(async (tx) => {
            if (key === 'rules_content' && current.rules_content !== value)
                await tx.eventConfig.upsert({ where: { key: 'rules_version' }, create: { key: 'rules_version', value: String(Date.now()) }, update: { value: String(Date.now()) } });
            return tx.eventConfig.upsert({
                where: { key },
                create: { key, value: String(value) },
                update: { value: String(value) },
            });
        });
        await logAuditEvent({
            userId: user.id,
            action: "EVENT_CONFIG_UPDATED",
            entityType: "EventConfig",
            entityId: updated.id,
            details: { key, value },
        });
        return NextResponse.json({ success: true, updated });
    }
    catch (error: any) {
        console.error("Config update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
