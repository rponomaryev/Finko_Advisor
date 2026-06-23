import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, join } from 'node:path';

const require = createRequire(import.meta.url);

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [command], { stdio: 'ignore', shell: false });
  return result.status === 0;
}

function getPdftotextCommand() {
  const configuredPath = process.env.PDFTOTEXT_PATH?.trim();
  if (configuredPath && existsSync(configuredPath)) return configuredPath;
  if (commandExists('pdftotext')) return 'pdftotext';

  if (process.platform === 'win32') {
    const pathCandidates = (process.env.PATH ?? '')
      .split(delimiter)
      .filter(Boolean)
      .flatMap((entry) => [join(entry, 'pdftotext.exe'), join(entry, 'pdftotext')]);
    const candidates = [
      'C:\\Program Files\\poppler\\Library\\bin\\pdftotext.exe',
      'C:\\Program Files\\poppler\\bin\\pdftotext.exe',
      'C:\\Program Files (x86)\\poppler\\Library\\bin\\pdftotext.exe',
      'C:\\Program Files (x86)\\poppler\\bin\\pdftotext.exe',
      'C:\\tools\\poppler\\Library\\bin\\pdftotext.exe',
      'C:\\tools\\poppler\\bin\\pdftotext.exe',
      'C:\\poppler\\Library\\bin\\pdftotext.exe',
      'C:\\poppler\\bin\\pdftotext.exe',
      ...pathCandidates
    ];
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  return null;
}

function resolveOptionalPackage(name) {
  try {
    return require.resolve(name);
  } catch {
    return null;
  }
}

const configuredPath = process.env.PDFTOTEXT_PATH?.trim() || '';
const command = getPdftotextCommand();
const pdfParsePath = resolveOptionalPackage('pdf-parse');

console.log('PDF text extraction:');
console.log(`- pdftotext in PATH: ${commandExists('pdftotext') ? 'yes' : 'no'}`);
console.log(`- PDFTOTEXT_PATH: ${configuredPath ? `set (${existsSync(configuredPath) ? 'usable' : 'not found'})` : 'not set'}`);
console.log(`- resolved pdftotext command: ${command ?? 'not available'}`);
console.log(`- JS fallback available: ${pdfParsePath ? 'yes' : 'no'}`);

if (!command && !pdfParsePath) {
  console.error('No PDF text extractor is available. Run `npm ci` to install pdf-parse, install Poppler, or set PDFTOTEXT_PATH.');
  process.exit(1);
}
