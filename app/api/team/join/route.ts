import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const joinSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Please verify your email before joining a team." }, { status: 403 });
  }

  const existingMember = await prisma.teamMember.findUnique({
    where: { userId: user.id },
  });

  if (existingMember) {
    return NextResponse.json({ error: "You are already a member of a team. Leave your current team first." }, { status: 409 });
  }

  try {
    const body = await req.json();
    const result = joinSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { token } = result.data;

    // Concurrency-safe atomic transaction
    const joinResult = await prisma.$transaction(async (tx) => {
      const invite = await tx.teamInvitation.findUnique({
        where: { token },
        include: { team: { include: { members: true, submission: true } } },
      });

      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        throw new Error("Invalid or expired invitation token.");
      }

      if (invite.team.submission && invite.team.submission.status === "APPROVED") {
        throw new Error("This team's registration is already approved and locked.");
      }

      const maxConfig = await tx.eventConfig.findUnique({ where: { key: "max_team_size" } });
      const maxSize = parseInt(maxConfig?.value || "4", 10);

      if (invite.team.members.length >= maxSize) {
        throw new Error(`Team is already full (max ${maxSize} members).`);
      }

      // Add member
      const member = await tx.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: user.id,
          role: "MEMBER",
        },
      });

      // Mark invite as used
      await tx.teamInvitation.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return { member, team: invite.team };
    });

    await logAuditEvent({
      userId: user.id,
      action: "TEAM_JOINED",
      entityType: "Team",
      entityId: joinResult.team.id,
      details: { teamName: joinResult.team.name },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined team "${joinResult.team.name}"!`,
      team: joinResult.team,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to join team" }, { status: 400 });
  }
}
