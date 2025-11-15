# 🚀 Kurulum Rehberi

## Gereksinimler

- **Node.js:** 20.x veya üzeri
- **pnpm:** 9.x veya üzeri
- **Docker & Docker Compose:** En güncel sürüm
- **Git:** Versiyon kontrolü için

## 📦 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

```bash
# pnpm kurulumu (eğer yoksa)
npm install -g pnpm@9

# Proje bağımlılıklarını yükle
pnpm install
```

### 2. Altyapı Servislerini Başlatın

```bash
# PostgreSQL, Redis, MinIO, Keycloak servislerini başlat
docker-compose up -d

# Servislerin çalıştığını kontrol et
docker-compose ps
```

### 3. Ortam Değişkenlerini Ayarlayın

```bash
# Backend için
cp apps/api/.env.example apps/api/.env

# Frontend için
cp apps/web/.env.example apps/web/.env.local
```

`.env` dosyalarını düzenleyin ve gerekli değerleri girin.

### 4. Veritabanını Hazırlayın

```bash
# Prisma Client oluştur
pnpm --filter @psikolog/api db:generate

# Veritabanı şemasını oluştur
pnpm --filter @psikolog/api db:push

# (Opsiyonel) Seed data ekle
pnpm --filter @psikolog/api db:seed
```

### 5. Geliştirme Sunucularını Başlatın

```bash
# Tüm uygulamaları paralel başlat
pnpm dev
```

Uygulamalar şu adreslerde çalışacak:
- **Frontend (Next.js):** http://localhost:3000
- **Backend API (NestJS):** http://localhost:3001
- **API Docs (Swagger):** http://localhost:3001/api/docs
- **Database Admin (Adminer):** http://localhost:8081
- **MinIO Console:** http://localhost:9001
- **Keycloak Admin:** http://localhost:8080

## 🔧 Geliştirme Komutları

```bash
# Geliştirme modunda çalıştır
pnpm dev

# Tüm projeyi derle
pnpm build

# Lint kontrolü
pnpm lint

# Tip kontrolü
pnpm type-check

# Testleri çalıştır
pnpm test

# Tüm cache'leri temizle
pnpm clean
```

## 📂 Özel Paket Komutları

### Backend (API)

```bash
# Backend'i derle
pnpm --filter @psikolog/api build

# Backend'i geliştirme modunda çalıştır
pnpm --filter @psikolog/api dev

# Prisma Studio (database GUI)
pnpm --filter @psikolog/api db:studio

# Migration oluştur
pnpm --filter @psikolog/api db:migrate

# Testleri çalıştır
pnpm --filter @psikolog/api test
```

### Frontend (Web)

```bash
# Frontend'i derle
pnpm --filter @psikolog/web build

# Frontend'i geliştirme modunda çalıştır
pnpm --filter @psikolog/web dev

# Production modunda başlat
pnpm --filter @psikolog/web start
```

## 🐳 Docker ile Çalıştırma

### Development

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

### Production Build

```bash
# Backend image'ını oluştur
docker build -f apps/api/Dockerfile -t psikolog-api:latest .

# Frontend image'ını oluştur
docker build -f apps/web/Dockerfile -t psikolog-web:latest .

# Çalıştır
docker run -p 3001:3001 psikolog-api:latest
docker run -p 3000:3000 psikolog-web:latest
```

## 🔐 İlk Kullanıcı Oluşturma

API başladıktan sonra:

```bash
# API'ye POST isteği gönder
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

Veya Swagger UI üzerinden: http://localhost:3001/api/docs

## 🧪 Test Etme

```bash
# Unit testler
pnpm test

# E2E testler
pnpm test:e2e

# Coverage raporu
pnpm test:cov
```

## 🔍 Veritabanı Yönetimi

### Prisma Studio (GUI)

```bash
pnpm --filter @psikolog/api db:studio
```

### Adminer (Web UI)

http://localhost:8081 adresine gidin:
- **Server:** postgres
- **Username:** postgres
- **Password:** postgres
- **Database:** psikolog_sistemi

## 🗄️ MinIO (S3) Yönetimi

http://localhost:9001 adresine gidin:
- **Username:** minioadmin
- **Password:** minioadmin

İlk kullanımda bucket oluşturun:
1. "Create Bucket" butonuna tıklayın
2. Bucket adı: `psikolog-sistemi`
3. Oluştur

## 🔑 Keycloak Yapılandırması

http://localhost:8080 adresine gidin:
- **Username:** admin
- **Password:** admin

### Realm Oluşturma

1. "Create Realm" butonuna tıklayın
2. Realm adı: `psikolog-sistemi`
3. Client oluşturun:
   - Client ID: `api-client`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`

## 🚨 Yaygın Sorunlar ve Çözümler

### Port Çakışması

Eğer portlar kullanımdaysa, `docker-compose.yml` dosyasında port numaralarını değiştirin.

### Prisma Schema Değişiklikleri

Schema değiştikten sonra:

```bash
pnpm --filter @psikolog/api db:generate
pnpm --filter @psikolog/api db:push
```

### Node Modules Sorunları

```bash
# Tüm node_modules'leri sil ve tekrar yükle
pnpm clean
pnpm install
```

### Docker Container Sorunları

```bash
# Tüm container'ları durdur ve sil
docker-compose down -v

# Tekrar başlat
docker-compose up -d
```

## 📚 Ek Kaynaklar

- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [NestJS Dokümantasyonu](https://docs.nestjs.com)
- [Prisma Dokümantasyonu](https://www.prisma.io/docs)
- [Turborepo Dokümantasyonu](https://turbo.build/repo/docs)

## 🤝 Katkıda Bulunma

1. Feature branch oluşturun: `git checkout -b feature/amazing-feature`
2. Değişikliklerinizi commit edin: `git commit -m 'feat: add amazing feature'`
3. Branch'inizi push edin: `git push origin feature/amazing-feature`
4. Pull Request açın

## 📄 Lisans

Proprietary - Tüm hakları saklıdır

