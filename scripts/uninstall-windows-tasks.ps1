# Windows 작업 스케줄러에 등록된 MyTripfy 자동 실행 작업을 모두 제거한다.
# powershell -ExecutionPolicy Bypass -File scripts/uninstall-windows-tasks.ps1

$ErrorActionPreference = "Stop"

$TaskNames = @(
  "MyTripfy-SNS-Daily",
  "MyTripfy-Marketing-Daily"
)

$removed = 0
foreach ($name in $TaskNames) {
  $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
  if ($null -eq $task) {
    Write-Host "건너뜀 (등록되어 있지 않음): $name"
    continue
  }

  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Host "제거 완료: $name"
  $removed++
}

Write-Host ""
Write-Host "총 $removed 개 작업을 제거했습니다."
Write-Host "GitHub Actions 스케줄도 비활성화되어 있으므로, 이제 자동 실행되는 작업은 없습니다."
Write-Host "필요할 때 수동 실행:"
Write-Host "  npm run sns:auto          # SNS 캡션/이미지 생성"
Write-Host "  npm run marketing:daily   # 숏폼 훅 + 리포트"
Write-Host "  npm run marketing:weekly  # 블로그 + 커뮤니티 초안"
