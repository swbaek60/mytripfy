# Windows 작업 스케줄러에 SNS 일일 자동 실행 등록
# 관리자 권한 불필요 (현재 사용자)
# 실행: powershell -ExecutionPolicy Bypass -File scripts/install-sns-windows-task.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BatPath = Join-Path $PSScriptRoot "run-sns-auto.bat"
$TaskName = "MyTripfy-SNS-Daily"

if (-not (Test-Path $BatPath)) {
  Write-Error "run-sns-auto.bat not found"
}

# 매일 오전 7시 (로컬 시간)
$Trigger = New-ScheduledTaskTrigger -Daily -At "07:00"
$Action = New-ScheduledTaskAction -Execute $BatPath -WorkingDirectory $ProjectRoot
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null

Write-Host "등록 완료: $TaskName"
Write-Host "  매일 07:00 — $BatPath"
Write-Host "  로그: scripts\out\sns-auto.log"
Write-Host ""
Write-Host "지금 바로 테스트:"
Write-Host "  $BatPath"
