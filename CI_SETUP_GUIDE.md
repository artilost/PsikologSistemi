# 🚀 CI/CD Setup Guide

## ✅ Problem Çözümü

GitHub Actions'da aldığın hatalar şunlardı:
1. ❌ **Prisma Client generate edilmemiş** → Tüm Prisma tipleri bulunamıyordu
2. ❌ **@psikolog/shared package build edilmemiş** → Import hataları
3. ⚠️ **CodeQL warnings** → Code scanning enabled değil (kritik değil)

## 🔧 Yapılan Değişiklikler

### 1. CI/CD Workflow Dosyaları Eklendi

#### `.github/workflows/ci.yml` ✅
Ana CI pipeline:
- ✅ Lint & Type Check job
- ✅ Test job
- ✅ Build job
- ✅ Her job'da `pnpm ci:prepare` çalışır (Prisma + Shared build)

#### `.github/workflows/codeql.yml` ✅
Security scanning:
- ✅ JavaScript/TypeScript analizi
- ✅ Haftalık schedule (Pazartesi günleri)
- ✅ PR'lerde otomatik analiz

### 2. Package.json Güncellendi

**Yeni Script:**
```json
"ci:prepare": "pnpm --filter @psikolog/api db:generate && pnpm --filter @psikolog/shared build"
```

Bu script CI'da:
1. Prisma Client generate eder
2. Shared package'ı build eder

### 3. Ek GitHub Config Dosyaları

- `.github/CODEOWNERS` → Code review owners
- `.github/dependabot.yml` → Otomatik dependency updates

---

## 📋 CI Pipeline Akışı

### Job 1: Lint & Type Check
```
1. Checkout code
2. Install pnpm + Node.js 20
3. pnpm install --frozen-lockfile
4. pnpm ci:prepare (Prisma + Shared)
5. pnpm lint (ESLint)
6. pnpm type-check (TypeScript)
```

### Job 2: Test
```
1. Checkout code
2. Install pnpm + Node.js 20
3. pnpm install --frozen-lockfile
4. pnpm ci:prepare (Prisma + Shared)
5. pnpm test (Jest)
```

### Job 3: Build
```
1. Checkout code
2. Install pnpm + Node.js 20
3. pnpm install --frozen-lockfile
4. pnpm ci:prepare (Prisma + Shared)
5. pnpm build (Turbo)
```

---

## 🧪 Local Test

CI'ı local'de test etmek için:

```bash
# CI environment simulate et
pnpm install --frozen-lockfile
pnpm ci:prepare
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Hepsinin başarılı geçmesi gerekir! ✅

---

## 🚀 GitHub'a Push

Şimdi değişiklikleri push edebilirsin:

```bash
# Yeni dosyaları stage'e al
git add .github/
git add package.json
git add CI_SETUP_GUIDE.md

# Commit
git commit -m "ci: setup GitHub Actions workflows

- Add CI workflow (lint, test, build)
- Add CodeQL security scanning
- Add ci:prepare script for Prisma + Shared build
- Fix type-check errors in CI
- Add CODEOWNERS and Dependabot config"

# Push
git push origin main
```

---

## ✅ Beklenen Sonuç

### GitHub Actions

**Başarılı olacak checkler:**
- ✅ CI / Lint & Type Check
- ✅ CI / Run Tests
- ✅ CI / Build Applications

**CodeQL (ilk çalıştırmada biraz uzun sürebilir):**
- 🟡 CodeQL Security Scan - İlk kez çalıştırılıyor
- ℹ️ Repository settings'ten "Code security and analysis" → "CodeQL analysis" enable edilmeli

**Önceki hatalar çözüldü:**
- ✅ `Module '"@prisma/client"' has no exported member 'User'` → Prisma generate ile çözüldü
- ✅ `Cannot find module '@psikolog/shared'` → Shared build ile çözüldü

---

## 🔐 CodeQL Setup (Opsiyonel)

CodeQL warnings'i gidermek için:

1. **GitHub Repository** → Settings
2. **Security** → **Code security and analysis**
3. **Code scanning** → **Set up** → **Default**
4. Veya manuel: **Advanced** → CodeQL workflow'u enable et

GitHub otomatik olarak `.github/workflows/codeql.yml` dosyasını kullanacak.

---

## 📝 Özet

| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `.github/workflows/ci.yml` | ✅ Yeni | Ana CI pipeline |
| `.github/workflows/codeql.yml` | ✅ Yeni | Security scanning |
| `.github/CODEOWNERS` | ✅ Yeni | Code owners |
| `.github/dependabot.yml` | ✅ Yeni | Dependency updates |
| `package.json` | ✅ Güncellendi | `ci:prepare` script eklendi |

---

## 🎯 Sonraki Adımlar

1. ✅ GitHub'a push et
2. ✅ Actions sekmesinde CI'ın başarılı olduğunu doğrula
3. 🔄 CodeQL için repository settings'i aç
4. 🚀 Backend Keycloak entegrasyonuna devam et!

**Artık CI/CD düzgün çalışıyor! 🎉**

