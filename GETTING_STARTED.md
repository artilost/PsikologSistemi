# 🚀 Getting Started - Psikolog Sistemi

## 👋 Hoş Geldiniz!

Bu proje **lead-level** bir psikoloji pratiği yönetim sistemidir. Tüm altyapı hazır ve serviler çalışıyor durumda! 🎉

---

## ✅ Şu Anda Çalışan Servisler

| Servis | URL | Giriş Bilgileri |
|--------|-----|-----------------|
| 🌐 **Web Frontend** | http://localhost:3000 | - |
| 🔧 **API Backend** | http://localhost:3001/api/v1 | - |
| 📚 **Swagger Docs** | http://localhost:3001/api/docs | - |
| 🔐 **Keycloak** | http://localhost:8082 | admin / admin |
| 📦 **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| 💾 **Adminer (DB UI)** | http://localhost:8081 | postgres / postgres |
| 🐘 **PostgreSQL** | localhost:5432 | - |
| 🔴 **Redis** | localhost:6379 | - |

---

## 🎯 Yapmanız Gereken İlk Adımlar

Şu anda **Manuel Konfigürasyon Aşamasındasınız**. Kodlamaya başlamadan önce:

### ⚡ Hızlı Başlangıç (60-90 dakika)

```bash
# 1. Quick Start dökümanını okuyun
cat docs/QUICK_START.md

# 2. Keycloak setup (30 dk)
# http://localhost:8082 adresine gidin
# docs/keycloak/SETUP_GUIDE.md dosyasını takip edin

# 3. MinIO setup (20 dk)
# http://localhost:9001 adresine gidin
# docs/minio/SETUP_GUIDE.md dosyasını takip edin

# 4. Environment variables güncelleyin (10 dk)
# apps/api/.env dosyasına Keycloak client secret ekleyin
```

---

## 📚 Döküman Hiyerarşisi

### 🔴 Öncelik 1: Hemen Okunacaklar

1. **[QUICK_START.md](docs/QUICK_START.md)** - 60 dakika
   - Tüm manuel setup adımları
   - Keycloak realm, client, role kurulumu
   - MinIO bucket ve policy ayarları
   - Environment variables
   - Test & verification

2. **[Keycloak SETUP_GUIDE.md](docs/keycloak/SETUP_GUIDE.md)** - 30 dakika
   - Detaylı Keycloak adımları
   - Realm export/import
   - Token test komutları
   - Troubleshooting

3. **[MinIO SETUP_GUIDE.md](docs/minio/SETUP_GUIDE.md)** - 20 dakika
   - Detaylı MinIO adımları
   - Bucket policies
   - CORS konfigürasyonu
   - Test komutları

### 🟠 Öncelik 2: Kodlamaya Başlarken

4. **[NEXT_STEPS.md](docs/NEXT_STEPS.md)** - 15 dakika
   - Sonraki 1-2 haftalık plan
   - Kod dosyaları ve lokasyonları
   - Sprint planı
   - Hedefler ve metrikler

5. **[ROADMAP.md](ROADMAP.md)** - 30 dakika
   - Detaylı feature roadmap
   - Tüm modüller (Client, Appointment, Payment, etc.)
   - Tahmini süreler
   - Teknoloji stack detayları

### 🟢 Öncelik 3: Referans

6. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Referans
   - Mimari detaylar
   - DDD patterns
   - Database schema
   - Veri akışları

7. **[README.md](README.md)** - Genel Bakış
   - Proje özeti
   - Hızlı kurulum
   - Current status

---

## 🎓 Öğrenme Yolu

### Yeni Başlayanlar İçin

```
1. README.md (5 dk) → Projeyi tanıyın
2. QUICK_START.md (60 dk) → Setup yapın
3. Test edin → Servislerin çalıştığını doğrulayın
4. NEXT_STEPS.md (15 dk) → Ne yapacağınızı öğrenin
5. Kodlamaya başlayın! 🚀
```

### Deneyimli Geliştiriciler İçin

```
1. README.md (2 dk) → Tech stack'i kontrol edin
2. ARCHITECTURE.md (10 dk) → Mimariyi anlayın
3. QUICK_START.md → Manuel setup (60 dk)
4. ROADMAP.md (15 dk) → Feature planını inceleyin
5. Direkt kodlamaya geçin! 💻
```

---

## 🔧 Manuel Setup Checklist

Aşağıdaki adımları tamamlayın:

### Keycloak (30 dakika)
- [ ] Keycloak'a giriş yaptım (http://localhost:8082)
- [ ] `psikolog-realm` realm'ini oluşturdum
- [ ] `psikolog-api` client'ı oluşturdum (confidential)
- [ ] `psikolog-web` client'ı oluşturdum (public)
- [ ] 5 rolü oluşturdum (super-admin, admin, therapist, assistant, client)
- [ ] Test kullanıcısı oluşturdum (test.therapist / Test123!)
- [ ] Token test ettim (curl ile)
- [ ] Client secret'ı `apps/api/.env` dosyasına ekledim

### MinIO (20 dakika)
- [ ] MinIO Console'a giriş yaptım (http://localhost:9001)
- [ ] 4 bucket oluşturdum:
  - [ ] `psikolog-avatars` (public read)
  - [ ] `psikolog-documents` (private)
  - [ ] `psikolog-attachments` (private)
  - [ ] `psikolog-backups` (private)
