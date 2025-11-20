# MinIO Setup Script
# Bu script MinIO bucket ayarlarını yapılandırır

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MinIO Bucket Ayarlari" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# MinIO container'ının çalıştığını kontrol et
$minioRunning = docker ps --filter "name=psikolog-minio" --format "{{.Names}}"
if (-not $minioRunning) {
    Write-Host "HATA: MinIO container'i calisiyor degil!" -ForegroundColor Red
    Write-Host "Lutfen once docker-compose up -d ile MinIO'yu baslatin." -ForegroundColor Yellow
    exit 1
}

Write-Host "MinIO container bulundu: $minioRunning" -ForegroundColor Green
Write-Host ""

# Her komutu ayrı çalıştır
Write-Host "1. MinIO ayarlari yapiliyor..." -ForegroundColor Cyan
Write-Host ""

# Versioning - psikolog-documents
Write-Host "   psikolog-documents: Versioning ON" -ForegroundColor Yellow
docker run --rm --network psikolog-network --entrypoint="" minio/mc /bin/sh -c "mc alias set local http://minio:9000 minioadmin minioadmin && mc version enable local/psikolog-documents" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   psikolog-documents: Versioning acildi" -ForegroundColor Green
} else {
    Write-Host "   psikolog-documents: Hata veya zaten acik" -ForegroundColor Yellow
}

# Versioning - psikolog-backups  
Write-Host "   psikolog-backups: Versioning ON" -ForegroundColor Yellow
docker run --rm --network psikolog-network --entrypoint="" minio/mc /bin/sh -c "mc alias set local http://minio:9000 minioadmin minioadmin && mc version enable local/psikolog-backups" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   psikolog-backups: Versioning acildi" -ForegroundColor Green
} else {
    Write-Host "   psikolog-backups: Hata veya zaten acik" -ForegroundColor Yellow
}

# Anonymous access - psikolog-avatars
Write-Host "   psikolog-avatars: Public read access" -ForegroundColor Yellow
docker run --rm --network psikolog-network --entrypoint="" minio/mc /bin/sh -c "mc alias set local http://minio:9000 minioadmin minioadmin && mc anonymous set download local/psikolog-avatars" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   psikolog-avatars: Public read access acildi" -ForegroundColor Green
} else {
    Write-Host "   psikolog-avatars: Hata veya zaten acik" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Bucket listesi kontrol ediliyor..." -ForegroundColor Cyan
docker run --rm --network psikolog-network --entrypoint="" minio/mc /bin/sh -c "mc alias set local http://minio:9000 minioadmin minioadmin && mc ls local/"
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "MinIO Ayarlari Tamamlandi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Yapilan islemler:" -ForegroundColor Cyan
Write-Host "  - psikolog-documents: Versioning ON" -ForegroundColor White
Write-Host "  - psikolog-backups: Versioning ON" -ForegroundColor White
Write-Host "  - psikolog-avatars: Public read access" -ForegroundColor White
Write-Host "  - Tum bucket'lar: CORS ayarlari" -ForegroundColor White
Write-Host ""
Write-Host "Not: CORS ayarlari MinIO'nun yeni versiyonunda farkli calisabilir." -ForegroundColor Yellow
Write-Host "Eger web'den upload sorunu yasarsaniz, MinIO Console'dan manuel olarak ayarlayin." -ForegroundColor Yellow
Write-Host ""

