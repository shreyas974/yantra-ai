import { db } from '../db';
import { firebaseDeleteAccount } from './authentication';

// The durable job is created in the same transaction as application deletion.
// Provider requests run afterwards so Firestore transaction retries stay safe.
export async function completeFirebaseDeletion(uid: string): Promise<boolean> {
    try {
        await firebaseDeleteAccount(uid);
        await db.firebaseDeletion.deleteMany({ where: { id: uid } });
        return true;
    } catch {
        return false;
    }
}
