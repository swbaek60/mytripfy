#!/usr/bin/env node
/**
 * Apply a blog draft JSON into the site (en + ko + blog-articles.ts)
 *
 *   node scripts/marketing-agent/apply-blog-draft.mjs --slug=find-companion-seoul
 *   node scripts/marketing-agent/apply-blog-draft.mjs --all
 */
import fs from 'fs'
import path from 'path'
import { OUT_BLOG, ROOT } from './lib/paths.mjs'

function parseArgs() {
  let slug = null
  let all = false
  for (const a of process.argv.slice(2)) {
    if (a === '--all') all = true
    if (a.startsWith('--slug=')) slug = a.slice(7)
  }
  return { slug, all }
}

function loadDraft(slug) {
  const p = path.join(OUT_BLOG, `${slug}.json`)
  if (!fs.existsSync(p)) throw new Error(`Draft not found: ${p}`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function listDraftSlugs() {
  if (!fs.existsSync(OUT_BLOG)) return []
  return fs
    .readdirSync(OUT_BLOG)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
}

function updateBlogArticles(slug, publishedAt) {
  const file = path.join(ROOT, 'src', 'data', 'blog-articles.ts')
  let src = fs.readFileSync(file, 'utf8')
  if (src.includes(`'${slug}'`)) {
    console.log(`blog-articles already has ${slug}`)
    return
  }
  src = src.replace(
    /(export const BLOG_SLUGS = \[[\s\S]*?)(\] as const)/,
    (m, a, b) => {
      const trimmed = a.replace(/,\s*$/, '')
      return `${trimmed},\n  '${slug}',\n${b}`
    }
  )
  src = src.replace(
    /(export const BLOG_PUBLISHED_AT: Record<BlogSlug, string> = \{)([\s\S]*?)(\n\})/,
    (m, open, body, close) => {
      const cleaned = body.replace(/,(\s*,)+/g, ',').replace(/,\s*$/, '')
      return `${open}${cleaned},\n  '${slug}': '${publishedAt}',${close}`
    }
  )
  // Normalize any accidental double commas
  src = src.replace(/,(\s*),+/g, ',')
  fs.writeFileSync(file, src, 'utf8')
  console.log(`updated blog-articles.ts ← ${slug}`)
}

function mergeMessages(locale, slug, fields) {
  const file = path.join(ROOT, 'messages', `${locale}.json`)
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!data.Blog) data.Blog = {}
  data.Blog[slug] = fields
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`updated messages/${locale}.json ← Blog.${slug}`)
}

/** Fill other locales with EN fallback so static params do not MISSING_MESSAGE */
function mergeEnFallbackOtherLocales(slug, enFields) {
  const dir = path.join(ROOT, 'messages')
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json') || f === 'en.json' || f === 'ko.json') continue
    const file = path.join(dir, f)
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!data.Blog) data.Blog = {}
    if (data.Blog[slug]) continue
    data.Blog[slug] = enFields
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log(`fallback EN → messages/${f} Blog.${slug}`)
  }
}

function applyOne(slug) {
  const draft = loadDraft(slug)
  updateBlogArticles(draft.slug, draft.publishedAt || new Date().toISOString().slice(0, 10))
  mergeMessages('en', draft.slug, draft.en)
  mergeMessages('ko', draft.slug, draft.ko)
  mergeEnFallbackOtherLocales(draft.slug, draft.en)
}

function main() {
  const { slug, all } = parseArgs()
  if (!slug && !all) {
    console.error('Usage: --slug=<slug> | --all')
    process.exit(1)
  }
  const slugs = all ? listDraftSlugs() : [slug]
  if (!slugs.length) {
    console.error('No drafts in', OUT_BLOG)
    process.exit(1)
  }
  for (const s of slugs) applyOne(s)
  console.log('Done. Run blog:merge-translations for other locales if needed.')
  console.log('Tip: sitemap imports BLOG_SLUGS — rebuild picks up new paths.')
}

main()
