# Changelog

Projenin tüm önemli değişiklikleri bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanmaktadır.

## [Unreleased]

### Added
- İlk proje iskelet yapısı oluşturuldu
- Monorepo yapısı (Turborepo + pnpm)
- Backend NestJS 11 kurulumu
- Frontend Next.js 15 kurulumu
- Prisma ORM entegrasyonu
- Docker Compose development ortamı
- CI/CD pipeline (GitHub Actions)
- JWT authentication sistemi
- Temel CRUD modülleri (Users, Auth, Health)

### Database
- User management şeması
- Therapist & Client profil tabloları
- Appointment yönetim şeması
- Session & Notes yapısı
- Payment tracking sistemi
- Audit log mekanizması

### Infrastructure
- PostgreSQL 16
- Redis 7 cache
- MinIO object storage
- Keycloak identity provider

## [0.1.0] - 2024-11-13

### Added
- İlk alpha sürüm
- Temel mimari ve altyapı

---

## Versiyon Notları

### [Semantic Versioning](https://semver.org/)

- **MAJOR**: Uyumsuz API değişiklikleri
- **MINOR**: Geriye dönük uyumlu yeni özellikler
- **PATCH**: Geriye dönük uyumlu bug düzeltmeleri

### Değişiklik Tipleri

- `Added`: Yeni özellikler
- `Changed`: Mevcut özelliklerde değişiklikler
- `Deprecated`: Yakında kaldırılacak özellikler
- `Removed`: Kaldırılan özellikler
- `Fixed`: Bug düzeltmeleri
- `Security`: Güvenlik güncellemeleri

