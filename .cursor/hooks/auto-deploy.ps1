param()

$ErrorActionPreference = "Stop"

# Consume hook payload from stdin (not required for this automation).
try {
  [void][Console]::In.ReadToEnd()
} catch {
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$repoRoot = Split-Path -Parent $repoRoot
$lockPath = Join-Path $repoRoot ".cursor/hooks/.auto-deploy.lock"
$logPath = Join-Path $repoRoot ".cursor/hooks/auto-deploy.log"

if (Test-Path $lockPath) {
  Write-Output '{"additional_context":"Auto-deploy skipped: already running."}'
  exit 0
}

New-Item -Path $lockPath -ItemType File -Force | Out-Null

try {
  $startStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $logPath -Value "[$startStamp] Auto-deploy started"

  Push-Location $repoRoot
  try {
    npm run build *>> $logPath
    if ($LASTEXITCODE -ne 0) {
      Add-Content -Path $logPath -Value "[$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")] Build failed"
      Write-Output '{"additional_context":"Auto-deploy: build failed. Check .cursor/hooks/auto-deploy.log"}'
      exit 0
    }

    npx wrangler deploy *>> $logPath
    if ($LASTEXITCODE -ne 0) {
      Add-Content -Path $logPath -Value "[$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")] Deploy failed"
      Write-Output '{"additional_context":"Auto-deploy: deploy failed. Check .cursor/hooks/auto-deploy.log"}'
      exit 0
    }
  } finally {
    Pop-Location
  }

  Add-Content -Path $logPath -Value "[$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")] Auto-deploy succeeded"
  Write-Output '{"additional_context":"Auto-deploy done (build + deploy)."}'
  exit 0
} finally {
  Remove-Item -Path $lockPath -Force -ErrorAction SilentlyContinue
}
