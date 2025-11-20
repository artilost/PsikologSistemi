# ⚡ Quick Start Guide - Psikolog Sistemi

## 🎯 Bu Rehber Neyi Kapsıyor?

Bu döküman, projenin **ilk 2 saatte** yapılması gereken kritik adımları içerir:
1. ✅ Keycloak realm ve client setup
2. ✅ MinIO bucket ve policy setup
3. ✅ Environment variables konfigürasyonu
4. ✅ İlk test kullanıcısı oluşturma

---

## 📋 Ön Gereksinimler

```bash
# Tüm servisler çalışıyor olmalı
docker ps

# Beklenen output:
# - psikolog-postgres (healthy)
# - psikolog-redis (healthy)
# - psikolog-minio (healthy)
# - psikolog-keycloak (running)
# - psikolog-adminer (running)

# Eğer servisler çalışmıyorsa:
docker-compose up -d
```

---

## 🔐 ADIM 1: Keycloak Setup (30 dakika)

### 1.1 Keycloak'a Giriş
```
http://localhost:8082
Username: admin
Password: admin
```

### 1.2 Realm Oluştur
1. Sol üst **Master** → **Create Realm**
2. **Realm name:** `psikolog-realm`
3. **Create**

### 1.3 Client Oluştur (Backend API)
1. **Clients** → **Create client**
```yaml
Client ID: psikolog-api
Client type: OpenID Connect
Client authentication: ON
```

2. **Settings** tab:
```yaml
Valid redirect URIs: http://localhost:3001/*, http://localhost:3000/*
Web origins: http://localhost:3001, http://localhost:3000
```

3. **Credentials** tab → **Client secret** kopyala → `.env`'e ekle

### 1.4 Client Oluştur (Frontend Web)
1. **Clients** → **Create client**
```yaml
Client ID: psikolog-web
Client type: OpenID Connect
Client authentication: OFF (public)
```

2. **Settings**:
```yaml
Valid redirect URIs: http://localhost:3000/*
Web origins: http://localhost:3000
```

### 1.5 Rolleri Oluştur
**Realm roles** → Her biri için **Create role**:
- `super-admin` - Tam erişim
- `admin` - Yönetici
- `therapist` - Terapist
- `assistant` - Asistan
- `client` - Danışan

### 1.6 Test Kullanıcısı
**Users** → **Add user**:
```yaml
Username: test.therapist
Email: therapist@test.com
Email verified: ON
First name: Test
Last name: Therapist
```

**Credentials** tab → Set password:
```yaml
Password: Test123!
Temporary: OFF
```

**Role mapping** tab → Assign role: `therapist`

✅ **Keycloak Hazır!**

---

## 📦 ADIM 2: MinIO Setup (20 dakika)

### 2.1 MinIO Console Giriş
```
http://localhost:9001
Username: minioadmin
Password: minioadmin
```

### 2.2 Bucket'ları Oluştur

**Buckets** → **Create Bucket** (4 kez tekrarla):

```yaml
1. psikolog-avatars (Versioning: OFF)
2. psikolog-documents (Versioning: ON)
3. psikolog-attachments (Versioning: OFF)
4. psikolog-backups (Versioning: ON)
```

### 2.3 Public Access (Sadece Avatarlar İçin)

1. **psikolog-avatars** bucket'ına tıkla
2. **Anonymous** tab → **Add Access Rule**
```yaml
Prefix: *
Access: readonly
```

### 2.4 CORS Ayarları (Her bucket için)

**Bucket** → **Settings** → **CORS**:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedOrigin>http://localhost:3001</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

### 2.5 Service Account (Opsiyonel - Önerilen)

**Identity** → **Service Accounts** → **Create Service Account**:
```yaml
Access Key: psikolog-api-service
Description: Backend API
Policy: readwrite
```

Oluşturulan **Secret Key**'i kaydet!

✅ **MinIO Hazır!**

---

## ⚙️ ADIM 3: Environment Variables (10 dakika)

