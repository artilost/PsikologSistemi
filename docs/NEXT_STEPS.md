# 🎯 Sonraki Adımlar - Psikolog Sistemi

## 📊 Şu Anki Durum

### ✅ Tamamlanan İşler
- [x] Proje altyapısı (Monorepo, Turborepo, pnpm)
- [x] Docker Compose (PostgreSQL, Redis, MinIO, Keycloak)
- [x] Backend API (NestJS + DDD architecture)
- [x] Frontend (Next.js 15 + App Router)
- [x] Temel JWT authentication
- [x] Role-based authorization
- [x] Swagger dokümantasyonu
- [x] NextAuth v5 entegrasyonu
- [x] Database schema (Prisma)
- [x] Tüm servisler çalışıyor 🎉

### 📦 Çalışan Servisler
| Servis | URL | Durum |
|--------|-----|-------|
| Web Frontend | http://localhost:3000 | 🟢 Running |
| API Backend | http://localhost:3001/api/v1 | 🟢 Running |
| Swagger Docs | http://localhost:3001/api/docs | 🟢 Running |
| Keycloak | http://localhost:8082 | 🟢 Running |
| MinIO Console | http://localhost:9001 | 🟢 Running |
| Adminer | http://localhost:8081 | 🟢 Running |
| PostgreSQL | localhost:5432 | 🟢 Healthy |
| Redis | localhost:6379 | 🟢 Healthy |

---

## 🚀 İlk Yapılacaklar (Öncelik: YÜKSEK)

### 1️⃣ Keycloak Konfigürasyonu (60 dakika)

**Amaç:** Authentication & authorization altyapısını production-ready hale getirmek.

**Adımlar:**
1. Keycloak'a giriş yap: http://localhost:8082 (admin/admin)
2. `psikolog-realm` realm'ini oluştur
3. 2 client oluştur:
   - `psikolog-api` (confidential - backend için)
   - `psikolog-web` (public - frontend için)
4. 5 role oluştur: super-admin, admin, therapist, assistant, client
5. Test kullanıcıları oluştur

**Detaylı Adımlar:**
```bash
# Detaylı guide
cat docs/keycloak/SETUP_GUIDE.md

# Veya quick start
cat docs/QUICK_START.md
```

**Çıktı:**
- ✅ Keycloak realm hazır
- ✅ Client secret alındı ve `.env`'e eklendi
- ✅ Test kullanıcıları ile token alınabilir durumda

---

### 2️⃣ MinIO Bucket Setup (30 dakika)

**Amaç:** Dosya depolama sistemini hazır hale getirmek.

**Adımlar:**
1. MinIO Console'a giriş: http://localhost:9001 (minioadmin/minioadmin)
2. 4 bucket oluştur:
   - `psikolog-avatars` (public read)
   - `psikolog-documents` (private)
   - `psikolog-attachments` (private)
   - `psikolog-backups` (private)
3. `psikolog-avatars` bucket'ını public yap
4. CORS ayarlarını ekle

**Detaylı Adımlar:**
```bash
# Detaylı guide
cat docs/minio/SETUP_GUIDE.md
```

**Çıktı:**
- ✅ Bucket'lar oluşturuldu
- ✅ Access policies ayarlandı
- ✅ CORS konfigürasyonu tamamlandı

---

### 3️⃣ Environment Variables Güncelleme (10 dakika)

**Backend (`apps/api/.env`):**
```env
# Keycloak
KEYCLOAK_BASE_URL=http://localhost:8082
KEYCLOAK_REALM=psikolog-realm
KEYCLOAK_CLIENT_ID=psikolog-api
KEYCLOAK_CLIENT_SECRET=<KEYCLOAK_CREDENTIALS_TAB_DAN_AL>

# MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_AVATARS=psikolog-avatars
S3_BUCKET_DOCUMENTS=psikolog-documents
S3_BUCKET_ATTACHMENTS=psikolog-attachments
S3_BUCKET_BACKUPS=psikolog-backups
```

**Frontend (`apps/web/.env.local`):**
```env
# Keycloak (ileride eklenecek)
KEYCLOAK_CLIENT_ID=psikolog-web
KEYCLOAK_ISSUER=http://localhost:8082/realms/psikolog-realm
```

---

## 🔧 Kodlama Fazı (1-2 Hafta)

### Faz 1: Keycloak Backend Entegrasyonu (4-6 saat)

**Paket Kurulumu:**
```bash
cd apps/api
pnpm add keycloak-connect @nestjs/keycloak-connect
```

**Oluşturulacak Dosyalar:**
```
apps/api/src/infrastructure/keycloak/
  ├── keycloak.module.ts
  ├── keycloak.service.ts
  ├── keycloak-auth.guard.ts
  └── keycloak-roles.guard.ts
```

