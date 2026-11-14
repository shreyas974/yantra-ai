import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { demoEmails, isLocalDemo } from '../lib/local-demo';


async function main() {
  if (!isLocalDemo()) throw new Error('Demo seeding is restricted to development on loopback URLs with the Firebase demo emulator and yantra_demo namespace.');
  for (const [kind, email] of Object.entries(demoEmails)) {
    const role = kind === 'admin' ? 'ADMIN' : 'USER';
    const existing = await db.user.findUnique({ where: { email } });
    if (existing && existing.role !== role) throw new Error('Existing demo account has an unexpected role. Inspect the demo database before continuing.');
    await db.user.upsert({
      where: { email }, update: {},
      create: {
        email, role, emailVerified: true,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        ...(kind === 'student' ? { profile: { create: {
          fullName: 'Guest Student (Local Demo)', collegeOrg: 'Local demo — example participant',
          cityState: 'Not provided', skills: 'Exploring AI/ML', aiExperience: 'Beginner',
          privacyConsent: true, rulesAccepted: false,
        } } } : {}),
      },
    });
  }
  console.log('Local demo student and organizer accounts are ready. No event details or problem statements were added.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.disconnect());
