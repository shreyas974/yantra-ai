/** Demo shortcuts are restricted to the local Firebase emulator. */
export function isLocalDemo(env: Record<string,string|undefined> = process.env): boolean {
  if (env.NODE_ENV !== 'development' || env.LOCAL_DEMO !== 'true' || !env.FIREBASE_PROJECT_ID?.startsWith('demo-') || env.FIRESTORE_NAMESPACE !== 'yantra_demo') return false;
  try { return ['localhost','127.0.0.1','[::1]'].includes(new URL(env.APP_URL || '').hostname) && /^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(env.FIRESTORE_EMULATOR_HOST || ''); }
  catch { return false; }
}
export const demoEmails = { student: 'guest.student@yantra.example.invalid', admin: 'demo.organizer@yantra.example.invalid' } as const;