**Değiştirilecek Dosyalar:**
- `apps/api/src/app.module.ts` - KeycloakModule import
- `apps/api/src/presentation/auth/auth.service.ts` - Keycloak token exchange
- `apps/api/src/presentation/auth/strategies/jwt.strategy.ts` - Keycloak JWT validation

**Implementasyon Hedefleri:**
- [ ] Keycloak adapter konfigürasyonu
- [ ] JWT strategy'yi Keycloak JWT'ye çevirme
- [ ] Role guard'ları Keycloak rolleri ile entegre etme
- [ ] User sync mekanizması (Keycloak ↔ PostgreSQL)
- [ ] Token refresh flow

---

### Faz 2: MinIO/S3 Backend Entegrasyonu (4-5 saat)

**Paket Kurulumu:**
```bash
cd apps/api
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
pnpm add -D @types/multer
```

**Oluşturulacak Dosyalar:**
```
apps/api/src/infrastructure/storage/
  ├── storage.module.ts
  ├── storage.service.ts
  ├── s3-client.service.ts
  └── dto/
      ├── file-upload.dto.ts
      └── file-metadata.dto.ts

apps/api/src/presentation/files/
  ├── files.controller.ts
  ├── files.service.ts
  └── files.module.ts
```

**Prisma Schema Eklentisi:**
```prisma
model File {
  id           String    @id @default(cuid())
  fileName     String
  originalName String
  mimeType     String
  size         Int
  bucket       String
  key          String    // S3 object key
  url          String?
  uploadedBy   String
  user         User      @relation(fields: [uploadedBy], references: [id])
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
  
  @@index([uploadedBy])
  @@index([bucket])
}
```

**Implementasyon Hedefleri:**
- [ ] S3 client service (upload, download, delete)
- [ ] Signed URL generation (güvenli download)
- [ ] File validation (type, size limits)
- [ ] Multipart upload support (büyük dosyalar)
- [ ] File metadata tracking (database)
- [ ] REST endpoints:
  - `POST /api/v1/files/upload`
  - `GET /api/v1/files/:id`
  - `GET /api/v1/files/:id/download` (signed URL)
  - `DELETE /api/v1/files/:id`

---

### Faz 3: Frontend Keycloak Provider (2-3 saat)

**Değiştirilecek Dosya:**
- `apps/web/auth.config.ts`

**Keycloak Provider Ekleme:**
```typescript
import Keycloak from 'next-auth/providers/keycloak';

export const authConfig = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    // Mevcut Credentials provider'ı da tutabilirsiniz (development için)
  ],
  // ... callbacks, etc.
};
```

**Implementasyon Hedefleri:**
- [ ] Keycloak provider konfigürasyonu
- [ ] Token refresh mekanizması
- [ ] Logout flow (Keycloak + NextAuth)
- [ ] Role-based UI rendering
- [ ] Protected routes (middleware güncelleme)

---

### Faz 4: Frontend File Upload (3-4 saat)

**Paket Kurulumu:**
```bash
cd apps/web
pnpm add react-dropzone axios
```

**Oluşturulacak Dosyalar:**
```
apps/web/src/components/shared/
  ├── FileUpload.tsx        # Ana upload component
  ├── DropZone.tsx          # Drag & drop zone
  ├── FilePreview.tsx       # Dosya önizleme
  └── FileList.tsx          # Upload edilen dosyalar listesi

apps/web/src/lib/
  └── file-upload.ts        # Upload utilities
```

**Implementasyon Hedefleri:**
- [ ] Drag & drop file upload
- [ ] Progress indicator
- [ ] File preview (images, PDFs)
- [ ] Multi-file upload
- [ ] Client-side validation
- [ ] Error handling
- [ ] Integration with API endpoints

---

## 📅 Sprint Planı (2 Hafta)

### Week 1: Infrastructure & Auth
**Gün 1-2:** Keycloak & MinIO manuel setup
- Realm, clients, roles
- Buckets, policies

**Gün 3-4:** Backend Keycloak entegrasyonu
- KeycloakModule
- Auth guards
- Token validation

**Gün 5:** Backend MinIO entegrasyonu
- StorageModule
- S3 client
- File endpoints

### Week 2: Frontend & Testing
**Gün 1-2:** Frontend Keycloak
- NextAuth Keycloak provider
- Login flow testing
- Role-based routing

**Gün 3-4:** Frontend File Upload
- Upload component
- Preview & list
- API integration

**Gün 5:** Testing & Documentation
- Integration tests
- E2E tests
- Documentation update

---

## 📚 Kaynaklar ve Dökümanlar

