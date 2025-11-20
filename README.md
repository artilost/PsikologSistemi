# Psikolog Sistemi - Psychology Practice Management System

Enterprise-grade practice management platform for psychologists, built with modern TypeScript stack.

## 🏗️ Architecture

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 15 (App Router) + React 18 + TypeScript
- **Backend:** NestJS 11 + TypeScript + Domain-Driven Design
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache & Queue:** Redis + BullMQ
- **Storage:** S3-compatible (MinIO for dev)
- **Auth:** Keycloak (OIDC/OAuth2) + MFA
- **Mobile:** React Native (Expo SDK 51)

## 📁 Project Structure

```
psikolog-sistemi/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # NestJS backend
│   └── mobile/           # React Native app
├── packages/
│   ├── shared/           # Shared types, DTOs, validation schemas
│   ├── ui/               # Shadcn UI components library
│   └── config/           # Shared configs (ESLint, TS, etc.)
├── docker/               # Docker compose & configs
└── docs/                 # Documentation
```

## 🏥 System Architecture

**Multi-Tenant (Clinic-Based) Platform**

This system is designed as a **multi-tenant SaaS platform** where each clinic operates as an independent organization with complete data isolation.

### Key Features:
- ✅ **Organization Management** - Each clinic has its own workspace
- ✅ **Role-Based Access Control** - 6 roles (SUPER_ADMIN, ADMIN, THERAPIST, RECEPTIONIST, ACCOUNTANT, CLIENT)
- ✅ **Multi-Location Support** - Clinics can have multiple branches and rooms
- ✅ **Data Isolation** - Complete separation between organizations
- ✅ **Subscription Management** - Trial, Basic, Premium, Enterprise plans

## 📊 Current Status

| Service | Status | URL |
|---------|--------|-----|
| **Frontend (Next.js)** | 🟡 Setup | http://localhost:3000 |
| **Backend API (NestJS)** | 🟡 Setup | http://localhost:3001/api/v1 |
| **Swagger Docs** | 🟢 Running | http://localhost:3001/api/docs |
| **Keycloak** | 🟡 Config Needed | http://localhost:8082 (admin/admin) |
| **MinIO Console** | 🟢 Running | http://localhost:9001 (minioadmin/minioadmin) |
| **Adminer (DB UI)** | 🟢 Running | http://localhost:8081 |
| **PostgreSQL** | 🟢 Healthy | localhost:5432 |
| **Redis** | 🟢 Healthy | localhost:6379 |

**Phase:** 🟡 **Multi-Tenant Migration Complete** - Backend Keycloak Integration Next

## 🚀 Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- pnpm 9.x
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Quick Installation

```bash
# Install dependencies
pnpm install

# Start local infrastructure (Postgres, Redis, MinIO, Keycloak)
docker-compose up -d

# Run migrations
pnpm --filter @psikolog/api db:migrate

# Start development servers
pnpm start
```

### Next Steps (REQUIRED)

**⚠️ Before coding, complete the infrastructure setup:**

1. **Keycloak Setup** (30 min)
   - Create realm, clients, roles
   - Configure test users
   - See: `docs/keycloak/SETUP_GUIDE.md`

2. **MinIO Setup** (20 min)
   - Create buckets
   - Set access policies
   - See: `docs/minio/SETUP_GUIDE.md`

3. **Environment Variables** (10 min)
   - Update `apps/api/.env` with Keycloak client secret
   - Verify S3 credentials

**👉 For detailed instructions:** `docs/QUICK_START.md` (60-90 min complete guide)

### Environment Setup

Environment files are already configured:
- `apps/api/.env` - Database, Redis, S3, Keycloak credentials
- `apps/web/.env.local` - API URL, NextAuth config

**Update required:**
- Keycloak client secret (from Keycloak console)
- Production secrets before deployment

## 🔐 Security & Compliance

