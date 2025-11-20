# Keycloak Token Test Script
# PowerShell'de calistirin: .\test-keycloak-token.ps1

# .env dosyasindan KEYCLOAK_CLIENT_SECRET'i oku
$envFile = "apps/api/.env"
if (-not (Test-Path $envFile)) {
    Write-Host "HATA: $envFile dosyasi bulunamadi!" -ForegroundColor Red
    exit 1
}

# .env dosyasini oku ve KEYCLOAK_CLIENT_SECRET'i bul
$clientSecret = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^KEYCLOAK_CLIENT_SECRET=(.+)$") {
        $clientSecret = $matches[1].Trim()
    }
}

if (-not $clientSecret) {
    Write-Host "HATA: KEYCLOAK_CLIENT_SECRET .env dosyasinda bulunamadi!" -ForegroundColor Red
    Write-Host "Lutfen apps/api/.env dosyasina KEYCLOAK_CLIENT_SECRET=... ekleyin" -ForegroundColor Yellow
    exit 1
}

Write-Host "Client Secret bulundu!" -ForegroundColor Green
Write-Host ""
Write-Host "Token aliniyor..." -ForegroundColor Cyan

# Token istegi
$uri = "http://localhost:8082/realms/psikolog-realm/protocol/openid-connect/token"
$body = "client_id=psikolog-api&client_secret=$clientSecret&grant_type=password&username=test.therapist&password=Test123!"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/x-www-form-urlencoded" -Body $body

    Write-Host ""
    Write-Host "BASARILI! Token alindi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token Bilgileri:" -ForegroundColor Cyan
    $tokenPreview = $response.access_token.Substring(0, [Math]::Min(50, $response.access_token.Length))
    Write-Host "   Access Token: $tokenPreview..." -ForegroundColor White
    Write-Host "   Expires In: $($response.expires_in) saniye" -ForegroundColor White
    Write-Host "   Token Type: $($response.token_type)" -ForegroundColor White
    Write-Host ""
    Write-Host "Keycloak setup tamamlandi!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "HATA: Token alinamadi!" -ForegroundColor Red
    Write-Host "Hata Detayi: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

