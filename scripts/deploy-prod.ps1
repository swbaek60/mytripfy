# deploy-prod.ps1
# .env.local의 VERCEL_TOKEN/ORG_ID/PROJECT_ID를 읽어 프로젝트 전용 토큰으로 배포
# 전역 vercel login 상태와 무관하게 동작

$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Error ".env.local 파일을 찾을 수 없습니다: $envFile"
    exit 1
}

# .env.local 파싱 (# 주석, 빈 줄 제외)
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$token     = $envVars['VERCEL_TOKEN']
$orgId     = $envVars['VERCEL_ORG_ID']
$projectId = $envVars['VERCEL_PROJECT_ID']

if (-not $token -or $token -eq 'vca_xxxx') {
    Write-Error "VERCEL_TOKEN이 .env.local에 설정되지 않았습니다."
    exit 1
}
if (-not $orgId -or -not $projectId) {
    Write-Error "VERCEL_ORG_ID 또는 VERCEL_PROJECT_ID가 .env.local에 설정되지 않았습니다."
    exit 1
}

$repoRoot = Join-Path $PSScriptRoot ".."
$vercelIgnore = Join-Path $repoRoot ".vercelignore"
if (-not (Test-Path $vercelIgnore)) {
    Write-Error ".vercelignore 가 없습니다. scripts/out 제외 설정이 필요합니다: $vercelIgnore"
    exit 1
}
$ignoreContent = Get-Content $vercelIgnore -Raw
if ($ignoreContent -notmatch 'scripts/out') {
    Write-Error ".vercelignore 에 scripts/out 제외 규칙이 없습니다."
    exit 1
}

Write-Host "▶ Vercel 프로덕션 배포 시작 (프로젝트 전용 토큰)" -ForegroundColor Cyan
Write-Host "  Org ID     : $orgId"
Write-Host "  Project ID : $projectId"
Write-Host "  업로드 제외: scripts/out/ (.vercelignore)" -ForegroundColor DarkGray

# VERCEL_ORG_ID / VERCEL_PROJECT_ID 환경변수도 함께 설정 (vercel CLI가 참조)
$env:VERCEL_ORG_ID     = $orgId
$env:VERCEL_PROJECT_ID = $projectId

Push-Location $repoRoot
try {
    npx vercel --prod --yes --token $token
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    Write-Error "배포 실패 (exit code: $exitCode)"
    exit $exitCode
}

Write-Host "✅ 배포 완료" -ForegroundColor Green