### 3.1 Backend API Environment

`apps/api/.env` dosyasını düzenleyin:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psikolog_sistemi?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Mevcut sistem - yakında Keycloak'a geçecek)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Keycloak
KEYCLOAK_BASE_URL=http://localhost:8082
KEYCLOAK_REALM=psikolog-realm
KEYCLOAK_CLIENT_ID=psikolog-api
KEYCLOAK_CLIENT_SECRET=<COPIED_FROM_KEYCLOAK_CREDENTIALS_TAB>
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# MinIO / S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1
S3_BUCKET_AVATARS=psikolog-avatars
S3_BUCKET_DOCUMENTS=psikolog-documents
S3_BUCKET_ATTACHMENTS=psikolog-attachments
S3_BUCKET_BACKUPS=psikolog-backups
S3_USE_SSL=false
S3_FORCE_PATH_STYLE=true

# App
NODE_ENV=development
APP_PORT=3001
APP_API_PREFIX=api/v1

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 3.2 Frontend Environment

`apps/web/.env.local` dosyası zaten mevcut, kontrol edin:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3001

# Keycloak (İleriki adımlarda eklenecek)
KEYCLOAK_CLIENT_ID=psikolog-web
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ISSUER=http://localhost:8082/realms/psikolog-realm
```

✅ **Environment Hazır!**

---

## 🧪 ADIM 4: Test & Verification (10 dakika)

### 4.1 Backend API Test

```bash
# API health check
curl http://localhost:3001/api/v1/health

# Swagger docs
open http://localhost:3001/api/docs

# Login test (mevcut JWT sistem)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@psikolog.com",
    "password": "admin123"
  }'
```

### 4.2 Keycloak Token Test

```bash
curl -X POST http://localhost:8082/realms/psikolog-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=psikolog-api" \
  -d "client_secret=<YOUR_CLIENT_SECRET>" \
  -d "grant_type=password" \
  -d "username=test.therapist" \
  -d "password=Test123!"
```

**Başarılı response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 604800,
  "refresh_token": "...",
  "token_type": "Bearer"
}
```

### 4.3 MinIO Test

```bash
# Public avatar erişimi (önce Console'dan bir test.jpg yükleyin)
curl http://localhost:9000/psikolog-avatars/test.jpg

# Private document (403 dönmeli)
curl http://localhost:9000/psikolog-documents/private.pdf
# Expected: Access Denied
```

### 4.4 Frontend Test

```bash
# Next.js'i başlat (başka terminal'de)
cd apps/web
pnpm dev

# Tarayıcıda aç
open http://localhost:3000

# Login sayfasına git
open http://localhost:3000/login

# Test kullanıcısı ile giriş yap
# Email: admin@psikolog.com (eğer veritabanında varsa)
# veya Swagger'dan yeni kullanıcı kaydet
```

✅ **Tüm Testler Başarılı!**

---

## 📚 Sonraki Adımlar (Öncelik Sırasına Göre)

### Hemen Yapılacaklar (Bu Hafta)

#### 1. Backend Keycloak Entegrasyonu
```bash
cd apps/api
pnpm add @nestjs/keycloak-connect keycloak-connect
```

Dosyalar:
- `apps/api/src/infrastructure/keycloak/keycloak.module.ts`
- `apps/api/src/infrastructure/keycloak/keycloak.service.ts`
- `apps/api/src/infrastructure/keycloak/keycloak-auth.guard.ts`

**Tahmini Süre:** 4-6 saat

