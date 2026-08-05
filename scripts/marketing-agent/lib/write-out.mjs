import fs from 'fs'
import path from 'path'

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function writeText(filePath, content) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

export function writeJson(filePath, data) {
  return writeText(filePath, JSON.stringify(data, null, 2) + '\n')
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function appendLog(filePath, line) {
  ensureDir(path.dirname(filePath))
  fs.appendFileSync(filePath, `[${new Date().toISOString()}] ${line}\n`, 'utf8')
}
