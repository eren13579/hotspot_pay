# ══════════════════════════════════════════════════════════════════════════════
# HotspotPay — Backup automatisé PostgreSQL (les deux bases)
# Usage: .\backup-db.ps1 [output_dir]
# ══════════════════════════════════════════════════════════════════════════════

param(
    [string]$OutputDir = "$env:USERPROFILE\hotspotpay-backups"
)

$ErrorActionPreference = "Stop"

# ── Config ────────────────────────────────────────────────────────────────────
$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD

if (-not $DB_HOST) { $DB_HOST = "localhost" }
if (-not $DB_PORT) { $DB_PORT = "5432" }
if (-not $DB_USER) { $DB_USER = "postgres" }
if (-not $DB_PASSWORD) { $DB_PASSWORD = "Teda@2003" }

$DATABASES = @("hotspotPay_V2", "hotspot_fastapi")
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$RETENTION_DAYS = 7

# ── Create output directory ────────────────────────────────────────────────────
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "✓ Répertoire créé : $OutputDir"
}

# ── Find pg_dump ────────────────────────────────────────────────────────────────
$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue
if (-not $pgDump) {
    # Common PostgreSQL paths
    $paths = @(
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { $pgDump = $p; break }
    }
    if (-not $pgDump) {
        Write-Host "✗ pg_dump introuvable. Installez PostgreSQL Client ou ajoutez-le au PATH."
        exit 1
    }
}

Write-Host "╔══════════════════════════════════════════════════════╗"
Write-Host "║    HotspotPay — Backup PostgreSQL                   ║"
Write-Host "╚══════════════════════════════════════════════════════╝"
Write-Host ""

# ── Backup each database ───────────────────────────────────────────────────────
$env:PGPASSWORD = $DB_PASSWORD

foreach ($db in $DATABASES) {
    $filename = "backup_${db}_${TIMESTAMP}.sql"
    $filepath = Join-Path $OutputDir $filename
    $compressPath = "${filepath}.gz"

    Write-Host "[$db] Backup en cours..." -ForegroundColor Yellow

    try {
        if ($pgDump -is [System.Management.Automation.CommandInfo]) {
            & $pgDump.Source -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db --format=custom --verbose --file=$compressPath 2>&1
        } else {
            & $pgDump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db --format=custom --verbose --file=$compressPath 2>&1
        }

        if ($LASTEXITCODE -eq 0) {
            # Get file size
            $size = (Get-Item $compressPath).Length
            $sizeStr = "{0:N2} MB" -f ($size / 1MB)
            Write-Host "  ✓ $db → $compressPath ($sizeStr)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $db — pg_dump a échoué (code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ $db — Erreur : $_" -ForegroundColor Red
    }
}

Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue

# ── Cleanup old backups ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Nettoyage des backups > $RETENTION_DAYS jours..." -ForegroundColor Yellow
$cutoff = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem $OutputDir -Filter "backup_*.sql.gz" | Where-Object {
    $_.LastWriteTime -lt $cutoff
} | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "  Supprimé : $($_.Name)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "✓ Backup terminé. Répertoire : $OutputDir" -ForegroundColor Cyan
