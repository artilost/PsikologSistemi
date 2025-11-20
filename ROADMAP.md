# 🗺️ Psikolog Sistemi - İlerleme Yol Haritası

## 📊 Mevcut Durum Analizi

### ✅ Tamamlanan İşler

#### 1. Proje Altyapısı
- ✅ Monorepo yapısı (Turborepo + pnpm)
- ✅ Docker Compose ile servis orkestrasyonu
- ✅ PostgreSQL, Redis, MinIO, Keycloak container'ları
- ✅ Database şeması (Prisma)
- ✅ TypeScript konfigürasyonu

#### 2. Backend (NestJS API)
- ✅ Domain-Driven Design mimarisi kurulumu
- ✅ Temel JWT authentication
- ✅ Role-based authorization (RBAC)
- ✅ Swagger/OpenAPI dokümantasyonu
- ✅ Zod validation
- ✅ Global exception handling
- ✅ Logging middleware
- ✅ Health check endpoint
- ✅ Auth modülü (register, login, refresh token)
- ✅ User modülü (CRUD operasyonları)

#### 3. Frontend (Next.js)
- ✅ App Router yapısı
- ✅ NextAuth v5 entegrasyonu
- ✅ Middleware ile route protection
- ✅ Tailwind CSS + Shadcn UI hazırlığı
- ✅ Environment konfigürasyonu

#### 4. DevOps
- ✅ Development ortamı setup
- ✅ Hot reload konfigürasyonu
- ✅ Build pipeline (turbo)

---

## 🎯 Yapılacaklar Yol Haritası

### 📌 FAZ 1: Keycloak Entegrasyonu (Öncelik: YÜKSEK)

#### 1.1 Keycloak Realm ve Client Konfigürasyonu
**Süre:** 2-3 saat

**Adımlar:**
1. Keycloak Admin Console'a giriş (http://localhost:8082)
2. Yeni Realm oluştur: `psikolog-realm`
3. Client oluştur:
   - **Client ID:** `psikolog-api`
   - **Client Protocol:** openid-connect
   - **Access Type:** confidential
   - **Valid Redirect URIs:** `http://localhost:3001/*`
   - **Web Origins:** `http://localhost:3000, http://localhost:3001`
4. Frontend için ayrı client:
   - **Client ID:** `psikolog-web`
   - **Access Type:** public
   - **Valid Redirect URIs:** `http://localhost:3000/*`
   - **Web Origins:** `http://localhost:3000`

**Dosyalar:**
```
docs/keycloak/
  ├── realm-setup.md
  ├── realm-export.json
  └── client-config.md
```

#### 1.2 Keycloak Roles ve Permissions
**Süre:** 1-2 saat

**Adımlar:**
1. Realm roles oluştur:
   - `super-admin`
   - `admin`
   - `therapist`
   - `assistant`
   - `client`
2. Composite roles yapılandır
3. Client roles mapping
4. Default roles ayarla

#### 1.3 Backend Keycloak Entegrasyonu
**Süre:** 4-6 saat

**Yapılacaklar:**
- [ ] `nestjs-keycloak-connect` paketi yükleme
- [ ] Keycloak adapter konfigürasyonu
- [ ] JWT Strategy'yi Keycloak JWT'ye çevirme
- [ ] Role guard'ları Keycloak roller ile entegre etme
- [ ] User sync mekanizması (Keycloak ↔ PostgreSQL)
- [ ] Event listener (Keycloak user events → API webhook)

**Yeni Dosyalar:**
```typescript
apps/api/src/infrastructure/keycloak/
  ├── keycloak.module.ts
  ├── keycloak.service.ts
  ├── keycloak-auth.guard.ts
  ├── keycloak-roles.guard.ts
  └── dto/
      ├── keycloak-user.dto.ts
      └── keycloak-token.dto.ts
```

**Değiştirilecek Dosyalar:**
- `apps/api/src/presentation/auth/auth.service.ts` - Keycloak token exchange
- `apps/api/src/presentation/auth/strategies/jwt.strategy.ts` - Keycloak JWT validation
- `apps/api/src/app.module.ts` - Keycloak module import

