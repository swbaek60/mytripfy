/**
 * Fetches image URLs for golf, fishing, surfing, skiing, scuba via Wikipedia/Commons.
 * Run: node scripts/fetch-wiki-direct.mjs
 * Output: scripts/fetched-direct-images.json (category -> { titleEn -> url })
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HINTS = { golf: 'golf course', fishing: 'fishing', surfing: 'surfing wave', skiing: 'ski resort', scuba: 'scuba diving' };
const DELAY = 150;

async function wikiSummary(title) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'MyTripfy/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data?.thumbnail?.source;
    return src ? src.replace(/\/\d+px-/, '/640px-') : null;
  } catch { return null; }
}

async function getFirstSearchResultTitle(query) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`,
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'MyTripfy/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.query?.search?.[0]?.title ?? null;
  } catch { return null; }
}

async function getPageImageFromTitle(articleTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=640&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'MyTripfy/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const src = page?.thumbnail?.source;
    return src ? src.replace(/\/\d+px-/, '/640px-') : null;
  } catch { return null; }
}

async function findWikiImage(titleEn, searchHint) {
  const base = titleEn.replace(/\u2018|\u2019/g, "'").trim();
  const shortForm = base.includes(',') ? base.split(',')[0].trim() : base;
  const withHint = searchHint ? `${base} ${searchHint}` : base;

  let url = await wikiSummary(base);
  if (url) return url;
  if (shortForm !== base) {
    url = await wikiSummary(shortForm);
    if (url) return url;
  }
  const articleTitle = await getFirstSearchResultTitle(withHint)
    ?? await getFirstSearchResultTitle(base)
    ?? (shortForm !== base ? await getFirstSearchResultTitle(shortForm) : null);
  if (articleTitle) {
    url = await getPageImageFromTitle(articleTitle);
    if (url) return url;
  }
  return null;
}

const MAX_PER_CAT = parseInt(process.env.MAX_PER_CAT || '0', 10) || 9999;

async function main() {
  const titlesPath = path.join(__dirname, 'category-titles.json');
  const data = JSON.parse(fs.readFileSync(titlesPath, 'utf8'));
  const result = { golf: {}, fishing: {}, surfing: {}, skiing: {}, scuba: {} };
  for (const [cat, titles] of Object.entries(data)) {
    if (!HINTS[cat] || !Array.isArray(titles)) continue;
    const list = titles.slice(0, MAX_PER_CAT);
    console.log(`Fetching ${list.length} images for ${cat}...`);
    for (let i = 0; i < list.length; i++) {
      const title = list[i];
      const url = await findWikiImage(title, HINTS[cat]);
      if (url) result[cat][title] = url;
      if ((i + 1) % 10 === 0) console.log(`  ${cat}: ${i + 1}/${list.length}`);
      await new Promise(r => setTimeout(r, DELAY));
    }
  }
  const outPath = path.join(__dirname, 'fetched-direct-images.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('Wrote', outPath);
  const counts = Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Object.keys(v).length]));
  console.log('Counts:', counts);
}

main().catch(console.error);
