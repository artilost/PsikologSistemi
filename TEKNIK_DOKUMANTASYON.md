# 📚 Teknik Dokümantasyon - Psikolog Sistemi

Bu dokümantasyon, projenin teknik yapısını, mimarisini ve her bileşenin nerede bulunduğunu açıklar. Yeni bir geliştirici veya AI asistanı bu dokümantasyonu okuyarak projeyi hızlıca anlayabilir.

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Klasör Yapısı ve Açıklamaları](#klasör-yapısı-ve-açıklamaları)
4. [Modül Detayları](#modül-detayları)
5. [Veri Akışı ve İş Mantığı](#veri-akışı-ve-iş-mantığı)
6. [Authentication ve Authorization](#authentication-ve-authorization)
7. [Database Schema](#database-schema)
8. [API Yapısı](#api-yapısı)
9. [Frontend Yapısı](#frontend-yapısı)
10. [Sorun Çözme Rehberi](#sorun-çözme-rehberi)

---

## 🎯 Proje Genel Bakış

**Psikolog Sistemi**, psikoloji klinikleri için tasarlanmış enterprise-grade bir yönetim platformudur. Sistem, monorepo yapısında, Clean Architecture ve Domain-Driven Design (DDD) prensipleriyle inşa edilmiştir.

### Teknoloji Stack

**Backend:**
- NestJS 11 (TypeScript)
- Prisma ORM
- PostgreSQL 16
- Redis 7 (Cache & Session)
- JWT Authentication

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS + Shadcn UI
- NextAuth.js 5

**Infrastructure:**
- Docker & Docker Compose
- Turborepo (Monorepo)
- pnpm Workspaces

---

## 🏗️ Mimari Yapı

### Monorepo Yapısı

Proje **Turborepo** ile yönetilen bir monorepo'dur:

```
psikolog-sistemi/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   └── shared/       # Paylaşılan kod (DTOs, Schemas, Types)
```

### Backend: Clean Architecture + DDD

Backend, **3 katmanlı Clean Architecture** yapısına sahiptir:

1. **Domain Layer** (`apps/api/src/domain/`)
   - İş mantığı (Business Logic)
   - Entity'ler ve Value Objects
   - Repository Interface'leri

2. **Infrastructure Layer** (`apps/api/src/infrastructure/`)
   - Database (Prisma)
   - Cache (Redis)
   - External Services
   - Repository Implementations

3. **Presentation Layer** (`apps/api/src/presentation/`)
   - Controllers (REST API)
   - Services (Use Cases)
   - DTOs ve Validation

### Frontend: Next.js App Router

Frontend, **Next.js 15 App Router** yapısını kullanır:
- Server Components (default)
- Client Components (`"use client"`)
- Route Groups: `(auth)`, `(dashboard)`
- API Routes: `/api/auth/[...nextauth]`

---

## 📁 Klasör Yapısı ve Açıklamaları

### Root Seviyesi

```
psikolog-sistemi/
├── apps/                    # Ana uygulamalar
├── packages/                # Paylaşılan paketler
├── docker-compose.yml       # Local development servisleri
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # pnpm workspace config
└── package.json             # Root package.json
```

### Backend (`apps/api/`)

```
apps/api/
├── src/
│   ├── domain/              # Domain Layer
│   │   ├── base/            # Base entity ve value object
│   │   ├── repositories/    # Repository interface'leri
│   │   └── value-objects/   # Value Objects (Email, Phone, Money, vb.)
│   │
│   ├── infrastructure/      # Infrastructure Layer
│   │   ├── cache/           # Redis modülü
│   │   ├── config/          # Konfigürasyon (env validation)
│   │   ├── database/        # Prisma modülü ve repository implementations
│   │   ├── exceptions/      # Exception filter'lar
│   │   └── logger/          # Logger servisi
│   │
│   ├── presentation/        # Presentation Layer
│   │   ├── auth/            # Authentication modülü
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── decorators/  # @CurrentUser, @Roles, @Public
│   │   │   ├── guards/       # JWT, Roles, Local guards
│   │   │   └── strategies/  # Passport strategies
│   │   │
│   │   ├── users/           # Kullanıcı yönetimi
│   │   ├── clients/        # Danışan yönetimi
│   │   ├── appointments/   # Randevu yönetimi
│   │   ├── sessions/       # Terapi seansları
│   │   ├── payments/       # Ödeme yönetimi
│   │   └── reports/        # Raporlar
│   │
│   ├── app.module.ts        # Ana modül (tüm modüller burada import edilir)
│   └── main.ts              # Uygulama giriş noktası
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration dosyaları
│
└── test/                    # E2E testler
```

**Önemli Notlar:**
- Her modül (`auth`, `users`, `appointments`, vb.) kendi `*.module.ts`, `*.controller.ts`, `*.service.ts` dosyalarına sahiptir
- Repository pattern kullanılır: Interface `domain/repositories/`, Implementation `infrastructure/database/repositories/`
- Tüm API endpoint'leri `/api/v1` prefix'i ile başlar

### Frontend (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Route Group: Auth sayfaları
│   │   │   ├── layout.tsx   # Auth layout (login/register için)
│   │   │   ├── login/
│   │   │   │   └── page.tsx  # Login sayfası
│   │   │   └── register/
│   │   │       └── page.tsx # Register sayfası
│   │   │
│   │   ├── (dashboard)/     # Route Group: Dashboard sayfaları
│   │   │   ├── layout.tsx   # Dashboard layout (sidebar, header)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Ana dashboard
│   │   │       ├── appointments/
│   │   │       │   └── page.tsx        # Randevu yönetimi sayfası
│   │   │       ├── clients/
│   │   │       │   └── page.tsx        # Danışan yönetimi sayfası
│   │   │       └── users/
│   │   │           └── page.tsx        # Kullanıcı yönetimi sayfası
│   │   │
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts        # NextAuth API route
│   │   │
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Ana sayfa (redirect)
│   │   └── providers.tsx    # React providers (Toaster, vb.)
│   │
│   ├── components/         # React bileşenleri
│   │   ├── ui/              # Shadcn UI bileşenleri
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...          # Diğer UI bileşenleri
│   │   │
│   │   └── layout/          # Layout bileşenleri
│   │       ├── header.tsx   # Üst menü
│   │       └── sidebar.tsx  # Yan menü
│   │
│   ├── lib/                 # Yardımcı fonksiyonlar
│   │   ├── api.ts           # API client (Axios instance)
│   │   └── utils.ts         # Utility fonksiyonlar
│   │
│   └── hooks/               # Custom React hooks
│       └── use-toast.ts
│
├── auth.config.ts           # NextAuth konfigürasyonu
├── auth.ts                  # NextAuth handler
├── middleware.ts            # Next.js middleware (auth kontrolü)
└── next.config.js           # Next.js config
```

**Önemli Notlar:**
- `(auth)` ve `(dashboard)` route groups, farklı layout'lar için kullanılır
- Tüm sayfalar default olarak Server Component'tir, `"use client"` ile Client Component yapılır
- API çağrıları `lib/api.ts` içindeki `api` instance'ı üzerinden yapılır

### Shared Package (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── dtos/                # Data Transfer Objects
│   │   ├── user.dto.ts
│   │   ├── appointment.dto.ts
│   │   ├── client.dto.ts
│   │   └── ...
│   │
│   ├── schemas/             # Zod validation schemas
│   │   ├── user.schema.ts
│   │   ├── appointment.schema.ts
│   │   └── ...
│   │
│   ├── enums.ts             # Paylaşılan enum'lar
│   ├── types.ts             # TypeScript type'ları
│   └── utils.ts             # Utility fonksiyonlar
│
└── package.json
```

**Önemli Notlar:**
- Frontend ve backend arasında paylaşılan kod burada bulunur
- DTOs ve Zod schemas burada tanımlanır
- Her değişiklikten sonra `pnpm --filter @psikolog/shared build` çalıştırılmalı

---

## 🔧 Modül Detayları

### 1. Authentication Modülü

**Konum:** `apps/api/src/presentation/auth/`

**Dosyalar:**
- `auth.controller.ts`: REST endpoint'leri (`/auth/login`, `/auth/register`, `/auth/me`)
- `auth.service.ts`: İş mantığı (login, register, token oluşturma)
- `guards/`: JWT, Roles, Local guards
- `strategies/`: Passport JWT ve Local strategies
- `decorators/`: `@CurrentUser()`, `@Roles()`, `@Public()`

**Frontend Entegrasyonu:**
- `apps/web/auth.config.ts`: NextAuth konfigürasyonu
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`: NextAuth API route
- `apps/web/src/lib/api.ts`: `authApi` object'i

**Akış:**
1. Kullanıcı login formunu doldurur
2. Frontend `authApi.login()` çağırır
3. Backend `/auth/login` endpoint'i çağrılır
4. Backend JWT token oluşturur ve döner
5. NextAuth session'a token kaydedilir
6. Sonraki isteklerde `Authorization: Bearer <token>` header'ı eklenir

**Önemli Notlar:**
- Email case-insensitive (küçük harfe çevrilir)
- JWT token 7 gün geçerlidir
- Refresh token Redis'te saklanır
- 401 hatası durumunda otomatik logout yapılır (`lib/api.ts` interceptor)

### 2. Users Modülü

**Konum:** `apps/api/src/presentation/users/`

**Dosyalar:**
- `users.controller.ts`: `/users` endpoint'leri
- `users.service.ts`: Kullanıcı CRUD işlemleri
- `getTherapists()`: Terapist listesi (otomatik TherapistProfile oluşturur)

**Frontend:**
- `apps/web/src/app/(dashboard)/dashboard/users/page.tsx`: Kullanıcı yönetimi sayfası

**Endpoint'ler:**
- `GET /users`: Kullanıcı listesi (pagination, search, includeDeleted)
- `GET /users/therapists`: Terapist listesi (otomatik TherapistProfile oluşturur)
- `GET /users/:id`: Kullanıcı detayı
- `PATCH /users/:id`: Kullanıcı güncelle
- `DELETE /users/:id`: Kullanıcı sil (soft delete)
- `POST /users/:id/restore`: Silinen kullanıcıyı geri getir

**Önemli Notlar:**
- `getTherapists()` metodu:
  - `THERAPIST` rolündeki tüm kullanıcıları getirir
  - Her kullanıcı için `therapistProfile` kontrol edilir
  - Eğer `therapistProfile` yoksa, otomatik olarak oluşturulur
  - Response'da her terapist için `therapistProfileId` döner
- Bu, `therapistProfileId` undefined sorununu çözer
- Tenant isolation: ADMIN'ler sadece kendi organizasyonlarındaki kullanıcıları görebilir

### 3. Clients Modülü

**Konum:** `apps/api/src/presentation/clients/`

**Dosyalar:**
- `clients.controller.ts`: `/clients` endpoint'leri
- `clients.service.ts`: Danışan CRUD işlemleri

**Frontend:**
- `apps/web/src/app/(dashboard)/dashboard/clients/page.tsx`: Danışan yönetimi sayfası

**Önemli Notlar:**
- Her danışan bir terapiste atanabilir (`therapistProfileId`)
- Danışan listesi, seçilen terapiste göre filtrelenebilir

### 4. Appointments Modülü

**Konum:** `apps/api/src/presentation/appointments/`

**Dosyalar:**
- `appointments.controller.ts`: `/appointments` endpoint'leri
- `appointments.service.ts`: Randevu iş mantığı
- `appointments.module.ts`: NestJS modül tanımı
- `appointment.repository.ts` (interface): `domain/repositories/`
- `appointment.repository.impl.ts` (implementation): `infrastructure/database/repositories/`

**Frontend:**
- `apps/web/src/app/(dashboard)/dashboard/appointments/page.tsx`: Randevu yönetimi sayfası
  - Randevu listesi, oluşturma, güncelleme, iptal, erteleme
  - Filtreleme: Tümü, Planlanan, Geçmiş, Onaylanan, Onay Bekleyen, İptal Edilen
  - Conflict kontrolü (frontend'de de yapılır)

**Endpoint'ler:**
- `GET /appointments`: Randevu listesi (filtreleme: `status`, `excludeScheduled`, `therapistId`, `clientId`, `startDate`, `endDate`)
- `GET /appointments/available-slots`: Müsait saatleri getir
- `GET /appointments/upcoming/:therapistId`: Terapistin yaklaşan randevuları
- `GET /appointments/today/:therapistId`: Terapistin bugünkü randevuları
- `POST /appointments`: Yeni randevu oluştur
- `GET /appointments/:id`: Randevu detayı
- `PATCH /appointments/:id`: Randevu güncelle
- `PATCH /appointments/:id/status`: Durum güncelle
- `POST /appointments/:id/reschedule`: Randevu ertele
- `POST /appointments/:id/cancel`: Randevu iptal et
- `DELETE /appointments/:id`: Randevu sil (sadece SUPER_ADMIN, ADMIN)

**Önemli Notlar:**
- `excludeScheduled` parametresi:
  - Query string olarak gönderilir: `excludeScheduled=false` veya `excludeScheduled=true`
  - Controller'da: `excludeScheduled === 'false'` ise `false` olur (SCHEDULED dahil)
  - `excludeScheduled === 'true'` veya `undefined` ise `undefined` olur (default davranış)
  - Service'de: `excludeScheduled !== false` ise `true` olarak davranır (SCHEDULED exclude edilir)
  - Terapistler için default: `SCHEDULED` randevular exclude edilir
  - Terapistler, `excludeScheduled=false` query param ile `SCHEDULED` randevuları görebilir
- Conflict kontrolü: Aynı saatte başka randevu varsa hata döner
- `CANCELLED` ve `NO_SHOW` durumundaki randevular conflict kontrolünde otomatik exclude edilir
- Reschedule işleminde eski randevu `excludeId` parametresi ile conflict kontrolünden çıkarılır
- Randevu oluştururken `therapistId` olarak `therapistProfileId` veya `userId` gönderilebilir (controller otomatik dönüştürür)

**Appointment Status'ları:**
- `SCHEDULED`: Onay bekliyor (terapist onaylamalı)
- `CONFIRMED`: Onaylandı
- `CHECKED_IN`: Danışan geldi
- `IN_PROGRESS`: Seans devam ediyor
- `COMPLETED`: Tamamlandı
- `CANCELLED`: İptal edildi
- `NO_SHOW`: Gelmedi
- `RESCHEDULED`: Ertelendi

### 5. Sessions Modülü

**Konum:** `apps/api/src/presentation/sessions/`

**Dosyalar:**
- `sessions.controller.ts`: `/sessions` endpoint'leri
- `sessions.service.ts`: Seans notları ve iş mantığı

**Önemli Notlar:**
- Her seans bir randevuya bağlıdır (1:1 ilişki)
- Klinik notlar field-level encryption ile saklanabilir
- `isPrivate` flag'i: Ebeveynler göremez

### 6. Payments Modülü

**Konum:** `apps/api/src/presentation/payments/`

**Dosyalar:**
- `payments.controller.ts`: `/payments` endpoint'leri
- `payments.service.ts`: Ödeme iş mantığı
- `apps/api/src/infrastructure/database/repositories/payment.repository.impl.ts`: Ödeme repository implementasyonu

**Ödeme Durumları:**
- `PENDING`: Bekleyen ödeme
- `PAID`: Tamamlanmış ödeme
- `PARTIALLY_PAID`: Kısmen ödenmiş ödeme
- `REFUNDED`: İade edilmiş ödeme (artık kullanılmıyor, yerine PENDING/PARTIALLY_PAID kullanılıyor)
- `CANCELLED`: İptal edilmiş ödeme
- `FAILED`: Başarısız ödeme

**Ödeme İşlemleri:**

1. **Ödeme Oluşturma:**
   - `POST /payments` - Yeni ödeme kaydı oluştur
   - Seansa bağlı veya bağımsız ödeme oluşturulabilir
   - Ödeme yöntemleri: CASH, CREDIT_CARD, BANK_TRANSFER, ONLINE, INSURANCE

2. **Ödeme İşleme:**
   - `POST /payments/:id/process` - Ödeme al
   - Kısmen ödenmiş ödemeler için kalan tutarı alabilir
   - İade yapıldıktan sonra kalan tutar varsa tekrar ödeme alınabilir

3. **İade İşlemi:**
   - `POST /payments/:id/refund` - Ödeme iadesi yap
   - İade yapıldıktan sonra:
     - Eğer tüm ödenen tutar iade edildiyse: Status `PENDING` olur, `remainingAmount = amount`
     - Eğer kısmi iade yapıldıysa: Status `PARTIALLY_PAID` olur, `remainingAmount` güncellenir
     - İade sonrası kalan tutar varsa (`remainingAmount > 0`), ödeme tekrar işlenebilir

4. **Ödeme Güncelleme:**
   - `PATCH /payments/:id` - Ödeme tutarını ve açıklamasını güncelle
   - Sadece `PENDING` durumundaki ödemeler için tutar düzenlenebilir

5. **Ödeme İptal:**
   - `DELETE /payments/:id` - Ödemeyi iptal et (soft delete)
   - Status `CANCELLED` olur

**Önemli Notlar:**
- Her ödeme bir seansa bağlı olabilir (opsiyonel)
- Session Package desteği var (10 seans paketi gibi)
- İade yapıldıktan sonra kalan tutar varsa, ödeme tekrar işlenebilir
- Bekleyen ödemeler için tutar düzenleme özelliği mevcuttur
- Ödeme istatistikleri: Toplam gelir, bekleyen ödemeler, tamamlanan ödemeler

---

## 🔄 Veri Akışı ve İş Mantığı

### Randevu Oluşturma Akışı

```
1. Frontend: Kullanıcı randevu formunu doldurur
   ↓
2. Frontend: appointmentsApi.create() çağrılır
   ↓
3. Backend: POST /appointments
   ↓
4. Controller: appointments.controller.ts → create()
   ↓
5. Service: appointments.service.ts → create()
   - Conflict kontrolü yapılır
   - TherapistProfileId doğrulanır
   - ClientProfileId doğrulanır
   ↓
6. Repository: appointment.repository.impl.ts → create()
   ↓
7. Database: Prisma → PostgreSQL
   ↓
8. Response: Yeni randevu döner
   ↓
9. Frontend: Randevu listesi yenilenir
```

### Conflict Kontrolü

**Konum:** `apps/api/src/infrastructure/database/repositories/appointment.repository.impl.ts`

**`hasConflict()` Metodu:**
```typescript
hasConflict(
  therapistId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string  // Reschedule durumunda eski randevu ID'si
): Promise<boolean>
```

**Kontrol Kriterleri:**
- Aynı `therapistId`
- Aynı zaman dilimi (startTime - endTime arasında çakışma)
- Status: `CANCELLED` veya `NO_SHOW` değil (otomatik exclude edilir)
- `excludeId` varsa: O ID'ye sahip randevu conflict kontrolünden çıkarılır

**Kullanım:**
- Yeni randevu oluştururken: `excludeId` gönderilmez
- Reschedule işleminde: `excludeId` olarak eski randevu ID'si gönderilir

**Frontend'de de kontrol edilir:**
- `apps/web/src/app/(dashboard)/dashboard/appointments/page.tsx`
- `isTimeSlotAvailable()` fonksiyonu
- Frontend'de de `CANCELLED` ve `NO_SHOW` durumundaki randevular exclude edilir

### Danışan-Terapist Atama

**Konum:** `apps/web/src/app/(dashboard)/dashboard/clients/page.tsx`

**Akış:**
1. Admin/Receptionist danışan listesini görür
2. Her danışan için terapist seçimi yapılır
3. `clientsApi.update()` çağrılır
4. Backend `clientProfile.therapistProfileId` güncellenir
5. Randevu oluştururken, danışanın terapisti otomatik seçilir

---

## 🔐 Authentication ve Authorization

### JWT Token Yapısı

**Token Süreleri:**
- **Access Token (JWT):** 7 gün (`apps/api/src/infrastructure/config/configuration.ts`)
- **Refresh Token:** 30 gün (Redis'te saklanır)
- **NextAuth Session:** 30 gün (`apps/web/auth.config.ts`)

**Token içeriği:**
```typescript
{
  id: string;           // User ID
  email: string;
  role: UserRole;      // CLIENT, THERAPIST, ADMIN, vb.
  iat: number;         // Issued at
  exp: number;         // Expires at
}
```

### Role-Based Access Control (RBAC)

**Roller:**
- `SUPER_ADMIN`: Platform yöneticisi
- `ADMIN`: Klinik yöneticisi
- `THERAPIST`: Terapist
- `RECEPTIONIST`: Resepsiyonist
- `ACCOUNTANT`: Muhasebe
- `CLIENT`: Danışan

**Guard Kullanımı:**
```typescript
// Controller'da
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'THERAPIST')
@Get('appointments')
```

**Frontend'de:**
- `session.user.role` ile kontrol edilir
- Sayfa bazında veya component bazında conditional rendering

### API Interceptor

**Konum:** `apps/web/src/lib/api.ts`

**Özellikler:**
- Request interceptor: Her istekte JWT token eklenir
- Response interceptor: 401 hatası durumunda otomatik logout
- Error handling: Hata mesajları toast ile gösterilir

---

## 🗄️ Database Schema

### Ana Tablolar

**User (`users`)**
- Tüm kullanıcılar (terapist, danışan, admin)
- `role`: UserRole enum
- `status`: ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION

**TherapistProfile (`therapist_profiles`)**
- Terapist profil bilgileri
- `userId`: User ile 1:1 ilişki
- `licenseNumber`: Lisans numarası
- `specialization`: Uzmanlık alanları
- `hourlyRate`: Saatlik ücret
- `sessionDuration`: Seans süresi (dakika)
- `autoConfirmAppointment`: Otomatik onay

**ClientProfile (`client_profiles`)**
- Danışan profil bilgileri
- `userId`: User ile 1:1 ilişki
- `therapistProfileId`: Atanan terapist
- `dateOfBirth`, `gender`, `occupation`
- `medicalHistory`, `currentMedication` (encrypted)

**Appointment (`appointments`)**
- Randevu kayıtları
- `therapistId`: TherapistProfile ile ilişki
- `clientId`: ClientProfile ile ilişki
- `userId`: User ile ilişki (hızlı sorgular için)
- `startTime`, `endTime`, `duration`
- `status`: AppointmentStatus enum
- `locationId`, `roomId`: Lokasyon ve oda

**Session (`sessions`)**
- Terapi seansları
- `appointmentId`: Appointment ile 1:1 ilişki
- `clinicalNotes`, `treatmentPlan`, `progressNotes`
- `isPrivate`: Gizli not flag'i

**Payment (`payments`)**
- Ödeme kayıtları
- `sessionId`: Session ile 1:1 ilişki
- `amount`, `status`, `method`
- `packageId`: SessionPackage ile ilişki

### İlişkiler

```
User 1:1 TherapistProfile
User 1:1 ClientProfile
User 1:N Appointments
User 1:N Sessions
User 1:N Payments

TherapistProfile 1:N Appointments
TherapistProfile 1:N Sessions
TherapistProfile 1:N ClientProfiles (assigned clients)

ClientProfile 1:N Appointments
ClientProfile 1:N Sessions

Appointment 1:1 Session
Session 1:1 Payment
```

### Index'ler

**Önemli index'ler:**
- `users.email`: Unique
- `users.phone`: Unique
- `appointments.therapistId, startTime`: Composite index
- `appointments.clientId, startTime`: Composite index
- `appointments.status`: Status filtreleme için

---

## 🌐 API Yapısı

### Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.example.com/api/v1
```

### Endpoint'ler

**Authentication:**
- `POST /auth/login` - Giriş yap
- `POST /auth/register` - Kayıt ol
- `GET /auth/me` - Kullanıcı bilgileri
- `POST /auth/logout` - Çıkış yap

**Users:**
- `GET /users` - Kullanıcı listesi
- `GET /users/therapists` - Terapist listesi
- `GET /users/:id` - Kullanıcı detayı
- `PATCH /users/:id` - Kullanıcı güncelle

**Clients:**
- `GET /clients` - Danışan listesi
- `GET /clients/:id` - Danışan detayı
- `PATCH /clients/:id` - Danışan güncelle

**Appointments:**
- `GET /appointments` - Randevu listesi
  - Query params: `startDate`, `endDate`, `therapistId`, `clientId`, `status`, `excludeScheduled`
- `POST /appointments` - Yeni randevu
- `GET /appointments/:id` - Randevu detayı
- `PATCH /appointments/:id/status` - Durum güncelle
- `POST /appointments/:id/reschedule` - Randevu ertele
- `POST /appointments/:id/cancel` - Randevu iptal et

**Sessions:**
- `GET /sessions` - Seans listesi
- `POST /sessions` - Yeni seans
- `PATCH /sessions/:id` - Seans güncelle

**Payments:**
- `GET /payments` - Ödeme listesi
- `POST /payments` - Yeni ödeme
- `PATCH /payments/:id` - Ödeme güncelle

### Response Format

**Başarılı Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

**Hata Response:**
```json
{
  "success": false,
  "message": "Hata mesajı",
  "error": {
    "message": "Detaylı hata mesajı",
    "statusCode": 400
  }
}
```

### Swagger Documentation

**URL:** `http://localhost:3001/api/docs`

Tüm endpoint'ler Swagger'da dokümante edilmiştir.

---

## 💻 Frontend Yapısı

### Routing

**App Router Yapısı:**
- `(auth)/login` → Login sayfası
- `(auth)/register` → Register sayfası
- `(dashboard)/dashboard` → Ana dashboard
- `(dashboard)/dashboard/appointments` → Randevu yönetimi
- `(dashboard)/dashboard/clients` → Danışan yönetimi
- `(dashboard)/dashboard/users` → Kullanıcı yönetimi

**Route Groups:**
- `(auth)`: Login/Register için özel layout
- `(dashboard)`: Dashboard sayfaları için sidebar + header layout

### State Management

**Server State:**
- API çağrıları `lib/api.ts` üzerinden yapılır
- React Query kullanılmıyor (şu an), manuel `useState` + `useEffect`

**Client State:**
- `useState` ile local state
- Form state: `react-hook-form`

### API Client

**Konum:** `apps/web/src/lib/api.ts`

**Kullanım:**
```typescript
import { appointmentsApi } from '@/lib/api';

// Randevu listesi
const response = await appointmentsApi.list({ 
  startDate: '...',
  endDate: '...',
  therapistId: '...'
});

// Yeni randevu
await appointmentsApi.create({
  therapistId: '...',
  clientId: '...',
  startTime: '...',
  endTime: '...'
});
```

**API Methods:**

**authApi:**
- `login(data)`: Giriş yap
- `register(data)`: Kayıt ol
- `me()`: Kullanıcı bilgileri
- `logout()`: Çıkış yap
- `forgotPassword(email)`: Şifre sıfırlama e-postası gönder
- `resetPassword(data)`: Şifre sıfırla

**usersApi:**
- `list(params?)`: Kullanıcı listesi
- `listDeleted(params?)`: Silinen kullanıcılar
- `get(id)`: Kullanıcı detayı
- `getTherapists()`: Terapist listesi (otomatik TherapistProfile oluşturur)
- `update(id, data)`: Kullanıcı güncelle
- `delete(id)`: Kullanıcı sil
- `restore(id)`: Silinen kullanıcıyı geri getir

**clientsApi:**
- `list(params?)`: Danışan listesi
- `get(id)`: Danışan detayı
- `update(id, data)`: Danışan güncelle
- `updateConsent(id, data)`: Onay bilgilerini güncelle
- `delete(id)`: Danışan sil
- `restore(id)`: Silinen danışanı geri getir

**appointmentsApi:**
- `list(params?)`: Randevu listesi
  - `params`: `page`, `limit`, `therapistId`, `clientId`, `status`, `startDate`, `endDate`, `excludeScheduled`
- `get(id)`: Randevu detayı
- `create(data)`: Yeni randevu oluştur
- `update(id, data)`: Randevu güncelle
- `updateStatus(id, status)`: Durum güncelle
- `reschedule(id, data)`: Randevu ertele (`startTime`, `endTime`)
- `cancel(id, reason?)`: Randevu iptal et
- `getAvailableSlots(params)`: Müsait saatleri getir

**sessionsApi:**
- `list(params?)`: Seans listesi
- `get(id)`: Seans detayı
- `create(data)`: Yeni seans oluştur
- `updateNotes(id, data)`: Seans notlarını güncelle
- `sign(id)`: Seans notunu imzala
- `getDrafts()`: Taslak seans notları
- `getClientHistory(clientId)`: Danışan geçmişi

**paymentsApi:**
- `list(params?)`: Ödeme listesi (status, userId filtreleme desteği)
- `get(id)`: Ödeme detayı
- `create(data)`: Yeni ödeme oluştur (sessionId opsiyonel)
- `process(id, data)`: Ödeme işle (kısmi ödeme desteği, iade sonrası kalan tutar tekrar işlenebilir)
- `refund(id, data)`: Ödeme iade et (kısmi iade desteği, iade sonrası kalan tutar tekrar işlenebilir)
- `update(id, data)`: Ödeme tutarını ve açıklamasını güncelle (sadece PENDING durumu)
- `delete(id)`: Ödemeyi iptal et (soft delete, status CANCELLED)
- `getStats(params?)`: Ödeme istatistikleri (toplam gelir, bekleyen ödemeler, vb.)

**reportsApi:**
- `getDashboard()`: Dashboard istatistikleri
- `getAppointmentStats(params?)`: Randevu istatistikleri
- `getRevenue(params?)`: Gelir istatistikleri
- `getTherapistPerformance(params?)`: Terapist performans raporu

### Authentication

**NextAuth.js Kullanımı:**
- `apps/web/auth.config.ts`: Konfigürasyon
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`: API route
- `apps/web/middleware.ts`: Route protection

**Session Kullanımı:**
```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
const userRole = session?.user?.role;
```

---

## 🐛 Sorun Çözme Rehberi

### Yaygın Sorunlar ve Çözümleri

#### 1. "therapistProfileId is undefined" Hatası

**Sorun:** Terapist listesinde `therapistProfileId` undefined görünüyor.

**Çözüm:**
- Backend: `apps/api/src/presentation/users/users.service.ts`
- `getTherapists()` metodu:
  1. `THERAPIST` rolündeki tüm kullanıcıları getirir
  2. Her kullanıcı için `therapistProfile` kontrol edilir
  3. Eğer `therapistProfile` yoksa, otomatik olarak oluşturulur
  4. Response'da her terapist için `therapistProfileId` döner
- Eğer hala sorun varsa, backend'i yeniden başlatın

**Kod:**
```typescript
// Backend'de (users.service.ts)
async getTherapists(): Promise<{ success: boolean; data: any[] }> {
  const therapists = await this.userRepository.findByRole('THERAPIST');
  
  const result = await Promise.all(
    therapists.map(async (user) => {
      let therapistProfile = user.therapistProfile;
      
      // Eğer therapistProfile yoksa, oluştur
      if (!therapistProfile) {
        therapistProfile = await this.prisma.therapistProfile.create({
          data: {
            userId: user.id,
            specialization: ['Genel'],
            licenseNumber: `AUTO-${user.id}`,
          },
        });
      }
      
      return {
        ...this.sanitizeUser(user),
        therapistProfileId: therapistProfile.id,
      };
    })
  );
  
  return { success: true, data: result };
}
```

#### 2. "401 Unauthorized" - Otomatik Logout Çalışmıyor

**Sorun:** Token süresi dolduğunda kullanıcı logout olmuyor.

**Çözüm:**
- `apps/web/src/lib/api.ts` içindeki response interceptor kontrol edilmeli
- 401 durumunda `signOut()` çağrılmalı

**Kod:**
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({ callbackUrl: '/login', redirect: true });
    }
    return Promise.reject(error);
  }
);
```

#### 3. Randevu Oluşturulamıyor - Conflict Hatası

**Sorun:** Aynı saatte randevu oluşturulamıyor ama o saatte randevu yok.

**Çözüm:**
- `apps/web/src/app/(dashboard)/dashboard/appointments/page.tsx`
- `isTimeSlotAvailable()` fonksiyonu kontrol edilmeli
- `CANCELLED` ve `NO_SHOW` durumundaki randevular exclude edilmeli

**Kod:**
```typescript
// Frontend'de (appointments/page.tsx)
const isTimeSlotAvailable = (date: Date, startTime: string, endTime: string) => {
  const conflicts = appointments.filter(apt => {
    // CANCELLED ve NO_SHOW'u exclude et
    if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') {
      return false;
    }
    // Aynı therapist ve zaman dilimi kontrolü
    // ...
  });
  return conflicts.length === 0;
};
```

**Backend'de de aynı kontrol yapılır:**
```typescript
// Backend'de (appointment.repository.impl.ts)
async hasConflict(therapistId: string, startTime: Date, endTime: Date, excludeId?: string) {
  const where: Prisma.AppointmentWhereInput = {
    therapistId,
    status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
    // Zaman dilimi çakışma kontrolü...
  };
  
  if (excludeId) {
    where.id = { not: excludeId };
  }
  
  const count = await this.prisma.appointment.count({ where });
  return count > 0;
}
```

#### 4. Email Case Sensitivity Sorunu

**Sorun:** Email büyük/küçük harf duyarlı.

**Çözüm:**
- Frontend: `apps/web/src/app/(auth)/login/page.tsx` ve `register/page.tsx`
- Email input'u `.toLowerCase().trim()` ile normalize edilmeli
- Backend: `apps/api/src/presentation/auth/auth.service.ts`
- Prisma query'de `mode: 'insensitive'` kullanılmalı

#### 5. Reschedule Sonrası Eski Saat Hala Bloke

**Sorun:** Randevu ertelendiğinde eski saat hala bloke görünüyor.

**Çözüm:**
- `apps/web/src/app/(dashboard)/dashboard/appointments/page.tsx`
- `handleReschedule()` sonrası double refresh yapılır:
  1. `setCurrentDate(new Date())` - Anında refresh
  2. `setTimeout(() => setCurrentDate(new Date(currentDate)), 100)` - 100ms sonra tekrar refresh
- Backend'de `hasConflict()` metoduna `excludeId` parametresi gönderilir (eski randevu ID'si)
- Bu sayede eski randevu conflict kontrolünden çıkarılır ve yeni saat açılır

**Kod:**
```typescript
const handleReschedule = async (appointment: Appointment, newStartTime: string, newEndTime: string) => {
  await appointmentsApi.reschedule(appointment.id, {
    startTime: newStartTime,
    endTime: newEndTime,
  });
  // Force refresh appointments
  setCurrentDate(new Date());
  setTimeout(() => {
    setCurrentDate(new Date(currentDate));
  }, 100);
};
```

#### 6. "Terapist bulunamadı" - Client Randevu Oluştururken

**Sorun:** Danışan randevu oluştururken terapist seçilemiyor.

**Çözüm:**
- `apps/web/src/app/(dashboard)/dashboard/appointments/page.tsx`
- `clientTherapistProfileId` state'i doğru yüklenmeli
- `authApi.me()` response'unda `clientProfile.therapistProfileId` kontrol edilmeli

**Kod:**
```typescript
useEffect(() => {
  if (userRole === 'CLIENT') {
    authApi.me().then(response => {
      const clientProfile = response.data.data.clientProfile;
      if (clientProfile?.therapistProfileId) {
        setClientTherapistProfileId(clientProfile.therapistProfileId);
      }
    });
  }
}, [userRole]);
```

#### 7. TypeScript Hataları - Shared Package

**Sorun:** `@psikolog/shared` import edilemiyor.

**Çözüm:**
```bash
# Shared package'ı build et
pnpm --filter @psikolog/shared build

# Veya root'tan
pnpm start  # Otomatik build yapar
```

#### 8. Database Migration Sorunları

**Sorun:** Migration çalışmıyor veya schema güncel değil.

**Çözüm:**
```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma studio  # Database'i görselleştir
```

#### 9. Port Already in Use

**Sorun:** `EADDRINUSE` hatası - Port 3000 veya 3001 kullanımda.

**Çözüm (Windows):**
```powershell
# Node.js process'lerini kapat
taskkill /f /im node.exe

# Veya belirli port'u kullanan process'i bul
netstat -ano | findstr :3001
taskkill /f /pid <PID>
```

#### 10. CORS Hatası

**Sorun:** Frontend'den API'ye istek atılamıyor.

**Çözüm:**
- `apps/api/src/main.ts` içinde CORS ayarları kontrol edilmeli
- `NEXT_PUBLIC_API_URL` environment variable doğru olmalı
- Backend'de `origin: ['http://localhost:3000']` whitelist'te olmalı

#### 11. İade Sonrası Kalan Ödeme Alınamıyor

**Sorun:** İade yapıldıktan sonra kalan tutar varsa ödeme alınamıyor.

**Çözüm:**
- Backend'de `refundPayment` metodu iade sonrası status'u doğru ayarlar:
  - Tüm ödenen tutar iade edildiyse: `status = PENDING`, `remainingAmount = amount`
  - Kısmi iade yapıldıysa: `status = PARTIALLY_PAID`, `remainingAmount` güncellenir
- Frontend'de `ProcessPaymentDialog` içinde iade sonrası kalan tutar kontrolü:
  ```typescript
  // İade yapılmışsa, kalan tutar = amount - currentPaidAmount
  if (payment.refundAmount && Number(payment.refundAmount) > 0) {
    const currentPaid = Number(payment.paidAmount || 0);
    maxAmount = Number(payment.amount) - currentPaid;
  }
  ```
- Dropdown menüde "Tekrar Ödeme Al" butonu gösterilmesi için:
  ```typescript
  {(p.status === 'PENDING' || 
    p.status === 'PARTIALLY_PAID' || 
    (p.refundAmount && Number(p.refundAmount) > 0 && 
     (Number(p.remainingAmount || 0) > 0 || Number(p.amount) > Number(p.paidAmount || 0)))) && (
    // "Tekrar Ödeme Al" butonu
  )}
  ```

**Dosyalar:**
- `apps/api/src/infrastructure/database/repositories/payment.repository.impl.ts` - `refundPayment` metodu
- `apps/web/src/app/(dashboard)/dashboard/payments/page.tsx` - `ProcessPaymentDialog` ve dropdown menü

#### 12. Bekleyen Ödemelerde Tutar Düzenlenemiyor

**Sorun:** `PENDING` durumundaki ödemeler için tutar düzenlenemiyor.

**Çözüm:**
- `PATCH /payments/:id` endpoint'i kullanılır
- Sadece `PENDING` durumundaki ödemeler için "Tutarı Düzenle" butonu gösterilir
- Frontend'de `EditPaymentDialog` component'i kullanılır

**Dosyalar:**
- `apps/api/src/presentation/payments/payments.controller.ts` - `PATCH /payments/:id`
- `apps/web/src/app/(dashboard)/dashboard/payments/page.tsx` - `EditPaymentDialog`

### Debug İpuçları

1. **Console Logs:**
   - Frontend: Browser DevTools Console
   - Backend: Terminal (NestJS logger)

2. **Network Tab:**
   - Browser DevTools → Network
   - API isteklerini ve response'ları kontrol et

3. **Database:**
   - Prisma Studio: `cd apps/api && pnpm prisma studio`
   - Adminer: `http://localhost:8081`

4. **Swagger:**
   - API endpoint'lerini test et: `http://localhost:3001/api/docs`

5. **Environment Variables:**
   - `.env` dosyalarını kontrol et
   - `apps/api/.env`
   - `apps/web/.env.local`

---

## 📝 Önemli Notlar

### Development Workflow

1. **Bağımlılıkları Yükle:**
   ```bash
   pnpm install
   ```

2. **Shared Package'ı Build Et:**
   ```bash
   pnpm --filter @psikolog/shared build
   ```

3. **Database Migration:**
   ```bash
   cd apps/api
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

4. **Development Server'ları Başlat:**
   ```bash
   pnpm dev
   # Veya
   turbo run dev
   ```

5. **Build:**
   ```bash
   pnpm build
   ```

### Code Style

- **TypeScript:** Strict mode açık
- **Linting:** ESLint + Prettier
- **Formatting:** Prettier (auto-format on save)

### Git Workflow

- **Branch:** `main` (production)
- **Commit:** Conventional Commits
- **PR:** Code review gerekli

### Environment Variables

**Backend (`apps/api/.env`):**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

**Frontend (`apps/web/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 🚀 Hızlı Başlangıç (Yeni Geliştirici için)

1. **Repository'yi Clone Et:**
   ```bash
   git clone <repo-url>
   cd psikolog-sistemi
   ```

2. **Bağımlılıkları Yükle:**
   ```bash
   pnpm install
   ```

3. **Docker Servislerini Başlat:**
   ```bash
   docker-compose up -d
   ```

4. **Database Migration:**
   ```bash
   cd apps/api
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. **Shared Package'ı Build Et:**
   ```bash
   pnpm --filter @psikolog/shared build
   ```

6. **Development Server'ları Başlat:**
   ```bash
   pnpm dev
   ```

7. **Tarayıcıda Aç:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1
   - Swagger: http://localhost:3001/api/docs

---

## 📞 İletişim ve Destek

- **Dokümantasyon:** Bu dosya
- **Swagger:** http://localhost:3001/api/docs
- **Prisma Studio:** `cd apps/api && pnpm prisma studio`

---

**Son Güncelleme:** Aralık 2025
**Versiyon:** 1.0.0