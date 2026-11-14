import { safeUrl } from "@/lib/policies";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
const profileSchema = z.object({
    fullName: z.string().max(2000).min(2, "Full name is required"),
    collegeOrg: z.string().max(2000).min(2, "College/Organization is required"),
    cityState: z.string().max(2000).min(2, "City and state are required"),
    skills: z.string().max(2000).min(2, "Technical skills are required"),
    aiExperience: z.string().max(2000).min(2, "AI/ML experience description is required"),
    phone: z.string().max(24).refine(v => !v || /^\+?[0-9 ()-]{7,24}$/.test(v), "Enter a valid phone number").optional().nullable(),
    department: z.string().optional().nullable(),
    studyYear: z.string().optional().nullable(),
    githubUrl: safeUrl.optional().or(z.literal("")).nullable(),
    linkedinUrl: safeUrl.optional().or(z.literal("")).nullable(),
    portfolioUrl: safeUrl.optional().or(z.literal("")).nullable(),
    privacyConsent: z.boolean().refine((val) => val === true, "Privacy consent is required"),
    rulesAccepted: z.boolean(),
});
export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    const profile = await db.profile.findUnique({
        where: { userId: user.id },
    });
    return NextResponse.json({ profile, emailVerified: user.emailVerified, userId: user.id });
}
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    try {
        const body = await req.json();
        const result = profileSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const data = result.data;
        // Fetch current rules version
        const rulesConfig = await db.eventConfig.findUnique({ where: { key: "rules_version" } });
        const published = await db.eventConfig.findUnique({ where: { key: 'rules_published' } });
        if (data.rulesAccepted && published?.value !== 'true')
            return NextResponse.json({ error: 'Official rules are not published. Save without accepting rules for now.' }, { status: 400 });
        const rulesVersion = data.rulesAccepted ? rulesConfig?.value || "1.0" : null;
        const profile = await db.profile.upsert({
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
    }
    catch (error: any) {
        console.error("Profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
