# ══════════════════════════════════════════════════════════════════════════════
# HotspotPay — Script de démarrage unifié (dev)
# 1. Charge les variables depuis .env
# 2. Démarre FastAPI + Java Spring Boot
# 3. Attend que les deux soient prêts
# Usage: .\start-dev.ps1
# ══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$FASTAPI_DIR = "C:\Teda patrick\HOSPOT-FASTAPI-SERVICE"
$JAVA_DIR    = "C:\Teda patrick\Hospot\mvp-final-v2"
$FASTAPI_PORT = 8444
$JAVA_PORT    = 8080

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     HotspotPay — Démarrage des services ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 0. Charger le .env ──────────────────────────────────────────────────────
$EnvFile = Join-Path $JAVA_DIR ".env"
if (Test-Path $EnvFile) {
    Write-Host "[0/3] Chargement de .env..." -ForegroundColor Yellow
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and $line -notmatch '^#' -and $line -match '^([^=]+)=(.*)') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") { $value = $matches[1] }
            if (-not (Test-Path "env:$key")) {
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Host "  ✓ .env chargé" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ .env introuvable — utilisation des fallbacks properties" -ForegroundColor Yellow
}

# ── 1. FastAPI ───────────────────────────────────────────────────────────────
Write-Host "[1/3] Démarrage de FastAPI (port $FASTAPI_PORT)..." -ForegroundColor Yellow
$fastapiProcess = Start-Process -NoNewWindow -FilePath "python" -ArgumentList @(
    "-m", "uvicorn", "app.main:app",
    "--host", "0.0.0.0",
    "--port", $FASTAPI_PORT,
    "--reload"
) -WorkingDirectory $FASTAPI_DIR -PassThru

# Wait for FastAPI health
$fastapiReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 1500
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$FASTAPI_PORT/health" -Method GET -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) {
            $fastapiReady = $true
            Write-Host "  ✓ FastAPI prêt sur http://localhost:$FASTAPI_PORT" -ForegroundColor Green
            Write-Host "    Swagger: http://localhost:$FASTAPI_PORT/docs" -ForegroundColor DarkGray
            break
        }
    } catch { }
}
if (-not $fastapiReady) {
    Write-Host "  ✗ FastAPI ne répond pas après 30s — vérifiez les logs" -ForegroundColor Red
    exit 1
}

# ── 2. Java ─────────────────────────────────────────────────────────────────
Write-Host "[2/3] Démarrage de Java Spring Boot (port $JAVA_PORT)..." -ForegroundColor Yellow
$javaProcess = Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList @(
    "/c", "cd /d `"$JAVA_DIR`" && set SPRING_PROFILES_ACTIVE=dev && .\mvnw.cmd spring-boot:run -q"
) -PassThru

# Wait for Java health
$javaReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 3000
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$JAVA_PORT/api/V1/actuator/health" -Method GET -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 503) {
            $javaReady = $true
            break
        }
    } catch { }
}
if ($javaReady) {
    Write-Host "  ✓ Java prêt sur http://localhost:$JAVA_PORT/api/V1" -ForegroundColor Green
    Write-Host "    Swagger: http://localhost:$JAVA_PORT/swagger-ui/index.html" -ForegroundColor DarkGray
} else {
    Write-Host "  ✗ Java ne répond pas après 90s — vérifiez les logs" -ForegroundColor Red
}

# ── 3. Résumé ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Résumé des services                     ║" -ForegroundColor Cyan
Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Cyan
if ($fastapiReady) {
    Write-Host "║  FastAPI :  http://localhost:$FASTAPI_PORT  ✓ ║" -ForegroundColor Green
} else {
    Write-Host "║  FastAPI :  http://localhost:$FASTAPI_PORT  ✗ ║" -ForegroundColor Red
}
if ($javaReady) {
    Write-Host "║  Java :    http://localhost:$JAVA_PORT/api/V1  ✓ ║" -ForegroundColor Green
} else {
    Write-Host "║  Java :    http://localhost:$JAVA_PORT/api/V1  ✗ ║" -ForegroundColor Red
}
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "[3/3] Appuyez sur Ctrl+C pour tout arrêter." -ForegroundColor Gray

try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    Write-Host "`nArrêt des services..." -ForegroundColor Yellow
    if ($javaProcess -and !$javaProcess.HasExited) { $javaProcess.Kill() }
    if ($fastapiProcess -and !$fastapiProcess.HasExited) { $fastapiProcess.Kill() }
    Write-Host "Services arrêtés." -ForegroundColor Cyan
}
