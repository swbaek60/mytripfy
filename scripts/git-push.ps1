# git-push.ps1
# .env.local의 GH_TOKEN을 읽어 프로젝트 전용 PAT로 git push
# 전역 gh auth login 상태와 무관하게 동작

$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Error ".env.local 파일을 찾을 수 없습니다: $envFile"
    exit 1
}

# .env.local 파싱
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $envVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$ghToken = $envVars['GH_TOKEN']
$owner   = $envVars['GH_REPO_OWNER']
$repo    = $envVars['GH_REPO_NAME']

if (-not $ghToken -or $ghToken -eq 'ghp_xxxx') {
    Write-Error "GH_TOKEN이 .env.local에 설정되지 않았습니다.`nhttps://github.com/settings/tokens/new 에서 PAT를 발급한 뒤 .env.local에 입력하세요."
    exit 1
}
if (-not $owner -or -not $repo) {
    Write-Error "GH_REPO_OWNER 또는 GH_REPO_NAME이 .env.local에 설정되지 않았습니다."
    exit 1
}

# remote URL을 토큰 포함 HTTPS 형식으로 임시 변경
$tokenUrl = "https://$ghToken@github.com/$owner/$repo.git"
$prevUrl  = (git remote get-url origin 2>&1)

Write-Host "▶ git push (프로젝트 전용 PAT 사용)" -ForegroundColor Cyan
Write-Host "  Repo: $owner/$repo"

git remote set-url origin $tokenUrl

# GH_TOKEN / GITHUB_TOKEN 환경변수도 설정 (gh CLI 등 참조)
$env:GH_TOKEN     = $ghToken
$env:GITHUB_TOKEN = $ghToken

git push origin HEAD

$exitCode = $LASTEXITCODE

# remote URL을 원래 값으로 복원 (토큰이 .git/config에 남지 않도록)
git remote set-url origin $prevUrl

if ($exitCode -ne 0) {
    Write-Error "git push 실패 (exit code: $exitCode)"
    exit $exitCode
}

Write-Host "✅ git push 완료" -ForegroundColor Green
