import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { db } from '../lib/db';
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !process.argv.includes('--confirm')) throw new Error('Usage: npm run admin:promote -- verified-address@example.com --confirm');
  await db.transaction(async tx => {
    const user = await tx.user.findUnique({ where: { email } });
    if (!user?.emailVerified) throw new Error('Create and verify the account before granting organizer access.');
    await tx.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.auditLog.create({ data: { userId: user.id, action: 'ADMIN_PROMOTED_VIA_CLI', entityType: 'User', entityId: user.id } });
  });
  console.log('Organizer access granted. Sign in again to open /admin.');
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
