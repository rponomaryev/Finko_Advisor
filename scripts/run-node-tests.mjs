import { spawnSync } from 'node:child_process';
import { copyFileSync, rmSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/run-node-tests.mjs <test-file> [test-file...]');
  process.exit(1);
}

process.env.STRICT_REPORT_LOCALE_CHECK ??= 'true';
process.env.NODE_ENV ??= 'test';

const temporaryFiles = [];
const runnableFiles = files.map((file) => {
  if (!file.endsWith('.tsx')) return file;
  const dir = dirname(file);
  const tempFile = join(dir, `.${basename(file, '.tsx')}.tmp.ts`);
  copyFileSync(file, tempFile);
  temporaryFiles.push(tempFile);
  return tempFile;
});

const result = spawnSync(process.execPath, [
  '--experimental-strip-types',
  '--test',
  '--test-force-exit',
  '--test-concurrency=4',
  ...runnableFiles
], {
  stdio: 'inherit',
  env: process.env,
  shell: false
});

for (const file of temporaryFiles) {
  rmSync(file, { force: true });
}

process.exit(result.status ?? 1);
