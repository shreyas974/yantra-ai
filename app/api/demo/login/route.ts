import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isLocalDemo, demoEmails } from '@/lib/local-demo';
import { db } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';
import { checkRateLimit, rateKey, requestIdentity } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (!isLocalDemo()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const result = z.object({ role: z.enum(['student', 'admin']) }).safeParse(await req.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: 'Choose student or organizer.' }, { status: 400 });
  try {
    const limit = await checkRateLimit(rateKey('demo-login', requestIdentity(req.headers)), 30, 60000);
    if (!limit.allowed) return NextResponse.json({ error: 'Please wait before switching accounts again.' }, { status: 429 });
    const user = await db.user.findUnique({ where: { email: demoEmails[result.data.role] } });
    if (!user?.emailVerified || user.role !== (result.data.role === 'admin' ? 'ADMIN' : 'USER')) {
      return NextResponse.json({ error: 'Demo accounts are unavailable. Run npm run demo from your terminal.' }, { status: 503 });
    }
    const token = await createSession(user.id);
    await setSessionCookie(token);
    await db.auditLog.create({ data: { userId: user.id, action: 'LOCAL_DEMO_SIGN_IN', entityType: 'User', entityId: user.id } });
    return NextResponse.json({ success: true, redirect: result.data.role === 'admin' ? '/admin' : '/dashboard' });
  } catch {
    return NextResponse.json({ error: 'The local demo database is unavailable. Check the terminal running npm run demo.' }, { status: 503 });
  }
}
