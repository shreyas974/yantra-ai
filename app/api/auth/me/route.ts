import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { firebaseAuthEnabled } from '@/lib/firebase/authentication';
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ authMode: firebaseAuthEnabled() ? 'firebase' : 'password', user: user ? { id: user.id, role: user.role, emailVerified: user.emailVerified } : null });
}
