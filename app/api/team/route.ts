import { assertDeadline } from "@/lib/policies";
import { getEventConfigMap } from "@/lib/event-config";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
const createTeamSchema = z.object({
    name: z.string().trim().min(3, "Team name must be at least 3 characters").max(40),
    isSolo: z.boolean().default(false),
});
export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    const membership = await db.teamMember.findUnique({
        where: { userId: user.id },
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    emailVerified: true,
                                    profile: { select: { fullName: true, skills: true, rulesAccepted: true, privacyConsent: true, rulesVersion: true } },
                                },
                            },
                        },
                    },
                    invitations: {
                        where: { usedAt: null, expiresAt: { gt: new Date() } },
                    },
                    submission: true,
                },
            },
        },
    });
    const config = await getEventConfigMap();
    if (membership && membership.role !== 'LEADER')
        membership.team.invitations = [];
    return NextResponse.json({ team: membership?.team || null, role: membership?.role || null, maxTeamSize: Number(config.max_team_size || 4) });
}
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    if (!user.emailVerified) {
        return NextResponse.json({ error: "Please verify your email before creating a team." }, { status: 403 });
    }
    const existingMember = await db.teamMember.findUnique({
        where: { userId: user.id },
    });
    if (existingMember) {
        return NextResponse.json({ error: "You are already a member of a team. Leave your current team first." }, { status: 409 });
    }
    try {
        const body = await req.json();
        const result = createTeamSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { name, isSolo } = result.data;
        const config = await getEventConfigMap();
        try {
            assertDeadline(config.team_editing_deadline);
        }
        catch {
            return NextResponse.json({ error: 'Team formation deadline passed.' }, { status: 403 });
        }
        if (isSolo && config.allow_solo !== 'true')
            return NextResponse.json({ error: 'Solo participation is disabled.' }, { status: 400 });
        const existingTeam = await db.team.findUnique({ where: { name } });
        if (existingTeam) {
            return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });
        }
        const team = await db.transaction(async (tx) => {
            const created = await tx.team.create({
                data: {
                    name,
                    leaderId: user.id,
                    isSolo,
                },
            });
            await tx.teamMember.create({
                data: {
                    teamId: created.id,
                    userId: user.id,
                    role: "LEADER",
                },
            });
            return created;
        });
        await logAuditEvent({
            userId: user.id,
            action: "TEAM_CREATED",
            entityType: "Team",
            entityId: team.id,
            details: { name: team.name, isSolo },
        });
        return NextResponse.json({ success: true, team });
    }
    catch (error: any) {
        console.error("Create team error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
