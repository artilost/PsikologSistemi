# 🏗️ Mimari Dokümantasyon

## Genel Bakış

Bu proje, modern psikoloji pratiği yönetimi için tasarlanmış enterprise-grade bir monorepo yapısıdır. Domain-Driven Design (DDD) prensipleri ve Clean Architecture yaklaşımı ile inşa edilmiştir.

## 🎯 Teknoloji Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.4 + Shadcn UI
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Data Fetching:** TanStack Query (React Query)
- **Calendar:** FullCalendar 6
- **Authentication:** NextAuth.js 5

### Backend
- **Framework:** NestJS 11
- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.6
- **ORM:** Prisma 5
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Queue:** BullMQ
- **Authentication:** JWT + Passport
- **Validation:** class-validator + Zod
- **Documentation:** Swagger/OpenAPI

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Object Storage:** MinIO (S3-compatible)
- **Identity Provider:** Keycloak 24
- **Monorepo:** Turborepo + pnpm workspaces

## 📁 Proje Yapısı

```
psikolog-sistemi/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── domain/         # Domain entities & business logic
│   │   │   ├── application/    # Use cases & application services
│   │   │   ├── infrastructure/ # External services & persistence
│   │   │   │   ├── database/   # Prisma & DB connections
│   │   │   │   └── cache/      # Redis
│   │   │   ├── presentation/   # Controllers & DTOs
│   │   │   │   ├── auth/       # Authentication module
│   │   │   │   ├── users/      # User management
│   │   │   │   ├── clients/    # Client/patient management
│   │   │   │   ├── appointments/ # Scheduling
│   │   │   │   ├── sessions/   # Therapy sessions
│   │   │   │   ├── payments/   # Billing
│   │   │   │   └── reports/    # Analytics
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── (auth)/     # Auth pages (login, register)
│       │   │   ├── (dashboard)/ # Main app pages
│       │   │   │   ├── appointments/
│       │   │   │   ├── clients/
│       │   │   │   ├── sessions/
│       │   │   │   ├── payments/
│       │   │   │   └── reports/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/     # React components
│       │   │   ├── ui/         # Shadcn components
│       │   │   ├── layout/     # Layout components
│       │   │   └── features/   # Feature-specific components
│       │   ├── lib/            # Utilities & helpers
│       │   │   ├── api/        # API client
│       │   │   └── utils/      # Utility functions
│       │   └── stores/         # Zustand stores
│       ├── public/
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared code between apps
│   │   ├── src/
│   │   │   ├── enums.ts        # Shared enums
│   │   │   ├── types.ts        # TypeScript types
│   │   │   ├── dtos/           # Data Transfer Objects
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   └── utils.ts        # Utility functions
│   │   └── package.json
│   │
│   ├── ui/                     # Shared UI components (future)
│   │   └── package.json
│   │
│   └── config/                 # Shared configs (future)
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       └── codeql.yml          # Security scanning
│
├── docker-compose.yml          # Local development services
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace config
├── package.json                # Root package.json
└── README.md
```

## 🔄 Veri Akışı

### Authentication Flow

```
Client → Next.js → NestJS API → Prisma → PostgreSQL
                       ↓
                   JWT Token
                       ↓
                   Redis Cache
```

### Appointment Booking Flow

```
User (Web/Mobile)
    ↓
Next.js UI
    ↓
API Client (axios)
    ↓
NestJS Controller
    ↓
Application Service (Use Case)
    ↓
Domain Service (Business Logic)
    ↓
Repository (Prisma)
    ↓
PostgreSQL
    ↓
Event Emitter → Queue (BullMQ)
    ↓
Notification Service → SMS/Email/WhatsApp
```

## 🗄️ Veritabanı Şeması

### Ana Tablolar

1. **users** - Tüm kullanıcılar (terapist, danışan, admin)
2. **therapist_profiles** - Terapist profil bilgileri
3. **client_profiles** - Danışan profil bilgileri
4. **appointments** - Randevu kayıtları
5. **sessions** - Terapi seansları ve notları
6. **payments** - Ödeme kayıtları
7. **notifications** - Bildirimler
8. **audit_logs** - Sistem denetim kayıtları
9. **system_configs** - Sistem konfigürasyonları

### İlişkiler

- User 1:1 TherapistProfile
- User 1:1 ClientProfile
- User 1:N Appointments
- Appointment 1:1 Session
- Session 1:1 Payment
- User 1:N Notifications

## 🔐 Güvenlik

### Kimlik Doğrulama

- **JWT Tokens:** Access token (7 gün) + Refresh token (30 gün)
- **Password Hashing:** bcrypt (10 rounds)
- **MFA:** TOTP-based (opsiyonel)
- **Session Management:** Redis-based token store

