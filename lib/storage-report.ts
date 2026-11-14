import { db } from './db';
import { firebaseConfig } from './firebase/rest';
export async function getStorageReport() {
  const config = firebaseConfig();
  const counts = await Promise.all([db.user.count(), db.team.count(), db.registrationSubmission.count(), db.emailOutbox.count(), db.problemStatement.count()]);
  return {
    provider: 'Firebase Cloud Firestore', projectId: config.projectId, databaseId: config.databaseId, namespace: config.namespace,
    // Firestore's aggregate API exposes record counts, not billing-storage byte usage.
    databaseBytes: null, quotaBytes: null,
    counts: { accounts: counts[0], teams: counts[1], registrations: counts[2], emails: counts[3], problemStatements: counts[4] },
    files: { provider: process.env.FIREBASE_STORAGE_BUCKET ? 'Firebase Cloud Storage' : null, bucket: process.env.FIREBASE_STORAGE_BUCKET || null, uploadsEnabled: false },
    consoleUrl: `https://console.firebase.google.com/project/${config.projectId}/firestore/usage`,
  };
}
