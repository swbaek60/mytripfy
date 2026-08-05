import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, '..', '..', '..')
export const SCRIPTS = path.join(ROOT, 'scripts')
export const OUT_ROOT = path.join(SCRIPTS, 'out', 'marketing')
export const OUT_BLOG = path.join(OUT_ROOT, 'blog')
export const OUT_COMMUNITY = path.join(OUT_ROOT, 'community')
export const OUT_LAUNCH = path.join(OUT_ROOT, 'launch')
export const OUT_SHORTS = path.join(OUT_ROOT, 'shorts')
export const OUT_REPORTS = path.join(OUT_ROOT, 'reports')
export const SITE_URL = 'https://www.mytripfy.com'
