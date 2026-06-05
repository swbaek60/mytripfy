# SNS 비밀키 한 번 입력 → secrets/ 저장 → .env.sns 갱신
# 실행: powershell -ExecutionPolicy Bypass -File scripts/prompt-sns-secrets.ps1

$Root = Split-Path -Parent $PSScriptRoot
$Secrets = Join-Path $Root "secrets"
if (-not (Test-Path $Secrets)) { New-Item -ItemType Directory -Path $Secrets | Out-Null }

function Save-Line($file, $prompt, $optional) {
  if ($optional) {
    $v = Read-Host "$prompt (Enter=건너뜀)"
    if ([string]::IsNullOrWhiteSpace($v)) { return }
  } else {
    $v = Read-Host $prompt
    if ([string]::IsNullOrWhiteSpace($v)) {
      Write-Host "필수 값입니다."
      exit 1
    }
  }
  Set-Content -Path (Join-Path $Secrets $file) -Value $v.Trim() -NoNewline -Encoding UTF8
  Write-Host "  저장: secrets/$file"
}

Write-Host "`n=== SNS 비밀키 설정 (화면에 키가 표시될 수 있음) ===`n"
Save-Line "gemini.txt" "Google AI Studio Key (AIza...) — Nano Banana, 무료한도 권장" $true
Save-Line "openai.txt" "OpenAI API Key (sk-..., 유료)" $true
Save-Line "meta-token.txt" "Meta Access Token (인스타 게시)" $true
Save-Line "instagram-sua-id.txt" "Instagram Sua User ID" $true
Save-Line "instagram-ethan-id.txt" "Instagram Ethan User ID" $true

Push-Location $Root
node --env-file=.env.local scripts/setup-sns-from-local.mjs
Pop-Location

Write-Host "`n완료. 테스트: npm run sns:auto:publish`n"
