import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'client/src/assets/i18n', `${name}.json`), 'utf8'));
function flatten(object, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string') result[prefix + key] = value;
    else flatten(value, prefix + key + '.', result);
  }
  return result;
}
const en = flatten(read('en')), sr = flatten(read('sr'));
const failures = [];
const parameters = value => [...value.matchAll(/{{\s*([\w]+)\s*}}/g)].map(m => m[1]).sort().join(',');
for (const key of new Set([...Object.keys(en), ...Object.keys(sr)])) {
  if (!en[key]?.trim() || !sr[key]?.trim()) failures.push(`Missing or empty translation: ${key}`);
  else if (parameters(en[key]) !== parameters(sr[key])) failures.push(`Interpolation mismatch: ${key}`);
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const used = new Set();
for (const file of files(path.join(root, 'client/src/app')).filter(f => /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts'))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/['"]([A-Z][A-Z_]+\.[A-Za-z0-9_.]+)['"]/g)) {
    if (!match[1].endsWith('.')) used.add(match[1]);
  }
}
for (const key of used) if (!en[key] || !sr[key]) failures.push(`Interface references an untranslated key: ${key}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Translations OK: ${Object.keys(en).length} matching Serbian/English entries; ${used.size} interface keys checked.`);
