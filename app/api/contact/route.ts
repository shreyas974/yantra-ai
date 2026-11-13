import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  website: z.string().optional(), // Honeypot field - must be empty!
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`contact:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }

    const body = await req.json();
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { name, email, subject, message, website } = result.data;

    // Honeypot check - silently accept if bot filled the invisible field
    if (website && website.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Thank you for contacting us." });
    }

    const contactMsg = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    await logAuditEvent({
      action: "CONTACT_MESSAGE_RECEIVED",
      entityType: "ContactMessage",
      entityId: contactMsg.id,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! The CHAD organizing team has received your message.",
    });
  } catch (error: any) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
