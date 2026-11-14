import fs from "fs";
import path from "path";
import crypto from "crypto";
const MAIL_DIR = path.join(process.cwd(), "work", "mail");
export function emailDeliveryConfigured(): boolean {
    const mode = process.env.EMAIL_MODE || 'file';
    if (mode === 'file') return process.env.NODE_ENV !== 'production';
    return mode === 'resend' && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
export interface EmailPayload {
    to: string;
    subject: string;
    text: string;
    html: string;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
}
export async function sendEmail(payload: EmailPayload): Promise<{
    success: boolean;
    filePath?: string;
}> {
    const emailMode = process.env.EMAIL_MODE || "file";
    if (!emailDeliveryConfigured()) {
        throw new Error('Configure a production email provider before sending transactional messages.');
    }
    if (emailMode === "file") {
        if (process.env.NODE_ENV === "production")
            throw new Error("File email transport is disabled in production.");
        if (!fs.existsSync(MAIL_DIR)) {
            fs.mkdirSync(MAIL_DIR, { recursive: true, mode: 0o700 });
        }
        const filename = `mail-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
        const filePath = path.join(MAIL_DIR, filename);
        const emailData = {
            timestamp: new Date().toISOString(),
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            metadata: payload.metadata || {},
        };
        fs.writeFileSync(filePath, JSON.stringify(emailData, null, 2), { mode: 0o600 });
        console.log(`[LOCAL MAIL] Transactional email written to ${filePath}`);
        return { success: true, filePath };
    }
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {}) },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [payload.to], subject: payload.subject, text: payload.text, html: payload.html }),
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
        throw new Error(`Email provider rejected delivery (${response.status}).`);
    return { success: true };
}
export async function sendVerificationEmail(email: string, token: string) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const text = `Welcome to YANTRA AI! Please verify your email by visiting: ${verifyUrl}\nThis single-use link expires in 24 hours.`;
    const html = `
    <div style="font-family: sans-serif; background: #0a0a12; color: #ededef; padding: 24px; border-radius: 8px;">
      <h2 style="color: #b66c41;">YANTRA AI — Code. Create. Conquer.</h2>
      <p>Thank you for signing up for the YANTRA AI AI & ML Hackathon.</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}" style="background: #b66c41; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email Address</a></p>
      <p style="color: #94a3b8; font-size: 13px;">Or copy and paste this URL into your browser:</p>
      <p style="color: #06b6d4; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #64748b; font-size: 12px;">This single-use link expires in 24 hours.</p>
    </div>
  `;
    return sendEmail({
        to: email,
        subject: "Verify your email for YANTRA AI Hackathon",
        text,
        html,
        metadata: { type: "verification", token, verifyUrl },
    });
}
export async function sendPasswordResetEmail(email: string, token: string) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const text = `You requested a password reset for YANTRA AI: ${resetUrl}\nThis single-use link expires in 1 hour. If you did not request this, please ignore.`;
    const html = `
    <div style="font-family: sans-serif; background: #0a0a12; color: #ededef; padding: 24px; border-radius: 8px;">
      <h2 style="color: #b66c41;">YANTRA AI — Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}" style="background: #06b6d4; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
      <p style="color: #94a3b8; font-size: 13px;">Or open this link:</p>
      <p style="color: #06b6d4; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      <p style="color: #64748b; font-size: 12px;">This single-use link expires in 1 hour.</p>
    </div>
  `;
    return sendEmail({
        to: email,
        subject: "Reset your YANTRA AI password",
        text,
        html,
        metadata: { type: "password_reset", token, resetUrl },
    });
}
export async function sendTeamInviteEmail(email: string, teamName: string, inviteUrl: string) {
    teamName = escapeHtml(teamName);
    const text = `You have been invited to join team "${teamName}" for YANTRA AI Hackathon!\nAccept invite: ${inviteUrl}\nThis single-use invite expires in 48 hours.`;
    const html = `
    <div style="font-family: sans-serif; background: #0a0a12; color: #ededef; padding: 24px; border-radius: 8px;">
      <h2 style="color: #10b981;">YANTRA AI — Team Invitation</h2>
      <p>You have been invited to join team <strong>${teamName}</strong> for the YANTRA AI AI & ML Hackathon.</p>
      <p><a href="${inviteUrl}" style="background: #10b981; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Team</a></p>
      <p style="color: #94a3b8; font-size: 13px;">Or open this link:</p>
      <p style="color: #06b6d4; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
    </div>
  `;
    return sendEmail({
        to: email,
        subject: `Invitation to join team "${teamName}" - YANTRA AI`,
        text,
        html,
        metadata: { type: "team_invite", teamName, inviteUrl },
    });
}
export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
