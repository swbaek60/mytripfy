const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '../supabase');
const CAT_HEADERS = { surfing: '-- SURFING', skiing: '-- SKIING', scuba: '-- SCUBA' };
function extractFromSection(sql, cat) {
  const titles = [];
  const header = CAT_HEADERS[cat];
  const start = sql.indexOf(header);
  const end = sql.indexOf('\n-- ', start + 1);
  const section = start >= 0 ? (end >= 0 ? sql.slice(start, end) : sql.slice(start)) : sql;
  const re = new RegExp("\\('" + cat + "','[^']*','([^']*(?:''[^']*)*)'", 'g');
  let m;
  while ((m = re.exec(section)) !== null) {
    titles.push(m[1].replace(/''/g, "'"));
  }
  return titles;
}
const out = {};
const v6 = fs.readFileSync(path.join(base, 'schema-v6-fix.sql'), 'utf8');
out.surfing = extractFromSection(v6, 'surfing');
out.skiing = extractFromSection(v6, 'skiing');
out.scuba = extractFromSection(v6, 'scuba');
const v16 = fs.readFileSync(path.join(base, 'schema-v16.sql'), 'utf8');
out.golf = [];
let m;
const golfRe = /\('golf','[^']*','([^']*(?:''[^']*)*)'/g;
while ((m = golfRe.exec(v16)) !== null) out.golf.push(m[1].replace(/''/g, "'"));
const merged = fs.readFileSync(path.join(base, 'schema-merged-v14-to-v18.sql'), 'utf8');
const fishSection = merged.slice(merged.indexOf("('fishing'"), merged.indexOf("\n('", merged.indexOf("('fishing'") + 1) + 1 || merged.length);
out.fishing = [];
const fishRe = /\('fishing','[^']*','([^']*(?:''[^']*)*)'/g;
while ((m = fishRe.exec(merged)) !== null) out.fishing.push(m[1].replace(/''/g, "'"));
fs.writeFileSync(path.join(__dirname, 'category-titles.json'), JSON.stringify(out, null, 2));
console.log('Counts:', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
