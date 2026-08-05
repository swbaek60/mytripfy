# Windows 작업 스케줄러 — 마케팅 AI 일일 실행 (IG + Shorts 초안 + 리포트)
# powershell -ExecutionPolicy Bypass -File scripts/install-marketing-windows-task.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BatPath = Join-Path $PSScriptRoot "run-marketing-daily.bat"
$TaskName = "MyTripfy-Marketing-Daily"

if (-not (Test-Path $BatPath)) {
  Write-Error "run-marketing-daily.bat not found"
}

# SNS 직후 07:15 — 캡션 생성과 겹치지 않게
$Trigger = New-ScheduledTaskTrigger -Daily -At "07:15"
$Action = New-ScheduledTaskAction -Execute $BatPath -WorkingDirectory $ProjectRoot
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null

Write-Host "등록 완료: $TaskName"
Write-Host "  매일 07:15 — $BatPath"
Write-Host "  산출: scripts\out\marketing\"
Write-Host ""
Write-Host "주간(블로그+커뮤니티)은 수동 또는 GH Actions:"
Write-Host "  npm run marketing:weekly"
Write-Host "  npm run marketing:launch"
