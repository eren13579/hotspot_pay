Start-Process -FilePath "python" -ArgumentList "-u","-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8765" -WorkingDirectory "F:\Teda patrick\HOSPOT-FASTAPI-SERVICE" -NoNewWindow
Start-Sleep -Seconds 4

Write-Host "=== 1. SANS cle ==="
$r = Invoke-WebRequest -Uri "http://127.0.0.1:8765/api/v1/router/actions/create" -Method POST -ContentType "application/json" -Body '{"hotspotId":"x","actionType":"CREATE_USER","username":"u","password":"p"}' -UseBasicParsing -ErrorAction SilentlyContinue
Write-Host "Status: $($r.StatusCode)"
Write-Host "Body: $($r.Content)"

Write-Host "`n=== 2. AVEC cle ==="
$h = @{ "x-api-key" = "dev-api-key-change-in-production" }
$r = Invoke-WebRequest -Uri "http://127.0.0.1:8765/api/v1/router/actions/create" -Method POST -ContentType "application/json" -Body '{"hotspotId":"x","actionType":"CREATE_USER","username":"u","password":"p"}' -Headers $h -UseBasicParsing -ErrorAction SilentlyContinue
Write-Host "Status: $($r.StatusCode)"
Write-Host "Body: $($r.Content)"

Write-Host "`n=== 3. Health ==="
$r = Invoke-WebRequest -Uri "http://127.0.0.1:8765/health" -UseBasicParsing
Write-Host "Status: $($r.StatusCode)"
Write-Host "Body: $($r.Content)"

Stop-Process -Name python -ErrorAction SilentlyContinue
