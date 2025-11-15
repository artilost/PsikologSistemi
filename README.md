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

## 🚀 Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- pnpm 9.x
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Installation

```bash
# Install dependencies
pnpm install

# Start local infrastructure (Postgres, Redis, MinIO)
docker-compose up -d

# Run migrations
pnpm --filter @psikolog/api db:migrate

# Start development servers
pnpm dev
```

### Environment Setup

Copy `.env.example` files in each app and configure:
- `apps/api/.env` - Database, Redis, S3 credentials
- `apps/web/.env.local` - API URL, auth config

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

## 📝 Development Workflow

1. Create feature branch from `develop`
2. Make changes with conventional commits
3. Ensure all tests pass (`pnpm test`)
4. Submit PR with description
5. Code review + CI checks
6. Merge to develop

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Lead-level enterprise development

---

**Version:** 0.1.0 (Alpha)