**Environment Variables (.env):**
```env
KEYCLOAK_BASE_URL=http://localhost:8082
KEYCLOAK_REALM=psikolog-realm
KEYCLOAK_CLIENT_ID=psikolog-api
KEYCLOAK_CLIENT_SECRET=<generate-from-keycloak>
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

#### 1.4 Frontend Keycloak Entegrasyonu
**Süre:** 3-4 saat

**Yapılacaklar:**
- [ ] NextAuth Keycloak provider ekleme
- [ ] Token refresh mekanizması
- [ ] Role-based UI rendering
- [ ] Logout flow (Keycloak + NextAuth)
- [ ] Session management

**Değiştirilecek Dosyalar:**
- `apps/web/auth.config.ts` - Keycloak provider ekle
- `apps/web/middleware.ts` - Role-based redirects

---

### 📌 FAZ 2: MinIO File Storage Entegrasyonu (Öncelik: YÜKSEK)

#### 2.1 MinIO Bucket ve Policy Konfigürasyonu
**Süre:** 1-2 saat

**Adımlar:**
1. MinIO Console'a giriş (http://localhost:9001)
   - User: `minioadmin` / Pass: `minioadmin`
2. Bucket'lar oluştur:
   - `psikolog-avatars` - Kullanıcı profil resimleri
   - `psikolog-documents` - Belgeler (sesyon notları, raporlar)
   - `psikolog-attachments` - Genel dosyalar
   - `psikolog-backups` - Yedekler
3. Access Policy'ler ayarla:
   - `avatars`: Public read
   - `documents`: Private
   - `attachments`: Private
   - `backups`: Private

**Lifecycle Policies:**
- Documents: 7 yıl saklama (KVKK uyumu)
- Avatars: Sınırsız
- Backups: 90 gün

#### 2.2 Backend S3 Client Entegrasyonu
**Süre:** 4-5 saat

**Yapılacaklar:**
- [ ] `@aws-sdk/client-s3` paketi kurulumu
- [ ] MinIO/S3 service oluşturma
- [ ] File upload/download endpoints
- [ ] Signed URL generation (güvenli dosya erişimi)
- [ ] File metadata yönetimi (database)
- [ ] File validation (type, size limits)
- [ ] Virus scanning entegrasyonu (opsiyonel: ClamAV)

**Yeni Dosyalar:**
```typescript
apps/api/src/infrastructure/storage/
  ├── storage.module.ts
  ├── storage.service.ts
  ├── s3-client.service.ts
  └── dto/
      ├── file-upload.dto.ts
      ├── file-metadata.dto.ts
      └── signed-url.dto.ts

apps/api/src/presentation/files/
  ├── files.controller.ts
  ├── files.service.ts
  └── files.module.ts
```

**Prisma Schema Eklentileri:**
```prisma
model File {
  id          String   @id @default(cuid())
  fileName    String
  originalName String
  mimeType    String
  size        Int
  bucket      String
  key         String   // S3 object key
  url         String?  // Public URL (if applicable)
  uploadedBy  String
  user        User     @relation(fields: [uploadedBy], references: [id])
  
  metadata    Json?    // Additional metadata
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete
  
  @@index([uploadedBy])
  @@index([bucket])
}
```

**Environment Variables:**
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1
S3_BUCKET_AVATARS=psikolog-avatars
S3_BUCKET_DOCUMENTS=psikolog-documents
S3_BUCKET_ATTACHMENTS=psikolog-attachments
S3_USE_SSL=false
```

#### 2.3 Frontend File Upload Component
**Süre:** 3-4 saat

**Yapılacaklar:**
- [ ] Drag & drop file upload component
- [ ] Progress indicator
- [ ] File preview (images, PDFs)
- [ ] Multi-file upload
- [ ] Client-side validation
- [ ] Error handling

**Yeni Dosyalar:**
```typescript
apps/web/src/components/shared/
  ├── FileUpload.tsx
  ├── FilePreview.tsx
  ├── FileList.tsx
  └── DropZone.tsx

apps/web/src/lib/
  └── file-upload.ts  // Upload utilities
```

---

### 📌 FAZ 3: Core Domain Implementations (Öncelik: ORTA-YÜKSEK)

