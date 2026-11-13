import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  collegeOrg: z.string().min(2, "College/Organization is required"),
  cityState: z.string().min(2, "City and state are required"),
  skills: z.string().min(2, "Technical skills are required"),
  aiExperience: z.string().min(2, "AI/ML experience description is required"),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  studyYear: z.string().optional().nullable(),
  githubUrl: z.string().url().optional().or(z.literal("")).nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal("")).nullable(),
  portfolioUrl: z.string().url().optional().or(z.literal("")).nullable(),
  privacyConsent: z.boolean().refine((val) => val === true, "Privacy consent is required"),
  rulesAccepted: z.boolean().refine((val) => val === true, "You must accept the hackathon rules"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = profileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const data = result.data;

    // Fetch current rules version
    const rulesConfig = await prisma.eventConfig.findUnique({ where: { key: "rules_version" } });
    const rulesVersion = rulesConfig?.value || "1.0";

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName: data.fullName,
        collegeOrg: data.collegeOrg,
        cityState: data.cityState,
        skills: data.skills,
        aiExperience: data.aiExperience,
        phone: data.phone || null,
        department: data.department || null,
        studyYear: data.studyYear || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        privacyConsent: data.privacyConsent,
        rulesAccepted: data.rulesAccepted,
        rulesVersion,
      },
      update: {
        fullName: data.fullName,
        collegeOrg: data.collegeOrg,
        cityState: data.cityState,
        skills: data.skills,
        aiExperience: data.aiExperience,
        phone: data.phone || null,
        department: data.department || null,
        studyYear: data.studyYear || null,
        githubUrl: data.githubUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        privacyConsent: data.privacyConsent,
        rulesAccepted: data.rulesAccepted,
        rulesVersion,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "PROFILE_UPDATED",
      entityType: "Profile",
      entityId: profile.id,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
