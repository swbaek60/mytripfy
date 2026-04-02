/**
 * Capacitor webDir(`out`) — 원격 server.url만 쓰더라도 sync 시 디렉터리가 필요함.
 * 최소 index.html만 두고 실제 콘텐츠는 WebView가 로드함.
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'out')
const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>mytripfy</title>
  <style>
    html,body{margin:0;height:100%;background:#f8fafc;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;color:#1d4ed8;}
  </style>
</head>
<body>
  <p>Loading…</p>
</body>
</html>
`

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'index.html'), index, 'utf8')
console.log('Capacitor webDir ready:', outDir)