#### 3.1 Client (Danışan) Management
**Süre:** 8-10 saat

**Backend:**
- [ ] Client profile CRUD endpoints
- [ ] Client search & filtering
- [ ] Client history tracking
- [ ] Emergency contact management
- [ ] Consent form management (KVKK)
- [ ] Client notes (encrypted)

**Frontend:**
- [ ] Client list view (table/grid)
- [ ] Client detail page
- [ ] Client create/edit forms
- [ ] Client search & filters
- [ ] Client dashboard

**Dosyalar:**
```
apps/api/src/presentation/clients/
  ├── clients.controller.ts
  ├── clients.service.ts
  ├── dto/
  └── clients.module.ts

apps/web/src/app/(dashboard)/clients/
  ├── page.tsx
  ├── [id]/page.tsx
  ├── new/page.tsx
  └── components/
```

#### 3.2 Appointment Scheduling
**Süre:** 10-12 saat

**Backend:**
- [ ] Appointment CRUD
- [ ] Availability management (therapist takvimi)
- [ ] Conflict detection
- [ ] Recurring appointments
- [ ] Appointment reminders (queue)
- [ ] Waitlist management

**Frontend:**
- [ ] Calendar view (FullCalendar)
- [ ] Appointment booking flow
- [ ] Drag & drop rescheduling
- [ ] Time slot selection
- [ ] Reminder settings

**Entegrasyonlar:**
- BullMQ queue (reminder jobs)
- Email/SMS notifications
- Google Calendar sync (opsiyonel)

#### 3.3 Session Notes & Documentation
**Süre:** 8-10 saat

**Backend:**
- [ ] Session notes CRUD
- [ ] Template system (customizable note templates)
- [ ] Field-level encryption (hassas bilgiler)
- [ ] Version history
- [ ] Note sharing (with consent)
- [ ] Export to PDF

**Frontend:**
- [ ] Rich text editor (Tiptap/Slate)
- [ ] Template selector
- [ ] Auto-save functionality
- [ ] Voice-to-text (opsiyonel)
- [ ] Session timer

#### 3.4 Payments & Billing
**Süre:** 10-12 saat

**Backend:**
- [ ] Payment CRUD
- [ ] Invoice generation
- [ ] Payment gateway integration (iyzico/Stripe)
- [ ] Payment reminders
- [ ] Refund handling
- [ ] Financial reports

**Frontend:**
- [ ] Payment list & filters
- [ ] Invoice viewer/download
- [ ] Payment form
- [ ] Subscription management (if applicable)

---

### 📌 FAZ 4: Advanced Features (Öncelik: ORTA)

#### 4.1 Notifications System
**Süre:** 6-8 saat

**Backend:**
- [ ] Notification service (email, SMS, WhatsApp, push)
- [ ] Template engine
- [ ] Queue processing (BullMQ)
- [ ] Delivery tracking
- [ ] Notification preferences

**Frontend:**
- [ ] In-app notification center
- [ ] Notification preferences UI
- [ ] Real-time notifications (WebSocket/SSE)

**Entegrasyonlar:**
- Twilio (SMS)
- SendGrid/Mailgun (Email)
- Firebase Cloud Messaging (Push)
- WhatsApp Business API

#### 4.2 Reporting & Analytics
**Süre:** 8-10 saat

**Backend:**
- [ ] Analytics service
- [ ] Custom report builder
- [ ] Data aggregation queries
- [ ] Export functionality (CSV, Excel, PDF)

**Frontend:**
- [ ] Dashboard widgets
- [ ] Chart components (Chart.js/Recharts)
- [ ] Report builder UI
- [ ] Date range filters

**Metrics:**
- Appointment statistics
- Revenue metrics
- Client demographics
- Session completion rates
- No-show rates

#### 4.3 Multi-tenancy (Çoklu Klinik Desteği)
**Süre:** 12-15 saat

**Backend:**
- [ ] Tenant model & middleware
- [ ] Tenant isolation (database-level)
- [ ] Tenant-specific configurations
- [ ] Cross-tenant admin panel

**Frontend:**
- [ ] Tenant switcher
- [ ] Tenant-specific branding
- [ ] Organization management

#### 4.4 Audit Logging & Compliance
**Süre:** 6-8 saat

