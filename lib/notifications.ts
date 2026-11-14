import { db } from './db';
import { firebaseAuthEnabled } from './firebase/authentication';
import { sendEmail, escapeHtml } from './email';
export async function queueNotice(to: string, subject: string, text: string) {
  if (firebaseAuthEnabled()) {
    const user = await db.user.findUnique({ where: { email: to.toLowerCase() } });
    if (user) await db.notification.create({ data: { userId: user.id, title: subject, message: text } });
    return;
  }
  const row = await db.emailOutbox.create({ data: { to, subject: `YANTRA AI — ${subject}`, text, html: `<div style="background:#101713;color:#f4f2e9;padding:32px;font-family:sans-serif"><h1 style="color:#f4a16d">YANTRA AI</h1><p>Code. Create. Conquer.</p><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(text)}</p><p>Visit your YANTRA AI dashboard for event details.</p></div>` } });
  await deliverNotice(row.id);
}
export async function deliverNotice(id: string) {
  // Claim before contacting the provider: retried transaction callbacks never send email.
  const claimed = await db.transaction(async tx => {
    const row = await tx.emailOutbox.findUnique({ where: { id } });
    const lease = (row as any)?.leaseUntil;
    if (!row || row.deliveredAt || (lease && lease > new Date()) || row.attempts >= 5) return null;
    await tx.emailOutbox.update({ where: { id }, data: { leaseUntil: new Date(Date.now() + 60000), attempts: { increment: 1 } } });
    return row;
  });
  if (!claimed) return;
  try {
    await sendEmail({ ...claimed, idempotencyKey: claimed.id });
    await db.emailOutbox.update({ where: { id }, data: { deliveredAt: new Date(), leaseUntil: null, lastError: null } });
  } catch {
    await db.emailOutbox.update({ where: { id }, data: { leaseUntil: null, lastError: 'Delivery failed; check provider configuration and retry.' } });
  }
}
