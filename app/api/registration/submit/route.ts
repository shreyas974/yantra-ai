import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateRegistrationId } from "@/lib/event-config";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check event registration open state
  const regConfig = await prisma.eventConfig.findUnique({ where: { key: "registration_open" } });
  if (regConfig?.value !== "true") {
    return NextResponse.json({
      error: "Registration submissions are currently closed. Organizers will open registrations soon.",
    }, { status: 403 });
  }

  // Check rules published
  const rulesPub = await prisma.eventConfig.findUnique({ where: { key: "rules_published" } });
  if (rulesPub?.value !== "true") {
    return NextResponse.json({
      error: "Official competition rules are pending publication. Registration cannot be submitted yet.",
    }, { status: 403 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
          submission: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "You must create or join a team before submitting registration." }, { status: 400 });
  }

  if (membership.role !== "LEADER") {
    return NextResponse.json({ error: "Only the team leader can submit registration for the team." }, { status: 403 });
  }

  const team = membership.team;

  if (team.submission && team.submission.status === "APPROVED") {
    return NextResponse.json({ error: "Registration for this team is already approved." }, { status: 400 });
  }

  // Check minimum & maximum team size
  const minConfig = await prisma.eventConfig.findUnique({ where: { key: "min_team_size" } });
  const maxConfig = await prisma.eventConfig.findUnique({ where: { key: "max_team_size" } });
  const minSize = parseInt(minConfig?.value || "1", 10);
  const maxSize = parseInt(maxConfig?.value || "4", 10);

  if (team.members.length < minSize) {
    return NextResponse.json({ error: `Team must have at least ${minSize} member(s).` }, { status: 400 });
  }
  if (team.members.length > maxSize) {
    return NextResponse.json({ error: `Team exceeds maximum size of ${maxSize} members.` }, { status: 400 });
  }

  // Verify all members have verified email and accepted rules/profile
  for (const m of team.members) {
    if (!m.user.emailVerified) {
      return NextResponse.json({
        error: `Member ${m.user.email} has not verified their email yet.`,
      }, { status: 400 });
    }
    if (!m.user.profile || !m.user.profile.rulesAccepted) {
      return NextResponse.json({
        error: `Member ${m.user.email} has not completed their profile or accepted the rules.`,
      }, { status: 400 });
    }
  }

  // Collision-resistant ID generation with retry loop
  let registrationId = team.submission?.registrationId || "";
  if (!registrationId) {
    for (let attempts = 0; attempts < 10; attempts++) {
      const candidate = generateRegistrationId("CHAD");
      const exists = await prisma.registrationSubmission.findUnique({ where: { registrationId: candidate } });
      if (!exists) {
        registrationId = candidate;
        break;
      }
    }
  }

  if (!registrationId) {
    return NextResponse.json({ error: "Failed to generate unique registration ID. Please try again." }, { status: 500 });
  }

  const submission = await prisma.registrationSubmission.upsert({
    where: { teamId: team.id },
    create: {
      teamId: team.id,
      registrationId,
      submittedById: user.id,
      status: "PENDING",
      submittedAt: new Date(),
    },
    update: {
      status: "PENDING",
      rejectionReason: null,
      submittedAt: new Date(),
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "REGISTRATION_SUBMITTED",
    entityType: "RegistrationSubmission",
    entityId: submission.id,
    details: { registrationId, teamName: team.name, memberCount: team.members.length },
  });

  return NextResponse.json({
    success: true,
    message: "Registration submitted successfully! It is now pending organizer review.",
    submission,
  });
}