**Backend:**
- [ ] Audit log service
- [ ] Automatic logging (decorators)
- [ ] Log retention policies
- [ ] KVKK compliance reports
- [ ] Data export (GDPR right to data portability)

**Frontend:**
- [ ] Audit log viewer
- [ ] Compliance dashboard
- [ ] Data export UI

---

### 📌 FAZ 5: Mobile App (React Native) (Öncelik: DÜŞÜK)

#### 5.1 Mobile App Foundation
**Süre:** 15-20 saat

- [ ] Expo setup
- [ ] Navigation (React Navigation)
- [ ] Authentication flow
- [ ] API client
- [ ] Offline-first architecture (WatermelonDB)
- [ ] Push notifications

#### 5.2 Core Features
- [ ] Appointment management (client & therapist views)
- [ ] Session notes (therapist)
- [ ] Client profiles (therapist)
- [ ] Notifications
- [ ] Calendar integration
- [ ] Payment processing

---

### 📌 FAZ 6: Testing & Quality Assurance (Öncelik: SÜREKLİ)

#### 6.1 Backend Testing
**Süre:** 10-15 saat

- [ ] Unit tests (Jest)
  - Services
  - Repositories
  - Value objects
- [ ] Integration tests
  - API endpoints
  - Database operations
- [ ] E2E tests (Supertest)
  - Complete user flows

**Target Coverage:** 80%+

#### 6.2 Frontend Testing
**Süre:** 8-12 saat

- [ ] Component tests (React Testing Library)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
  - Login flow
  - Appointment booking
  - Client management

**Target Coverage:** 70%+

#### 6.3 Security Testing
- [ ] OWASP ZAP scan
- [ ] Dependency vulnerability check (npm audit)
- [ ] Penetration testing (if budget allows)

---

### 📌 FAZ 7: DevOps & Deployment (Öncelik: ORTA)

#### 7.1 CI/CD Pipeline Enhancement
**Süre:** 6-8 saat

- [ ] GitHub Actions workflows
  - Automated testing
  - Build & deploy
  - Semantic versioning
- [ ] Docker multi-stage builds
- [ ] Docker Compose production config
- [ ] Kubernetes manifests (if needed)

#### 7.2 Production Environment Setup
**Süre:** 10-15 saat

