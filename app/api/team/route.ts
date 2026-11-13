import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
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

  const membership = await prisma.teamMember.findUnique({
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
                  profile: true,
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

  return NextResponse.json({ team: membership?.team || null, role: membership?.role || null });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Please verify your email before creating a team." }, { status: 403 });
  }

  const existingMember = await prisma.teamMember.findUnique({
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

    const existingTeam = await prisma.team.findUnique({ where: { name } });
    if (existingTeam) {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });
    }

    const team = await prisma.$transaction(async (tx) => {
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
  } catch (error: any) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