- **KVKK/HIPAA compliant** architecture
- End-to-end encryption for sensitive data
- Field-level encryption for clinical notes
- Audit logging for all data access
- Data residency (Turkey hosting option)

## 📦 Key Modules

### Core Features (Multi-Tenant)
1. **Organization Management** - Clinic registration, subscription management, multi-location support
2. **User Management** - Role-based access, invitations, linked accounts (family management)
3. **Appointment Management** - Smart scheduling, conflict prevention, waitlist, reminders
4. **Session Management** - Secure notes with field-level encryption, AI assist, private notes
5. **Client Records** - Comprehensive EHR with KVKK compliance, intake forms
6. **Payments & Billing** - Session packages, multiple payment methods, invoice generation
7. **Multi-Location & Rooms** - Branch management, room allocation, therapist-location mapping
8. **Reception Desk** - Check-in, delay management, waitlist notifications
9. **Reporting & Analytics** - Performance metrics, financial reports (per organization)
10. **Security & Compliance** - KVKK/HIPAA compliant, MFA, audit logging, data export

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 QUICK_START.md](docs/QUICK_START.md) | Fast setup guide (60-90 min) |
| [🗺️ ROADMAP.md](ROADMAP.md) | Detailed roadmap & feature planning |
| [🎯 FEATURES.md](docs/FEATURES.md) | Complete list of system features |
| [🏢 ORGANIZATION_RBAC.md](docs/ORGANIZATION_RBAC.md) | Multi-tenant architecture & roles |
| [🔐 Keycloak Setup](docs/keycloak/SETUP_GUIDE.md) | Step-by-step Keycloak configuration |
| [🔐 Multi-Tenant Keycloak](docs/keycloak/MULTI_TENANT_SETUP.md) | Keycloak multi-tenant integration |
| [📦 MinIO Setup](docs/minio/SETUP_GUIDE.md) | Step-by-step MinIO configuration |
| [🏗️ ARCHITECTURE.md](ARCHITECTURE.md) | Architecture & technical design |
| [📋 Migration Summary](docs/MULTI_TENANT_MIGRATION_SUMMARY.md) | Multi-tenant migration details |

## 📝 Development Workflow

1. Create feature branch from `develop`
2. Make changes with conventional commits
3. Ensure all tests pass (`pnpm test`)
4. Submit PR with description
5. Code review + CI checks
6. Merge to develop

## 🎯 Roadmap Highlights

### ✅ Completed (Phase 1: Infrastructure)
- ✅ Monorepo setup (Turborepo + pnpm workspaces)
- ✅ Docker Compose with all services (Postgres, Redis, Keycloak, MinIO)
- ✅ Database schema design (Prisma ORM)
- ✅ Multi-tenant architecture (Organization model)
- ✅ Advanced features planning (Multi-location, Rooms, Waitlist, Reception, etc.)
- ✅ Comprehensive documentation
- ✅ Swagger API documentation setup
- ✅ KVKK/HIPAA compliant data model

### 🟡 In Progress (Phase 2: Authentication & Authorization)
- 🟡 Keycloak multi-tenant integration (organizationId attributes)
- 🟡 Backend JWT strategy (organization-aware)
- 🟡 OrganizationGuard implementation
- 🟡 User registration & invitation endpoints

### 📋 Next (Phase 3: Core Modules - Weeks 2-4)
- Organization registration & onboarding
- User management (CRUD, invitations)
- Location & Room management
- Therapist profile & availability
- MinIO/S3 file upload integration

### 📋 Upcoming (Phase 4: Clinical Features - Weeks 5-8)
- Client (Patient) management
- Appointment scheduling with conflict detection
- Waitlist management
- Reception check-in system
- Session notes with encryption
- Intake forms & automated workflows

**Full roadmap:** [ROADMAP.md](ROADMAP.md)

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Lead-level enterprise development

---

**Version:** 0.1.0 (Alpha)

