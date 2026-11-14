import { spawn } from 'node:child_process';
const port = Number(process.env.DEMO_PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('DEMO_PORT must be between 1024 and 65535.');
const env = { ...process.env, NODE_ENV: 'development', LOCAL_DEMO: 'true', APP_URL: `http://127.0.0.1:${port}`, FIREBASE_PROJECT_ID: 'demo-yantra', FIRESTORE_NAMESPACE: 'yantra_demo', FIRESTORE_DATABASE_ID: '(default)', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', EMAIL_MODE: 'file' };
async function run(args) {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
  const stop = signal => child.kill(signal);
  const interrupt = () => stop('SIGINT'), terminate = () => stop('SIGTERM');
  process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
  try { await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Command exited with status ${code}.`))); }); }
  finally { process.off('SIGINT', interrupt); process.off('SIGTERM', terminate); }
}
try {
  const ready = await fetch('http://127.0.0.1:8080', { signal: AbortSignal.timeout(3000) });
  if (ready.status >= 500) throw new Error('Emulator unavailable.');
  await run(['--import', 'tsx', 'scripts/seed.ts']);
  await run(['--import', 'tsx', 'scripts/seed-local-demo.ts']);
  console.log(`Local demo: ${env.APP_URL}/guest`);
  await run(['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)]);
} catch (error) {
  console.error(error.message);
  console.error('Start the isolated emulator first: firebase emulators:start --only firestore --project demo-yantra');
  process.exitCode = 1;
}