| Döküman | Açıklama | Öncelik |
|---------|----------|---------|
| [QUICK_START.md](./QUICK_START.md) | Hızlı başlangıç (1 saat) | 🔴 YÜKSEK |
| [ROADMAP.md](../ROADMAP.md) | Detaylı yol haritası | 🟠 ORTA |
| [keycloak/SETUP_GUIDE.md](./keycloak/SETUP_GUIDE.md) | Keycloak adım adım | 🔴 YÜKSEK |
| [minio/SETUP_GUIDE.md](./minio/SETUP_GUIDE.md) | MinIO adım adım | 🔴 YÜKSEK |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Mimari detaylar | 🟢 DÜŞÜK |
| [README.md](../README.md) | Proje genel bakış | 🟢 DÜŞÜK |

---

## 🎯 Kısa Vadeli Hedefler (1-2 Hafta)

- [ ] ✅ Keycloak realm & client setup
- [ ] ✅ MinIO bucket & policy setup
- [ ] ⏳ Backend Keycloak entegrasyonu
- [ ] ⏳ Backend MinIO/S3 entegrasyonu
- [ ] ⏳ Frontend Keycloak provider
- [ ] ⏳ Frontend file upload component
- [ ] ⏳ Integration tests
- [ ] ⏳ Documentation update

---

## 🚀 Orta Vadeli Hedefler (2-4 Hafta)

- [ ] Client (Danışan) Management
  - CRUD endpoints
  - Frontend list/detail pages
  - Search & filtering
  
- [ ] Appointment Scheduling
  - Calendar component (FullCalendar)
  - Booking flow
  - Conflict detection
  - Reminders (BullMQ)
  
- [ ] Session Notes
  - Rich text editor
  - Templates
  - Auto-save
  - Encryption (hassas bilgiler)

- [ ] Payment System
  - Invoice generation
  - Payment gateway (iyzico/Stripe)
  - Financial reports

---

## 📈 Başarı Metrikleri

### Technical KPIs
- [ ] Code coverage > 80%
- [ ] API response time < 200ms (p95)
- [ ] Zero critical security vulnerabilities
- [ ] Build time < 5 min
- [ ] Lighthouse score > 90

### Business KPIs
- [ ] User onboarding < 10 min
- [ ] Appointment booking success rate > 95%
- [ ] System uptime > 99.9%
- [ ] User satisfaction > 4.5/5

---

## 🆘 Yardım Lazım Olursa

### Keycloak Sorunları
```bash
# Logları incele
docker logs psikolog-keycloak

# Restart
docker restart psikolog-keycloak

# Realm export (yedek al)
docker exec -it psikolog-keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp --realm psikolog-realm
```

### MinIO Sorunları
```bash
# Logları incele
docker logs psikolog-minio

# Restart
docker restart psikolog-minio

# Health check
curl http://localhost:9000/minio/health/live
```

### Genel Debugging
```bash
# Tüm container'ları restart et
docker-compose restart

# Logları izle (hepsi)
docker-compose logs -f

# Disk kullanımı
docker system df
```

---

## ✨ Önemli Notlar

1. **Keycloak Client Secret**
   - Keycloak'ta oluşturduktan sonra **mutlaka kaydedin**
   - `.env` dosyasına ekleyin
   - Production'da farklı secret kullanın

2. **MinIO Public Bucket**
   - Sadece `psikolog-avatars` public olmalı
   - Diğer bucket'lar private kalmalı
   - Signed URL kullanın

3. **Environment Variables**
   - `.env` dosyaları `.gitignore`'da
   - Production'da farklı değerler kullanın
   - Secret'ları asla commit etmeyin

4. **Database Migrations**
   - Her schema değişikliğinde migration oluşturun
   - Migration'ları test edin
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name add_file_model
   ```

5. **Testing**
   - Her yeni feature için test yazın
   - Integration test'ler önemli
   - E2E testler kritik flow'lar için

---

## 🎉 Final Checklist

Kodlamaya başlamadan önce:
- [ ] ✅ Tüm Docker container'lar çalışıyor
- [ ] ✅ Keycloak realm oluşturuldu
- [ ] ✅ Keycloak clients oluşturuldu
- [ ] ✅ Keycloak roles oluşturuldu
- [ ] ✅ MinIO buckets oluşturuldu
- [ ] ✅ MinIO CORS ayarlandı
- [ ] ✅ Environment variables güncellendi
- [ ] ✅ API health check başarılı
- [ ] ✅ Keycloak token test edildi
- [ ] ✅ MinIO erişim test edildi

**Tümü tamamlandıysa → Kodlamaya başlayabilirsiniz! 🚀**

---

**Oluşturulma Tarihi:** 18 Kasım 2025  
**Son Güncelleme:** 18 Kasım 2025  
**Durum:** ✅ Hazır - Manuel setup aşamasında