- [ ] `psikolog-avatars` bucket'ını public yaptım
- [ ] Her bucket'a CORS ayarı ekledim
- [ ] Test dosyası yükledim ve erişim test ettim

### Environment Variables (10 dakika)
- [ ] `apps/api/.env` dosyasını kontrol ettim
- [ ] Keycloak client secret'ı ekledim
- [ ] MinIO credentials'ları doğruladım
- [ ] `apps/web/.env.local` dosyasını kontrol ettim

### Verification (10 dakika)
- [ ] API health check başarılı: `curl http://localhost:3001/api/v1/health`
- [ ] Keycloak token aldım: `curl -X POST http://localhost:8082/realms/psikolog-realm/protocol/openid-connect/token ...`
- [ ] MinIO public avatar erişimi başarılı
- [ ] Swagger docs açılıyor: http://localhost:3001/api/docs
- [ ] Frontend login sayfası açılıyor: http://localhost:3000/login

---

## 🚀 Setup Tamamlandıktan Sonra

### Kodlamaya Başlama (Sırasıyla)

#### 1. Keycloak Backend Entegrasyonu (4-6 saat)
```bash
cd apps/api
pnpm add keycloak-connect @nestjs/keycloak-connect

# Yeni modül oluştur
nest g module infrastructure/keycloak
nest g service infrastructure/keycloak
```

Dosyalar:
- `apps/api/src/infrastructure/keycloak/keycloak.module.ts`
- `apps/api/src/infrastructure/keycloak/keycloak.service.ts`
- `apps/api/src/infrastructure/keycloak/keycloak-auth.guard.ts`

#### 2. MinIO/S3 Backend Entegrasyonu (4-5 saat)
```bash
cd apps/api
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

nest g module infrastructure/storage
nest g service infrastructure/storage
nest g module presentation/files
nest g controller presentation/files
```

Dosyalar:
- `apps/api/src/infrastructure/storage/storage.service.ts`
- `apps/api/src/presentation/files/files.controller.ts`

#### 3. Frontend Keycloak Provider (2-3 saat)
- `apps/web/auth.config.ts` güncelle (Keycloak provider ekle)

#### 4. Frontend File Upload Component (3-4 saat)
```bash
cd apps/web
pnpm add react-dropzone
```

Dosyalar:
- `apps/web/src/components/shared/FileUpload.tsx`
- `apps/web/src/components/shared/DropZone.tsx`

---

## 📊 İlerleme Takibi

### Şu An: Phase 0 - Infrastructure Setup ✅
- [x] Docker Compose setup
- [x] All services running
- [x] Database migrations
- [x] Basic JWT auth
- [x] NextAuth integration
- [ ] **Keycloak manual setup** ← BURADAYIZ
- [ ] **MinIO manual setup** ← BURADAYIZ

### Sonraki: Phase 1 - Keycloak & MinIO Integration (1-2 hafta)
- [ ] Backend Keycloak adapter
- [ ] Backend S3 client
- [ ] Frontend Keycloak provider
- [ ] File upload components

### Gelecek: Phase 2 - Core Features (2-4 hafta)
- [ ] Client management
- [ ] Appointment system
- [ ] Session notes
- [ ] Payment system

---

## 🆘 Yardım

### Sorunlarla Karşılaşırsanız

**Keycloak başlamıyor:**
```bash
docker logs psikolog-keycloak
docker restart psikolog-keycloak
```

**MinIO erişilemiyor:**
```bash
docker logs psikolog-minio
docker restart psikolog-minio
```

**API build hatası:**
```bash
cd apps/api
pnpm install
pnpm build
```

**Tüm servisleri restart:**
```bash
docker-compose restart
```

### Döküman İçinde Arama

```bash
# Keycloak ile ilgili her şey
cat docs/keycloak/SETUP_GUIDE.md

# MinIO ile ilgili her şey
cat docs/minio/SETUP_GUIDE.md

# Sonraki adımlar
cat docs/NEXT_STEPS.md

# Detaylı roadmap
cat ROADMAP.md
```

---

## 💡 Hızlı Komutlar

```bash
# Projeyi başlat
pnpm start

# API'yi tek başına çalıştır
cd apps/api && pnpm dev

# Frontend'i tek başına çalıştır
cd apps/web && pnpm dev

# Database migration oluştur
cd apps/api && pnpm prisma migrate dev --name migration_name

# Database'i görüntüle
cd apps/api && pnpm prisma studio

# Docker loglarını izle
docker-compose logs -f

# Container'ları yeniden başlat
docker-compose restart
```

---

## 🎉 Başarı Kriterleri

Setup başarılı sayılır:
- ✅ Tüm servisler çalışıyor
- ✅ Keycloak realm ve client'lar oluşturuldu
- ✅ MinIO bucket'lar hazır
- ✅ Environment variables güncellendi
- ✅ Test kullanıcısı ile token alınabiliyor
- ✅ API ve Frontend birbirleriyle konuşuyor
- ✅ Swagger docs erişilebilir

**Tümü tamam mı? → Kodlamaya başlayabilirsiniz! 🚀**

---

## 📞 İletişim & Destek

- 📖 Dokümantasyon: `docs/` klasörü
- 🐛 Issue tracking: GitHub Issues (varsa)
- 💬 Team communication: (Slack/Discord vb.)

---

**Projeye hoş geldiniz! İyi geliştirmeler! 🎊**

**Son Güncelleme:** 18 Kasım 2025  
**Versiyon:** 1.0.0  
**Durum:** 🟡 Infrastructure Setup Required

