import { spawn } from 'node:child_process';
const env = { ...process.env, NODE_ENV: 'development', YANTRA_INTEGRATION: 'true' };
if (env.FIRESTORE_NAMESPACE !== 'yantra_test' || !/^demo-[a-z0-9-]+$/.test(env.FIREBASE_PROJECT_ID || '') || !/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(env.FIRESTORE_EMULATOR_HOST || '')) {
  console.error('Tests require a loopback Firebase emulator, a demo- project ID, and FIRESTORE_NAMESPACE=yantra_test. Real Firebase projects are refused.');
  process.exit(1);
}
const args = process.argv.includes('--e2e') ? ['--import', 'tsx', 'scripts/e2e.ts'] : ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.ts'];
const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
