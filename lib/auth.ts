import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { cache } from 'react';
import { firebaseCreateSession, firebaseVerifySession, FIREBASE_SESSION_SECONDS, type FirebaseAccount } from './firebase/authentication';
export const digestToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const SESSION_COOKIE_NAME = "chad_session";
const SESSION_EXPIRY_DAYS = 30;
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
export async function createSession(userId: string, userAgent?: string, ipAddress?: string, firebaseIdToken?: string): Promise<string> {
    const token = firebaseIdToken ? await firebaseCreateSession(firebaseIdToken) : crypto.randomBytes(32).toString("hex");
    const seconds = firebaseIdToken ? FIREBASE_SESSION_SECONDS : SESSION_EXPIRY_DAYS * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + seconds * 1000);
    await db.session.create({
        data: {
            userId,
            token: digestToken(token),
            userAgent: userAgent || null,
            ipAddress: ipAddress || null,
            expiresAt,
        },
    });
    return token;
}
export async function setSessionCookie(token: string, maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
    });
}
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
export async function synchronizeFirebaseAccount(userId: string, account: FirebaseAccount) {
    return db.transaction(async tx => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (user.firebaseUid !== account.localId || user.email !== account.email.toLowerCase()) throw new Error('Firebase account mismatch.');
        const emailVerified = Boolean(account.emailVerified);
        let role = user.role;
        const administrator = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
        const approvedAdministrators = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
        const approved = user.email === administrator || approvedAdministrators.includes(user.email);
        if (emailVerified && approved) {
            const bootstrapKey = user.email === administrator ? 'initial_admin_bootstrap_complete' : `admin_access_${digestToken(user.email)}`;
            const bootstrap = await tx.eventConfig.findUnique({ where: { key: bootstrapKey } });
            if (!bootstrap) {
                role = 'ADMIN';
                await tx.eventConfig.create({ data: { key: bootstrapKey, value: user.id } });
                await tx.auditLog.create({ data: { userId: user.id, action: user.email === administrator ? 'INITIAL_ADMIN_BOOTSTRAPPED' : 'ADMIN_ACCESS_GRANTED', entityType: 'User', entityId: user.id } });
            }
        }
        if (emailVerified && !user.emailVerified) {
            await tx.notification.create({ data: { userId: user.id, title: 'Welcome to YANTRA AI', message: 'Your email is verified. Complete your profile and create or join a team.' } });
        }
        if (emailVerified !== user.emailVerified || role !== user.role) {
            await tx.user.update({ where: { id: user.id }, data: { emailVerified, role } });
        }
        return { emailVerified, role };
    });
}

export const getCurrentUser = cache(async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
        return null;
    }
    const session = await db.session.findUnique({
        where: { token: digestToken(sessionToken) },
        include: {
            user: {
                include: {
                    profile: true,
                    teamMembership: {
                        include: {
                            team: {
                                include: {
                                    members: true,
                                    submission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!session) {
        return null;
    }
    if (session.expiresAt < new Date()) {
        await db.session.delete({ where: { id: session.id } }).catch(() => { });
        return null;
    }
    if (session.user.firebaseUid) {
        try {
            const account = await firebaseVerifySession(sessionToken, session.user.firebaseUid);
            const verified = await synchronizeFirebaseAccount(session.user.id, account);
            return { ...session.user, ...verified };
        } catch {
            return null;
        }
    }
    return session.user;
});
export async function revokeSession(token: string) {
    await db.session.deleteMany({
        where: { token: digestToken(token) },
    });
}
export async function revokeAllUserSessions(userId: string) {
    await db.session.deleteMany({
        where: { userId },
    });
}
export async function createVerificationToken(userId: string): Promise<string> {
    // Invalidate any older unused verification tokens for this user
    await db.verificationToken.deleteMany({
        where: { userId, usedAt: null },
    });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.verificationToken.create({
        data: {
            userId,
            token: digestToken(token),
            expiresAt,
        },
    });
    return token;
}
export async function createPasswordResetToken(userId: string): Promise<string> {
    // Invalidate any older unused reset tokens
    await db.passwordResetToken.deleteMany({
        where: { userId, usedAt: null },
    });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await db.passwordResetToken.create({
        data: {
            userId,
            token: digestToken(token),
            expiresAt,
        },
    });
    return token;
}
