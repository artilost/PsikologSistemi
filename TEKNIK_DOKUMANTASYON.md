# 📚 Teknik Dokümantasyon - Psikolog Sistemi

Bu dokümantasyon, projenin teknik yapısını, mimarisini ve her bileşenin nerede bulunduğunu açıklar. Yeni bir geliştirici veya AI asistanı bu dokümantasyonu okuyarak projeyi hızlıca anlayabilir.

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Mimari Diyagramlar](#mimari-diyagramlar)
4. [Klasör Yapısı ve Açıklamaları](#klasör-yapısı-ve-açıklamaları)
5. [Modül Detayları](#modül-detayları)
6. [Veri Akışı ve İş Mantığı](#veri-akışı-ve-iş-mantığı)
7. [Authentication ve Authorization](#authentication-ve-authorization)
8. [Database Schema](#database-schema)
9. [API Yapısı](#api-yapısı)
10. [Frontend Yapısı](#frontend-yapısı)
11. [Test Stratejisi](#test-stratejisi)
12. [Deployment Rehberi](#deployment-rehberi)
13. [Güvenlik Best Practices](#güvenlik-best-practices)
14. [Performans Optimizasyonları](#performans-optimizasyonları)
15. [Sorun Çözme Rehberi](#sorun-çözme-rehberi)

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

## 🧪 Test Stratejisi

### Test Piramidi

```
        ┌─────────────┐
        │   E2E Tests │  (Az sayıda, kritik akışlar)
        │  (Playwright)│
        └─────────────┘
       ┌─────────────────┐
       │ Integration    │  (Orta sayıda, modül entegrasyonları)
       │ Tests          │
       └─────────────────┘
      ┌─────────────────────┐
      │   Unit Tests        │  (Çok sayıda, fonksiyon/component testleri)
      │  (Jest + Vitest)    │
      └─────────────────────┘
```

### Backend Test Yapısı

**Konum:** `apps/api/test/`

**Test Türleri:**

1. **Unit Tests:**
   - Konum: `apps/api/src/**/*.spec.ts`
   - Framework: Jest
   - Test edilenler:
     - Service metodları
     - Repository metodları
     - Utility fonksiyonlar
     - Value Objects

2. **Integration Tests:**
   - Konum: `apps/api/test/integration/`
   - Framework: Jest + Supertest
   - Test edilenler:
     - API endpoint'leri
     - Database işlemleri
     - Authentication akışları

3. **E2E Tests:**
   - Konum: `apps/api/test/e2e/`
   - Framework: Jest + Supertest
   - Test edilenler:
     - Tam kullanıcı akışları
     - Kritik business logic

**Test Çalıştırma:**

```bash
# Tüm testler
cd apps/api
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E testler
pnpm test:e2e
```

**Örnek Test:**

```typescript
// apps/api/src/presentation/appointments/appointments.service.spec.ts
describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: AppointmentRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: AppointmentRepository,
          useValue: {
            hasConflict: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get<AppointmentRepository>(AppointmentRepository);
  });

  it('should create appointment when no conflict', async () => {
    repository.hasConflict = jest.fn().resolvedValue(false);
    repository.create = jest.fn().resolvedValue(mockAppointment);

    const result = await service.create(createDto);

    expect(result).toBeDefined();
    expect(repository.hasConflict).toHaveBeenCalled();
  });
});
```

### Frontend Test Yapısı

**Test Türleri:**

1. **Unit Tests:**
   - Konum: `apps/web/src/**/*.test.tsx`
   - Framework: Vitest + React Testing Library
   - Test edilenler:
     - React component'leri
     - Custom hooks
     - Utility fonksiyonlar

2. **Integration Tests:**
   - Konum: `apps/web/src/**/*.integration.test.tsx`
   - Framework: Vitest + React Testing Library
   - Test edilenler:
     - Form işlemleri
     - API çağrıları (mock)
     - State yönetimi

3. **E2E Tests:**
   - Konum: `apps/web/e2e/`
   - Framework: Playwright
   - Test edilenler:
     - Kullanıcı akışları
     - Sayfa navigasyonu
     - Form gönderimi

**Test Çalıştırma:**

```bash
# Tüm testler
cd apps/web
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E testler
pnpm test:e2e
```

**Örnek Test:**

```typescript
// apps/web/src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Coverage Hedefleri

- **Unit Tests:** %80+ coverage
- **Integration Tests:** Kritik endpoint'ler için %100
- **E2E Tests:** Ana kullanıcı akışları için %100

### Test Best Practices

1. **AAA Pattern (Arrange-Act-Assert):**
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = { ... };
     
     // Act
     const result = service.doSomething(input);
     
     // Assert
     expect(result).toBe(expected);
   });
   ```

2. **Mock External Dependencies:**
   - Database: Mock repository
   - API: Mock axios
   - External services: Mock service

3. **Test Isolation:**
   - Her test bağımsız olmalı
   - `beforeEach` ile setup
   - `afterEach` ile cleanup

4. **Meaningful Test Names:**
   - `it('should return error when user not found')`
   - `it('should create appointment when no conflict')`

---

## 🚀 Deployment Rehberi

### Production Ortamı Gereksinimleri

**Minimum Gereksinimler:**
- **Backend:** 2 CPU, 4GB RAM, 20GB Disk
- **Frontend:** 1 CPU, 2GB RAM, 10GB Disk
- **Database:** 2 CPU, 8GB RAM, 100GB SSD
- **Redis:** 1 CPU, 2GB RAM, 5GB Disk

### Deployment Seçenekleri

#### 1. Docker Compose (Basit Deployment)

**Dosya:** `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: psikolog_db
      POSTGRES_USER: psikolog_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://psikolog_user:${DB_PASSWORD}@postgres:5432/psikolog_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${WEB_URL}
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

**Deployment:**

```bash
# Build ve başlat
docker-compose -f docker-compose.prod.yml up -d --build

# Logları görüntüle
docker-compose -f docker-compose.prod.yml logs -f

# Durdur
docker-compose -f docker-compose.prod.yml down
```

#### 2. Kubernetes (Enterprise Deployment)

**Manifest Örnekleri:**

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: psikolog/api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

#### 3. Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**
1. GitHub repo'yu Vercel'e bağla
2. Build settings:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

**Backend (Railway/Render):**
1. GitHub repo'yu bağla
2. Environment variables'ı ayarla
3. Build command: `cd apps/api && pnpm install && pnpm build`
4. Start command: `cd apps/api && pnpm start:prod`

### Pre-Deployment Checklist

- [ ] Environment variables ayarlandı
- [ ] Database migration'ları çalıştırıldı
- [ ] SSL sertifikası yapılandırıldı
- [ ] CORS ayarları production için güncellendi
- [ ] Logging yapılandırıldı
- [ ] Monitoring/Alerting kuruldu
- [ ] Backup stratejisi hazırlandı
- [ ] Load testing yapıldı
- [ ] Security audit tamamlandı

### Database Migration (Production)

```bash
# Production migration
cd apps/api
pnpm prisma migrate deploy

# Rollback (gerekirse)
pnpm prisma migrate resolve --rolled-back <migration_name>
```

### Environment Variables (Production)

**Backend (.env.production):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_SECRET=<strong-secret>
NEXTAUTH_URL=https://yourdomain.com
```

### Monitoring ve Logging

**Önerilen Araçlar:**
- **Logging:** Winston (Backend), Pino (alternatif)
- **APM:** Sentry (Error tracking)
- **Monitoring:** Prometheus + Grafana
- **Uptime:** UptimeRobot veya Pingdom

**Log Format:**
```json
{
  "timestamp": "2025-12-01T10:00:00Z",
  "level": "info",
  "message": "Appointment created",
  "userId": "user-123",
  "appointmentId": "apt-456",
  "requestId": "req-789"
}
```

---

## 🔒 Güvenlik Best Practices

### Authentication & Authorization

1. **JWT Token Güvenliği:**
   - Token'lar HTTP-only cookie'lerde saklanmalı (mümkünse)
   - Refresh token'lar Redis'te saklanmalı
   - Token expiration süreleri kısa tutulmalı (7 gün max)
   - Token rotation implementasyonu

2. **Password Security:**
   - Minimum 8 karakter, karmaşık şifre zorunluluğu
   - bcrypt ile hash'leme (cost factor: 12+)
   - Rate limiting: Login denemeleri için
   - 2FA desteği (gelecekte)

3. **Role-Based Access Control (RBAC):**
   - Her endpoint için role kontrolü
   - Resource-level authorization (kullanıcı sadece kendi verilerine erişebilir)
   - Tenant isolation (multi-tenant yapı için)

### API Güvenliği

1. **Rate Limiting:**
   ```typescript
   // apps/api/src/main.ts
   app.use(
     rateLimit({
       windowMs: 15 * 60 * 1000, // 15 dakika
       max: 100, // Her IP için 100 istek
     })
   );
   ```

2. **Input Validation:**
   - Tüm input'lar Zod schema ile validate edilmeli
   - SQL injection önleme: Prisma ORM kullanımı
   - XSS önleme: Input sanitization

3. **CORS Ayarları:**
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
     credentials: true,
   });
   ```

4. **Helmet.js:**
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

### Database Güvenliği

1. **Connection Security:**
   - SSL/TLS bağlantıları zorunlu
   - Database credentials environment variables'da
   - Connection pooling

2. **Data Encryption:**
   - Hassas veriler (medical history, notes) field-level encryption
   - At-rest encryption (database level)
   - In-transit encryption (TLS)

3. **Backup Güvenliği:**
   - Encrypted backups
   - Backup retention policy
   - Test restore procedures

### Frontend Güvenliği

1. **XSS Önleme:**
   - React otomatik escape yapar
   - `dangerouslySetInnerHTML` kullanımından kaçın
   - Content Security Policy (CSP) headers

2. **CSRF Koruması:**
   - NextAuth.js otomatik CSRF koruması
   - SameSite cookie ayarları

3. **Environment Variables:**
   - Hassas bilgiler `NEXT_PUBLIC_*` prefix'i ile expose edilmemeli
   - API keys client-side'da saklanmamalı

### Security Headers

**Backend (NestJS):**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Frontend (Next.js):**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### Güvenlik Audit Checklist

- [ ] Dependency vulnerabilities kontrol edildi (`pnpm audit`)
- [ ] Environment variables güvenli saklanıyor
- [ ] HTTPS zorunlu (production)
- [ ] Rate limiting aktif
- [ ] Input validation tüm endpoint'lerde
- [ ] SQL injection koruması (Prisma)
- [ ] XSS koruması
- [ ] CSRF koruması
- [ ] Security headers ayarlandı
- [ ] Logging ve monitoring aktif
- [ ] Backup stratejisi hazır
- [ ] Incident response planı hazır

### Güvenlik Araçları

**Dependency Scanning:**
```bash
# pnpm audit
pnpm audit

# Snyk (ücretsiz)
npx snyk test
```

**Code Scanning:**
- ESLint security plugins
- SonarQube (opsiyonel)

---

## ⚡ Performans Optimizasyonları

### Backend Optimizasyonları

1. **Database Query Optimization:**
   ```typescript
   // ❌ Kötü: N+1 Problem
   const appointments = await prisma.appointment.findMany();
   for (const apt of appointments) {
     const therapist = await prisma.therapistProfile.findUnique({
       where: { id: apt.therapistId }
     });
   }

   // ✅ İyi: Include ile eager loading
   const appointments = await prisma.appointment.findMany({
     include: {
       therapist: true,
       client: true,
     },
   });
   ```

2. **Caching Stratejisi:**
   ```typescript
   // Redis cache kullanımı
   async getTherapists() {
     const cacheKey = 'therapists:list';
     const cached = await this.cache.get(cacheKey);
     
     if (cached) {
       return cached;
     }
     
     const therapists = await this.repository.findTherapists();
     await this.cache.set(cacheKey, therapists, 3600); // 1 saat
     
     return therapists;
   }
   ```

3. **Pagination:**
   ```typescript
   // Cursor-based pagination (büyük listeler için)
   async listAppointments(cursor?: string, limit = 20) {
     return this.prisma.appointment.findMany({
       take: limit,
       skip: cursor ? 1 : 0,
       cursor: cursor ? { id: cursor } : undefined,
       orderBy: { createdAt: 'desc' },
     });
   }
   ```

4. **Database Indexing:**
   ```prisma
   // schema.prisma
   model Appointment {
     therapistId String
     startTime   DateTime
     
     @@index([therapistId, startTime]) // Composite index
     @@index([status]) // Status filtreleme için
   }
   ```

5. **Connection Pooling:**
   ```typescript
   // Prisma connection pool
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // ?connection_limit=10&pool_timeout=20
   }
   ```

### Frontend Optimizasyonları

1. **Code Splitting:**
   ```typescript
   // Dynamic import
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false, // Client-side only
   });
   ```

2. **Image Optimization:**
   ```tsx
   // Next.js Image component
   import Image from 'next/image';
   
   <Image
     src="/profile.jpg"
     width={200}
     height={200}
     alt="Profile"
     loading="lazy"
   />
   ```

3. **API Response Caching:**
   ```typescript
   // React Query veya SWR kullanımı (gelecekte)
   const { data } = useSWR('/api/appointments', fetcher, {
     revalidateOnFocus: false,
     revalidateOnReconnect: false,
     dedupingInterval: 60000, // 1 dakika
   });
   ```

4. **Bundle Size Optimization:**
   ```bash
   # Bundle analyzer
   pnpm build
   pnpm analyze
   ```

5. **Server Components:**
   ```tsx
   // ✅ Server Component (default)
   export default async function Page() {
     const data = await fetchData(); // Server-side
     return <div>{data}</div>;
   }

   // ❌ Client Component (sadece gerektiğinde)
   'use client';
   export default function InteractiveComponent() {
     const [state, setState] = useState();
     return <button onClick={...}>Click</button>;
   }
   ```

### Performance Monitoring

**Backend:**
- Response time tracking
- Database query performance
- Memory usage monitoring
- CPU usage monitoring

**Frontend:**
- Web Vitals (LCP, FID, CLS)
- Bundle size tracking
- API response time
- Error rate tracking

**Araçlar:**
- **Backend:** New Relic, Datadog, Prometheus
- **Frontend:** Vercel Analytics, Google Analytics, Sentry

### Performance Checklist

- [ ] Database query'ler optimize edildi (N+1 önlendi)
- [ ] Gerekli index'ler eklendi
- [ ] Redis cache aktif
- [ ] Pagination implementasyonu
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting yapıldı
- [ ] Bundle size optimize edildi
- [ ] Server Components kullanıldı (mümkün olduğunca)
- [ ] API response caching
- [ ] CDN kullanımı (static assets için)

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
**Versiyon:** 2.0.0

---

## 📚 Ek Kaynaklar

### Öğrenme Materyalleri

- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **Clean Architecture:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

### Yardımcı Araçlar

- **Prisma Studio:** Database görselleştirme
- **Swagger UI:** API dokümantasyonu ve test
- **Postman/Insomnia:** API test araçları
- **Docker Desktop:** Container yönetimi
- **VS Code Extensions:**
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

---

**Not:** Bu dokümantasyon sürekli güncellenmektedir. Yeni özellikler eklendikçe veya mimari değişiklikler yapıldıkça bu dosya güncellenecektir.