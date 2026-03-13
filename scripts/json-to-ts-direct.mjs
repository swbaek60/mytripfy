import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'fetched-direct-images.json'), 'utf8'));
function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function tsEntry(k, v) {
  return `  '${esc(k)}': '${esc(v)}',`;
}
const lines = [
  '/** Golf, fishing, surfing, skiing, scuba direct image URLs (generated from scripts/fetched-direct-images.json) */',
  '',
  'export const GOLF_DIRECT_IMAGES: Record<string, string> = {',
  ...Object.entries(json.golf || {}).map(([k, v]) => tsEntry(k, v)),
  '};',
  '',
  'export const FISHING_DIRECT_IMAGES: Record<string, string> = {',
  ...Object.entries(json.fishing || {}).map(([k, v]) => tsEntry(k, v)),
  '};',
  '',
  'export const SURFING_DIRECT_IMAGES: Record<string, string> = {',
  ...Object.entries(json.surfing || {}).map(([k, v]) => tsEntry(k, v)),
  '};',
  '',
  'export const SKIING_DIRECT_IMAGES: Record<string, string> = {',
  ...Object.entries(json.skiing || {}).map(([k, v]) => tsEntry(k, v)),
  '};',
  '',
  'export const SCUBA_DIRECT_IMAGES: Record<string, string> = {',
  ...Object.entries(json.scuba || {}).map(([k, v]) => tsEntry(k, v)),
  '};',
];
const outPath = path.join(__dirname, '../src/data/directImagesActivityCategories.ts');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'));
console.log('Wrote', outPath);
