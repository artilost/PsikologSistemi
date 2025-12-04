# 🎯 Sıradaki Adımlar - Detaylı Plan

## 📊 Mevcut Durum

### ✅ Tamamlanan
- [x] Proje altyapısı (Monorepo, Docker, Prisma)
- [x] Temel Auth API (register, login, refresh)
- [x] Users API (CRUD)
- [x] Health check
- [x] Keycloak & MinIO setup (manuel)
- [x] Multi-tenant Prisma schema (Organization, Location, Room, vb.)
- [x] CI/CD pipeline
- [x] Type safety (tüm `any` tipleri düzeltildi)

### ⏳ Eksik Olanlar
- [ ] Organization Management API
- [ ] Location Management API  
- [ ] Keycloak backend entegrasyonu
- [ ] MinIO/S3 file storage
- [ ] Frontend sayfaları

---

## 🚀 FAZ 1: Organization Management API (Öncelik: 🔴 YÜKSEK)

**Neden Önce Bu?**
- Multi-tenant sistemin **temeli** bu
- Tüm kullanıcılar bir organization'a ait olmalı
- Diğer modüller (Location, Room, vb.) organization'a bağlı
- Sistemin çalışması için **kritik**

**Süre:** 4-6 saat

### 1.1 Domain Layer (Repository Interface)

**Dosya:** `apps/api/src/domain/repositories/organization.repository.ts`

```typescript
import { Organization } from '@prisma/client';

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAll(page: number, limit: number): Promise<{
    data: Organization[];
    total: number;
  }>;
  create(data: CreateOrganizationInput): Promise<Organization>;
  update(id: string, data: UpdateOrganizationInput): Promise<Organization>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

### 1.2 Infrastructure Layer (Prisma Implementation)

**Dosya:** `apps/api/src/infrastructure/database/repositories/organization.repository.impl.ts`

- Prisma ile database işlemleri
- Organization CRUD operasyonları
- Slug uniqueness kontrolü

### 1.3 Application Layer (Service)

**Dosya:** `apps/api/src/application/organizations/organizations.service.ts`

- Business logic
- Validation
- Error handling
- Organization subscription plan yönetimi

### 1.4 Presentation Layer (Controller)

**Dosya:** `apps/api/src/presentation/organizations/organizations.controller.ts`

**Endpoints:**
- `GET /api/v1/organizations` - List all (admin only)
- `GET /api/v1/organizations/:id` - Get by ID
- `GET /api/v1/organizations/slug/:slug` - Get by slug
- `POST /api/v1/organizations` - Create (super-admin only)
- `PATCH /api/v1/organizations/:id` - Update
- `DELETE /api/v1/organizations/:id` - Delete (soft delete)

### 1.5 DTOs (Shared Package)

**Dosya:** `packages/shared/src/dtos/organization.dto.ts`

```typescript
export interface CreateOrganizationDto {
  name: string;
  slug: string;
  subscriptionPlan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  contactEmail: string;
  contactPhone?: string;
  address?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  subscriptionPlan?: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}
```

### 1.6 User-Organization İlişkisi

**Güncelleme:** `apps/api/src/presentation/users/users.service.ts`
- User oluştururken `organizationId` zorunlu yap
- User listeleme: sadece kendi organization'ındaki kullanıcıları göster

---

## 🏢 FAZ 2: Location Management API (Öncelik: 🟠 ORTA)

**Süre:** 3-4 saat

**Endpoints:**
- `GET /api/v1/organizations/:orgId/locations` - List locations
- `GET /api/v1/locations/:id` - Get by ID
- `POST /api/v1/organizations/:orgId/locations` - Create
- `PATCH /api/v1/locations/:id` - Update
- `DELETE /api/v1/locations/:id` - Delete

**Özellikler:**
- Location types: CLINIC, OFFICE, VIRTUAL
- Address management
- Therapist-Location assignment
- Room management (nested)

---

## 🔐 FAZ 3: Keycloak Backend Entegrasyonu (Öncelik: 🟠 ORTA)

**Süre:** 4-6 saat

**Yapılacaklar:**
1. `nestjs-keycloak-connect` paketi yükle
2. KeycloakModule oluştur
3. JWT Strategy'yi Keycloak JWT ile değiştir
4. Role guard'ları Keycloak rolleri ile entegre et
5. User sync: Keycloak ↔ PostgreSQL

**Dosyalar:**
```
apps/api/src/infrastructure/keycloak/
  ├── keycloak.module.ts
  ├── keycloak.service.ts
  ├── keycloak-auth.guard.ts
  └── keycloak-roles.guard.ts
```

---

## 📁 FAZ 4: MinIO/S3 File Storage (Öncelik: 🟡 DÜŞÜK)

**Süre:** 4-5 saat

**Endpoints:**
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/:id` - Get file metadata
- `GET /api/v1/files/:id/download` - Download (signed URL)
- `DELETE /api/v1/files/:id` - Delete

**Özellikler:**
- Multi-bucket support (avatars, documents, attachments)
- File validation (type, size)
- Signed URL generation
- File metadata tracking

---

## 🎨 FAZ 5: Frontend Sayfaları (Öncelik: 🟡 DÜŞÜK)

**Süre:** 1-2 hafta

**Sayfalar:**
1. **Dashboard** (`/dashboard`)
2. **Organization Management** (`/organizations`)
3. **Location Management** (`/locations`)
4. **User Management** (`/users`)
5. **Settings** (`/settings`)

---

## 📅 Önerilen Sıralama

### Hafta 1
1. **Organization Management API** (1-2 gün)
2. **Location Management API** (1 gün)
3. **User-Organization ilişkisi** (yarım gün)
4. **Testing** (yarım gün)

### Hafta 2
1. **Keycloak Backend Entegrasyonu** (2-3 gün)
2. **MinIO/S3 File Storage** (1-2 gün)
3. **Testing & Documentation** (1 gün)

### Hafta 3-4
1. **Frontend Development**
2. **Integration Testing**
3. **E2E Testing**

---

## 🎯 İlk Adım: Organization Management API

**Hemen Başlayalım!**

1. Repository interface oluştur
2. Prisma implementation yaz
3. Service layer implement et
4. Controller & endpoints ekle
5. DTOs oluştur
6. Swagger documentation
7. Test et

**Tahmini Süre:** 4-6 saat

---

## 📝 Checklist

### Organization API
- [ ] Domain repository interface
- [ ] Prisma repository implementation
- [ ] Service layer
- [ ] Controller & endpoints
- [ ] DTOs (shared package)
- [ ] Validation
- [ ] Error handling
- [ ] Swagger docs
- [ ] Unit tests
- [ ] Integration tests

### Location API
- [ ] Repository & service
- [ ] Controller & endpoints
- [ ] Organization-Location ilişkisi
- [ ] Room management (nested)

### Keycloak
- [ ] Backend entegrasyonu
- [ ] JWT strategy güncelleme
- [ ] Role guards
- [ ] User sync

### File Storage
- [ ] S3 client service
- [ ] Upload/download endpoints
- [ ] File validation
- [ ] Signed URLs

---

**Son Güncelleme:** 20 Kasım 2025  
**Durum:** 🟡 Organization API - Hazırlık Aşaması

