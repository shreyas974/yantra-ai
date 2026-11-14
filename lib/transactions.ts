import { db, type Database } from './db';
export function transaction<T>(work: (tx: Database) => Promise<T>): Promise<T> { return db.transaction(work); }
export async function lockTeam(tx: Database, teamId: string) {
  // Reading and incrementing the parent revision serializes roster mutations.
  // Writes are staged and committed only after all Firestore reads finish.
  await tx.touch('team', teamId);
}
export async function settings(tx: Database) {
  const rows = await tx.eventConfig.findMany();
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}
