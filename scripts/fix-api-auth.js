const fs = require('fs')
const path = require('path')

const files = [
  'src/app/api/notifications/route.ts',
  'src/app/api/profile/completeness/route.ts',
  'src/app/api/sponsors/[id]/route.ts',
  'src/app/api/sponsors/[id]/visits/route.ts',
  'src/app/api/group-chat/messages/route.ts',
  'src/app/api/challenges/vote/route.ts',
  'src/app/api/sponsors/visit/update/route.ts',
  'src/app/api/challenges/certs/route.ts',
  'src/app/api/companion/apply/route.ts',
  'src/app/api/sponsors/visit/route.ts',
  'src/app/api/sponsors/visit/dispute/route.ts',
  'src/app/api/sponsors/route.ts',
  'src/app/api/companion/application-status/route.ts',
  'src/app/api/challenges/dispute/route.ts',
]

let fixed = 0
let skipped = 0

for (const relPath of files) {
  const fullPath = path.join(process.cwd(), relPath)
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`)
    skipped++
    continue
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let changed = false

  // 1. import 문에 getAuthUser 추가
  if (content.includes("from '@/utils/supabase/server'") && !content.includes('getAuthUser')) {
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@\/utils\/supabase\/server'/,
      (match, imports) => {
        const trimmed = imports.trim()
        return `import { ${trimmed}, getAuthUser } from '@/utils/supabase/server'`
      }
    )
    changed = true
  }

  // 2. user 취득 패턴 교체 - API route는 여러 줄에 걸쳐 있을 수 있음
  // Pattern: const { data: { user } } = await supabase.auth.getUser()
  //          if (!user) return NextResponse.json(...)
  const getUserPattern = /const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g
  if (getUserPattern.test(content)) {
    content = content.replace(
      /const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g,
      'const authUser = await getAuthUser()\n    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null'
    )
    changed = true
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`FIXED: ${relPath}`)
    fixed++
  } else {
    console.log(`NO_CHANGE: ${relPath}`)
    skipped++
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`)
