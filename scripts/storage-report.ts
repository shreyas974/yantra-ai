import { getStorageReport } from '../lib/storage-report';
getStorageReport().then(report => console.log(JSON.stringify(report, null, 2))).catch(error => {
  console.error(`Storage reporting failed: ${error.message}`);
  process.exitCode = 1;
});
