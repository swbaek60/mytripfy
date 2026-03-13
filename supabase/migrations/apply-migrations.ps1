# Supabase 마이그레이션 적용 스크립트
# 1. 터미널에서 한 번만: npx supabase login  (브라우저에서 로그인)
# 2. 이 스크립트 실행: .\apply-migrations.ps1

$ProjectRef = "kvvsttqlpablawsjgjiv"
Set-Location $PSScriptRoot\..\..

Write-Host "Linking project..." -ForegroundColor Cyan
npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "Link failed. Run 'npx supabase login' first and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Pushing migrations..." -ForegroundColor Cyan
npx supabase db push
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Done." -ForegroundColor Green
