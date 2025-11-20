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

## 📊 Current Status

| Service | Status | URL |
|---------|--------|-----|
| **Frontend (Next.js)** | 🟢 Running | http://localhost:3000 |
| **Backend API (NestJS)** | 🟢 Running | http://localhost:3001/api/v1 |
| **Swagger Docs** | 🟢 Running | http://localhost:3001/api/docs |
| **Keycloak** | 🟢 Running | http://localhost:8082 (admin/admin) |
| **MinIO Console** | 🟢 Running | http://localhost:9001 (minioadmin/minioadmin) |
| **Adminer (DB UI)** | 🟢 Running | http://localhost:8081 |
| **PostgreSQL** | 🟢 Healthy | localhost:5432 |
| **Redis** | 🟢 Healthy | localhost:6379 |

**Phase:** 🟡 Infrastructure Setup (Keycloak & MinIO Configuration Required)

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

1. **Appointment Management** - Smart scheduling, conflict prevention, reminders
2. **Client Records** - Secure EHR with customizable templates
3. **Session Notes** - Flexible note-taking with optional AI assist
4. **Payments & Billing** - iyzico/Stripe integration, invoice generation
5. **Reporting & Analytics** - Performance metrics, financial reports
6. **Security & Access Control** - ABAC policies, MFA, session management

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
| [🎯 NEXT_STEPS.md](docs/NEXT_STEPS.md) | Immediate next steps & priorities |
| [🔐 Keycloak Setup](docs/keycloak/SETUP_GUIDE.md) | Step-by-step Keycloak configuration |
| [📦 MinIO Setup](docs/minio/SETUP_GUIDE.md) | Step-by-step MinIO configuration |
| [🏗️ ARCHITECTURE.md](ARCHITECTURE.md) | Architecture & technical design |

## 📝 Development Workflow

1. Create feature branch from `develop`
2. Make changes with conventional commits
3. Ensure all tests pass (`pnpm test`)
4. Submit PR with description
5. Code review + CI checks
6. Merge to develop

## 🎯 Roadmap Highlights

### ✅ Completed
- Project infrastructure & monorepo setup
- Docker Compose with all services
- Basic JWT authentication
- NextAuth v5 integration
- Database schema & migrations
- Swagger API documentation

### 🟡 In Progress (Next 1-2 Weeks)
- Keycloak SSO integration (backend & frontend)
- MinIO/S3 file storage integration
- File upload endpoints & components

### 📋 Upcoming (Next 2-4 Weeks)
- Client (Patient) management module
- Appointment scheduling system
- Session notes with rich text editor
- Payment & billing system

**Full roadmap:** [ROADMAP.md](ROADMAP.md)

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Lead-level enterprise development

---

**Version:** 0.1.0 (Alpha)

