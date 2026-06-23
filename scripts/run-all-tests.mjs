import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

process.env.STRICT_REPORT_LOCALE_CHECK ??= 'true';
process.env.NODE_ENV ??= 'test';


function normalizeRequestedTestPath(file) {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

const rawRequestedFiles = process.argv.slice(2).map(normalizeRequestedTestPath).filter(Boolean);

const testsDir = new URL('../tests/', import.meta.url);
function collect(dirUrl, relativePrefix = 'tests') {
  const entries = readdirSync(dirUrl, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const rel = join(relativePrefix, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) out.push(...collect(new URL(entry.name + '/', dirUrl), rel));
    else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx') || entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx')) out.push(rel);
  }
  return out;
}

const allFiles = collect(testsDir).sort();
if (allFiles.length === 0) {
  console.error('No test files found in tests/**/*.test.ts, tests/**/*.test.tsx, tests/**/*.spec.ts or tests/**/*.spec.tsx');
  process.exit(1);
}

const priorityFiles = [
  'tests/allSamplesReportReadinessSmoke.test.ts',
  'tests/businessSamplesRegistry.test.ts',
  'tests/sampleQuestionsStrictLocale.test.ts',
  'tests/sampleSpecificQuestionUniqueness.test.ts',
  'tests/interviewSemanticDeduplication.test.ts',
  'tests/bakeryRevenueReportRegression.test.ts',
  'tests/localeStrictValidator.test.ts',
  'tests/reportLocalization.test.ts',
  'tests/reportLocalizationNoEnglishLeakage.test.ts',
  'tests/exportStrictLocaleArtifacts.test.ts',
  'tests/aiGeneratedQuestionPostValidation.test.ts',
  'tests/unknownBusinessAIFallback.test.ts',
  'tests/pdfExport.test.ts',
  'tests/excelExport.test.ts',
  'tests/reportExportLocale.test.ts',
  'tests/reportExportRoutes.test.ts',
  'tests/financialFormulaConsistency.test.ts',
  'tests/financialConsistencyAllBusinessModels.test.ts',
  'tests/unknownBusinessFinancialConsistency.test.ts',
  'tests/financialCalculator.test.ts',
  'tests/scoringService.test.ts'
];

const allSet = new Set(allFiles);
const requestAliases = new Map([
  ['tests/actualExcelAllSamplesQualityRegression.test.ts', /^tests[\/]actualExcelAllSamplesQualityRegression\.part\d+\.test\.ts$/],
  ['tests/actualPdfAllSamplesQualityRegression.test.ts', /^tests[\/]actualPdfAllSamplesQualityRegression\.part\d+\.test\.ts$/]
]);
const requestedFiles = Array.from(new Set(rawRequestedFiles.flatMap((file) => {
  const aliasPattern = requestAliases.get(file);
  if (!aliasPattern) return [file];
  return allFiles.filter((candidate) => aliasPattern.test(candidate)).sort();
})));
const unknownRequestedFiles = requestedFiles.filter((file) => !allSet.has(file));
if (unknownRequestedFiles.length) {
  console.error(`Requested test file(s) not found: ${unknownRequestedFiles.join(', ')}`);
  process.exit(1);
}
const orderedFiles = requestedFiles.length
  ? requestedFiles
  : [
      ...priorityFiles.filter((file) => allSet.has(file)),
      ...allFiles.filter((file) => !priorityFiles.includes(file))
    ];

function runNodeTests(label, files) {
  if (!files.length) return;
  console.log(`\n--- ${label}: ${files.length} files ---`);
  const result = spawnSync(process.execPath, ['scripts/run-node-tests.mjs', ...files], {
    cwd: new URL('..', import.meta.url),
    env: process.env,
    stdio: 'inherit',
    shell: false
  });
  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status ?? 'timeout or signal'}${result.signal ? ` (${result.signal})` : ''}`);
    process.exit(result.status ?? 1);
  }
}

const startedAt = Date.now();
const chunkSize = Number(process.env.TEST_REMAINING_CHUNK_SIZE || process.env.TEST_CHUNK_SIZE || 4);
const isolatedPattern = /actual(?:Pdf|Excel)AllSamplesQualityRegression\.part\d+\.test\.ts$/;
const chunks = [];
for (let index = 0; index < orderedFiles.length;) {
  const current = orderedFiles[index];
  if (isolatedPattern.test(current)) {
    chunks.push([current]);
    index += 1;
    continue;
  }
  const chunk = [];
  while (index < orderedFiles.length && chunk.length < chunkSize && !isolatedPattern.test(orderedFiles[index])) {
    chunk.push(orderedFiles[index]);
    index += 1;
  }
  if (chunk.length) chunks.push(chunk);
}
const totalChunks = chunks.length;
console.log(requestedFiles.length
  ? `Running requested node:test file(s): ${orderedFiles.length} test files`
  : `Running full node:test suite: ${orderedFiles.length} test files`);
for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
  const chunk = chunks[chunkIndex];
  const label = requestedFiles.length ? `requested file chunk ${chunkIndex + 1}/${totalChunks}` : `full suite chunk ${chunkIndex + 1}/${totalChunks}`;
  runNodeTests(label, chunk);
}

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(requestedFiles.length
  ? `\nRequested node:test file(s) passed: ${orderedFiles.length}/${orderedFiles.length} files, failed = 0, duration = ${seconds}s`
  : `\nFull node:test suite passed: ${orderedFiles.length}/${allFiles.length} files, failed = 0, duration = ${seconds}s`);
