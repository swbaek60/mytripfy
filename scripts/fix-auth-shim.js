const fs = require('fs')
const path = require('path')

const files = [
  'src/app/[locale]/challenges/disputes/[certUserId]/[challengeId]/page.tsx',
  'src/app/[locale]/sponsors/[id]/edit/page.tsx',
  'src/app/[locale]/messages/group/[id]/page.tsx',
  'src/app/[locale]/messages/[id]/page.tsx',
  'src/app/[locale]/companions/[id]/edit/page.tsx',
  'src/app/[locale]/trips/[id]/edit/page.tsx',
  'src/app/[locale]/trips/page.tsx',
  'src/app/[locale]/reviews/write/page.tsx',
  'src/app/[locale]/dashboard/page.tsx',
  'src/app/[locale]/profile/page.tsx',
  'src/app/[locale]/notifications/page.tsx',
  'src/app/[locale]/bookmarks/page.tsx',
  'src/app/[locale]/privacy/page.tsx',
  'src/app/[locale]/challenges/feed/page.tsx',
  'src/app/[locale]/sponsors/mine/page.tsx',
  'src/app/[locale]/companions/new/page.tsx',
  'src/app/[locale]/reviews/mine/page.tsx',
  'src/app/[locale]/guides/requests/new/page.tsx',
  'src/app/[locale]/profile/edit/page.tsx',
  'src/app/[locale]/guides/requests/page.tsx',
  'src/app/[locale]/trips/new/page.tsx',
  'src/app/[locale]/sponsors/page.tsx',
  'src/app/[locale]/challenges/guide/page.tsx',
  'src/app/[locale]/trips/[id]/page.tsx',
  'src/app/[locale]/personality/page.tsx',
  'src/app/[locale]/hall-of-fame/page.tsx',
  'src/app/[locale]/messages/page.tsx',
  'src/app/[locale]/guides/requests/[id]/edit/page.tsx',
  'src/app/[locale]/sponsors/new/page.tsx',
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

  // 2. const { data: { user } } = await supabase.auth.getUser() 패턴 교체
  const patterns = [
    {
      from: /const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g,
      to: 'const authUser = await getAuthUser()\n  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null'
    },
    {
      from: /const\s*\{\s*data:\s*\{\s*user:\s*currentUser\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g,
      to: 'const authUser = await getAuthUser()\n  const currentUser = authUser ? { id: authUser.profileId, email: authUser.email } : null'
    },
    {
      from: /const\s*\{\s*data:\s*\{\s*user:\s*authUserData\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g,
      to: 'const authUser = await getAuthUser()\n  const authUserData = authUser ? { id: authUser.profileId, email: authUser.email } : null'
    },
  ]

  for (const { from, to } of patterns) {
    if (from.test(content)) {
      content = content.replace(from, to)
      changed = true
    }
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