#### 2. Backend MinIO/S3 Entegrasyonu
```bash
cd apps/api
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Dosyalar:
- `apps/api/src/infrastructure/storage/storage.module.ts`
- `apps/api/src/infrastructure/storage/storage.service.ts`
- `apps/api/src/presentation/files/files.controller.ts`

**Tahmini Süre:** 4-5 saat

#### 3. Frontend Keycloak Provider
```bash
cd apps/web
pnpm add next-auth
```

Dosya:
- `apps/web/auth.config.ts` (güncelleme - Keycloak provider ekle)

**Tahmini Süre:** 2-3 saat

#### 4. File Upload Component
```bash
cd apps/web
pnpm add react-dropzone
```

Dosyalar:
- `apps/web/src/components/shared/FileUpload.tsx`
- `apps/web/src/components/shared/DropZone.tsx`

**Tahmini Süre:** 3-4 saat

---

### Orta Vadeli (Gelecek 2 Hafta)

1. **Client Management** (Danışan Yönetimi)
   - CRUD endpoints
   - Frontend list/detail pages
   - Search & filtering
   - **Süre:** 8-10 saat

2. **Appointment System** (Randevu Sistemi)
   - Calendar component
   - Booking flow
   - Conflict detection
   - **Süre:** 10-12 saat

3. **Session Notes** (Seans Notları)
   - Rich text editor
   - Templates
   - Auto-save
   - **Süre:** 8-10 saat

---

### Uzun Vadeli (1-2 Ay)

1. Payment system
2. Notifications (email, SMS, push)
3. Reporting & analytics
4. Mobile app (React Native)
5. Multi-tenancy

---

## 🗺️ Detaylı Yol Haritası

Tüm özelliklerin detaylı planı için:
```bash
# Yol haritasını incele
cat ROADMAP.md

# Keycloak detayları
cat docs/keycloak/SETUP_GUIDE.md

# MinIO detayları
cat docs/minio/SETUP_GUIDE.md
```

---

## 🆘 Sorun Giderme

### Keycloak Başlamıyor
```bash
docker logs psikolog-keycloak
docker restart psikolog-keycloak
```

### MinIO Erişilemiyor
```bash
docker logs psikolog-minio
docker restart psikolog-minio
```

### API Build Hatası
```bash
cd apps/api
pnpm install
pnpm build
```

### Frontend Hydration Error
```bash
# Cache temizle
cd apps/web
rm -rf .next
pnpm dev
```

---

## 📞 Yardım & Dokümantasyon

| Kaynak | Açıklama | Link |
|--------|----------|------|
| 📖 README | Proje genel bakış | `README.md` |
| 🏗️ Architecture | Mimari detaylar | `ARCHITECTURE.md` |
| 🗺️ Roadmap | Detaylı yol haritası | `ROADMAP.md` |
| 🔐 Keycloak Setup | Keycloak adımları | `docs/keycloak/SETUP_GUIDE.md` |
| 📦 MinIO Setup | MinIO adımları | `docs/minio/SETUP_GUIDE.md` |
| 🐛 Troubleshooting | Sorun giderme | Her guide'ın sonunda |

---

## ✅ Checklist

Setup tamamlandığında işaretleyin:

- [ ] ✅ Docker container'ları çalışıyor
- [ ] ✅ Keycloak realm oluşturuldu (psikolog-realm)
- [ ] ✅ Keycloak client'ları oluşturuldu (psikolog-api, psikolog-web)
- [ ] ✅ Keycloak rolleri oluşturuldu (5 adet)
- [ ] ✅ Test kullanıcısı oluşturuldu
- [ ] ✅ MinIO bucket'ları oluşturuldu (4 adet)
- [ ] ✅ Avatar bucket public yapıldı
- [ ] ✅ MinIO CORS ayarlandı
- [ ] ✅ Backend .env dosyası güncellendi
- [ ] ✅ Frontend .env.local dosyası kontrol edildi
- [ ] ✅ API health check başarılı
- [ ] ✅ Keycloak token alındı
- [ ] ✅ MinIO erişim test edildi
- [ ] ✅ Frontend login sayfası çalışıyor

**Tüm checklistler tamamlandıysa → Keycloak/MinIO entegrasyonu kodlamaya başlayabilirsiniz! 🚀**

---

**Oluşturulma:** 18 Kasım 2025  
**Tahmini Tamamlama Süresi:** 60-90 dakika  
**Zorluk:** 🟡 Orta

