import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendTeamInviteEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

const inviteSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: { team: { include: { members: true, submission: true } } },
  });

  if (!membership || membership.role !== "LEADER") {
    return NextResponse.json({ error: "Only the team leader can invite members." }, { status: 403 });
  }

  if (membership.team.submission && membership.team.submission.status === "APPROVED") {
    return NextResponse.json({ error: "Team is locked because registration has already been approved." }, { status: 400 });
  }

  const maxConfig = await prisma.eventConfig.findUnique({ where: { key: "max_team_size" } });
  const maxSize = parseInt(maxConfig?.value || "4", 10);

  if (membership.team.members.length >= maxSize) {
    return NextResponse.json({ error: `Team capacity reached (maximum ${maxSize} members).` }, { status: 400 });
  }

  try {
    const body = await req.json();
    const result = inviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { email } = result.data;

    // Check if target user is already in this team
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { teamMembership: true },
    });

    if (targetUser?.teamMembership) {
      return NextResponse.json({ error: "This user is already in a team." }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: membership.team.id,
        email,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/dashboard/team?joinToken=${token}`;

    await sendTeamInviteEmail(email, membership.team.name, inviteUrl);

    await logAuditEvent({
      userId: user.id,
      action: "TEAM_INVITATION_SENT",
      entityType: "TeamInvitation",
      entityId: invitation.id,
      details: { teamId: membership.team.id, invitedEmail: email },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation generated for ${email}.`,
      inviteUrl,
      token,
    });
  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