- [ ] VPS/Cloud provider seçimi (AWS, DigitalOcean, Hetzner)
- [ ] SSL certificates (Let's Encrypt)
- [ ] Domain setup
- [ ] Database backups (automated)
- [ ] Monitoring (Prometheus + Grafana / Sentry)
- [ ] Logging (ELK Stack / CloudWatch)
- [ ] CDN setup (CloudFlare)

#### 7.3 Database Migrations & Seeding
- [ ] Production migration strategy
- [ ] Database seeding scripts (initial data)
- [ ] Data migration tools

---

## 🚀 Hızlı Başlangıç: İlk 3 Adım

### 1️⃣ Keycloak Realm Setup (Hemen Yapılacak)
```bash
# Keycloak'a giriş yap
# http://localhost:8082
# User: admin / Pass: admin

# Realm oluştur: "psikolog-realm"
# Client oluştur: "psikolog-api" ve "psikolog-web"
# Roles oluştur: super-admin, admin, therapist, assistant, client
```

### 2️⃣ MinIO Bucket Setup (Hemen Yapılacak)
```bash
# MinIO'ya giriş yap
# http://localhost:9001
# User: minioadmin / Pass: minioadmin

# Bucket'ları oluştur:
# - psikolog-avatars (public)
# - psikolog-documents (private)
# - psikolog-attachments (private)
# - psikolog-backups (private)
```

### 3️⃣ Backend Keycloak & MinIO Entegrasyonu
```bash
# Gerekli paketleri yükle
cd apps/api
pnpm add @nestjs/keycloak-connect keycloak-connect
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Storage modülünü oluştur
nest g module infrastructure/storage
nest g service infrastructure/storage

# Keycloak modülünü oluştur
nest g module infrastructure/keycloak
nest g service infrastructure/keycloak
```

---

## 📊 Önceliklendirme Matrisi

| Özellik | Öncelik | Süre | Zorluk | Business Value |
|---------|---------|------|--------|----------------|
| Keycloak Entegrasyonu | 🔴 Çok Yüksek | 10h | Orta | Kritik |
| MinIO File Storage | 🔴 Çok Yüksek | 8h | Kolay | Kritik |
| Client Management | 🟠 Yüksek | 10h | Orta | Yüksek |
| Appointment System | 🟠 Yüksek | 12h | Yüksek | Yüksek |
| Session Notes | 🟠 Yüksek | 10h | Orta | Yüksek |
| Payment System | 🟡 Orta | 12h | Yüksek | Yüksek |
| Notifications | 🟡 Orta | 8h | Orta | Orta |
| Reporting | 🟡 Orta | 10h | Orta | Orta |
| Mobile App | 🟢 Düşük | 30h | Yüksek | Orta |
| Multi-tenancy | 🟢 Düşük | 15h | Çok Yüksek | Düşük |

---

## 🎯 Sprint Planning Önerisi

### Sprint 1 (2 hafta) - Foundation
- ✅ Keycloak tam entegrasyonu
- ✅ MinIO file storage
- ✅ Client management (basic CRUD)
- ✅ UI/UX iyileştirmeleri

### Sprint 2 (2 hafta) - Core Features
- ✅ Appointment scheduling
- ✅ Calendar integration
- ✅ Session notes (basic)
- ✅ Email notifications

### Sprint 3 (2 hafta) - Advanced Features
- ✅ Payment system
- ✅ Invoice generation
- ✅ Reporting dashboard
- ✅ Advanced search & filters

### Sprint 4 (2 hafta) - Polish & Testing
- ✅ Comprehensive testing
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Documentation

### Sprint 5+ (Opsiyonel)
- Mobile app development
- Multi-tenancy
- Advanced analytics
- Third-party integrations

---

## 📚 Önerilen Kaynaklar

### Keycloak
- [Official Keycloak Documentation](https://www.keycloak.org/documentation)
- [nestjs-keycloak-connect](https://github.com/ferrerojosh/nest-keycloak-connect)

### MinIO
- [MinIO Node.js SDK](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [AWS SDK for JavaScript v3 - S3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)

### NestJS Patterns
- [NestJS Documentation - File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Domain-Driven Design in NestJS](https://www.thisdot.co/blog/domain-driven-design-in-nestjs)

### Next.js
- [NextAuth.js Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [File Upload in Next.js](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#formdata)

---

## 🔧 Geliştirme Standartları

### Commit Convention
```
feat: add user avatar upload
fix: resolve keycloak token refresh issue
docs: update API documentation
test: add appointment service tests
refactor: improve error handling
chore: update dependencies
```

### Branch Strategy
```
main (production)
  ├── develop (integration)
  │   ├── feature/keycloak-integration
  │   ├── feature/file-upload
  │   └── feature/appointment-booking
  └── hotfix/critical-bug
```

### Code Review Checklist
- [ ] Tests yazıldı mı?
- [ ] TypeScript tipleri doğru mu?
- [ ] Error handling uygun mu?
- [ ] Security best practices uygulandı mı?
- [ ] Documentation güncellendi mi?
- [ ] Performance optimizasyonları yapıldı mı?

---

## 📈 Başarı Metrikleri (KPIs)

### Technical Metrics
- Code coverage: >80%
- API response time: <200ms (p95)
- Zero critical security vulnerabilities
- Build time: <5 min

### Business Metrics
- User onboarding time: <10 min
- Appointment booking success rate: >95%
- System uptime: >99.9%
- User satisfaction score: >4.5/5

---

## 🎉 Tamamlama Kriterleri

Proje **Production-Ready** olduğunda:
- ✅ Tüm core features implement edildi
- ✅ Test coverage >80%
- ✅ Security audit tamamlandı
- ✅ Performance benchmarks karşılandı
- ✅ Documentation tamamlandı
- ✅ Production deployment yapıldı
- ✅ Monitoring & alerting aktif

---

**Son Güncelleme:** 18 Kasım 2025
**Versiyon:** 1.0
**Durum:** 🟡 In Progress (Phase 1 - Keycloak & MinIO Integration)