### Yetkilendirme

- **RBAC (Role-Based Access Control):**
  - SUPER_ADMIN: Tam erişim
  - ADMIN: Yönetici işlemleri
  - THERAPIST: Terapist özellikleri
  - ASSISTANT: Asistan yardımcı özellikleri
  - CLIENT: Danışan kısıtlı erişim

- **Guards:**
  - `JwtAuthGuard`: Token doğrulama
  - `RolesGuard`: Rol bazlı erişim
  - `Public`: Kimlik doğrulaması gerektirmeyen endpoint'ler

### Veri Güvenliği

- **Encryption at Rest:** Database-level encryption
- **Field-Level Encryption:** Hassas klinik notlar için
- **HTTPS/TLS:** Tüm API iletişiminde
- **CORS:** Whitelist-based
- **Rate Limiting:** 100 req/min (default)
- **Helmet.js:** Security headers

### KVKK/GDPR Uyumu

- Açık rıza yönetimi
- Veri işleme kayıtları (audit logs)
- Unutulma hakkı (soft delete)
- Veri taşınabilirliği (export)
- Veri minimizasyonu

## 🔄 State Management

### Backend (NestJS)

- **Dependency Injection:** NestJS IoC container
- **Caching:** Redis (user sessions, frequently accessed data)
- **Queue:** BullMQ (async jobs, notifications, reminders)

### Frontend (Next.js)

- **Server State:** TanStack Query
  - API responses caching
  - Automatic refetching
  - Optimistic updates

- **Client State:** Zustand
  - UI state (modals, sidebars)
  - User preferences
  - Form state (complex forms)

- **URL State:** Next.js routing & searchParams

## 📡 API Tasarımı

### RESTful Endpoints

```
GET    /api/v1/auth/me
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh

GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id

GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/:id
PATCH  /api/v1/clients/:id
DELETE /api/v1/clients/:id

GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id
DELETE /api/v1/appointments/:id
POST   /api/v1/appointments/:id/cancel
POST   /api/v1/appointments/:id/reschedule

GET    /api/v1/sessions
POST   /api/v1/sessions
GET    /api/v1/sessions/:id
PATCH  /api/v1/sessions/:id/notes

GET    /api/v1/payments
POST   /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/process

GET    /api/v1/reports/appointments
GET    /api/v1/reports/revenue
GET    /api/v1/reports/no-shows
```

### Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}

// Paginated
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## 🧪 Test Stratejisi

### Backend Tests

1. **Unit Tests:** Domain logic, services
2. **Integration Tests:** API endpoints, database
3. **E2E Tests:** Complete user flows
4. **Contract Tests:** API contracts (Pact)

### Frontend Tests

1. **Unit Tests:** Components, utilities
2. **Integration Tests:** Feature flows
3. **E2E Tests:** Critical user journeys (Playwright)
4. **Visual Regression:** Chromatic/Percy

### Coverage Goals

- Backend: >80%
- Frontend: >70%
- Critical paths: 100%

## 🚀 Deployment

### Ortamlar

1. **Development:** Local (docker-compose)
2. **Staging:** Azure/AWS (Kubernetes)
3. **Production:** Azure/AWS (Kubernetes + Auto-scaling)

### CI/CD Pipeline

```
Git Push → GitHub Actions
    ↓
Lint & Type Check
    ↓
Run Tests
    ↓
Build Docker Images
    ↓
Push to Registry (ACR/ECR)
    ↓
Deploy to Kubernetes
    ↓
Health Check
    ↓
Notify Team
```

## 📊 Monitoring & Observability

### Metrics

- **Application Metrics:** Response time, error rate, throughput
- **Business Metrics:** Appointments, no-shows, revenue
- **Infrastructure Metrics:** CPU, memory, disk, network

### Logging

- **Structured Logging:** JSON format
- **Log Levels:** ERROR, WARN, INFO, DEBUG
- **Centralized:** ELK Stack / Grafana Loki

### Tracing

- **OpenTelemetry:** Distributed tracing
- **APM:** Application Performance Monitoring

## 🔧 Bakım & Optimizasyon

### Performance

- **Database Indexing:** Strategic indexes on queries
- **Query Optimization:** Prisma query analysis
- **Caching Strategy:** Redis for hot data
- **CDN:** Static assets (S3 + CloudFront)
- **Code Splitting:** Next.js automatic splitting
- **Image Optimization:** Next.js Image component

### Scalability

- **Horizontal Scaling:** Kubernetes replicas
- **Database:** Read replicas
- **Cache:** Redis Cluster
- **Queue:** BullMQ workers scaling

## 📚 Referanslar

- [NestJS Best Practices](https://docs.nestjs.com/techniques/performance)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

