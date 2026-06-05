'use client'

const STORAGE_KEY = 'mytripfy-recent-companions'
const MAX_ITEMS = 8

export interface RecentCompanion {
  id: string
  title: string
  country: string
  viewedAt: number
}

export function getRecentCompanions(): RecentCompanion[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentCompanion[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export function addRecentCompanion(item: Omit<RecentCompanion, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentCompanions().filter(c => c.id !== item.id)
    const next: RecentCompanion[] = [{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
