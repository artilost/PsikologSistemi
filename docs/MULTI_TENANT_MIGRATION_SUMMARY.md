# 🎯 Multi-Tenant Migration - Özet

## ✅ Yapılan Değişiklikler

### 1. Database Schema Güncellemeleri

#### 1.1 Yeni Organization Modeli
```prisma
model Organization {
  id                     String    @id @default(cuid())
  name                   String
  slug                   String    @unique
  description            String?
  logo                   String?
  email                  String?
  phone                  String?
  website                String?
  address                String?
  city                   String?
  country                String    @default("Turkey")
  taxNumber              String?   @unique
  taxOffice              String?
  subscriptionPlan       String    @default("trial")
  subscriptionStatus     String    @default("active")
  subscriptionExpiresAt  DateTime?
  settings               Json?
  isActive               Boolean   @default(true)
  
  // Relations
  users                  User[]
  locations              Location[]
}
```

#### 1.2 User Modeli Güncellemeleri
- ✅ `organizationId` eklendi
- ✅ `organization` ilişkisi eklendi
- ✅ Index eklendi: `@@index([organizationId])`

#### 1.3 Location Modeli Güncellemeleri
- ✅ `organizationId` eklendi (zorunlu)
- ✅ `organization` ilişkisi eklendi
- ✅ Index eklendi: `@@index([organizationId])`

#### 1.4 UserRole Enum Güncellemeleri
**Eski:**
```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  THERAPIST
  ASSISTANT
  CLIENT
}
```

**Yeni:**
```prisma
enum UserRole {
  SUPER_ADMIN     // Platform yöneticisi
  ADMIN           // Klinik yöneticisi
  THERAPIST       // Terapist
  RECEPTIONIST    // Resepsiyonist
  ACCOUNTANT      // Muhasebe
  CLIENT          // Danışan
}
```

⚠️ **Önemli:** `ASSISTANT` rolü kaldırıldı ve `RECEPTIONIST` + `ACCOUNTANT` rolleri eklendi.

---

### 2. Yeni Dökümanlar

#### 2.1 ORGANIZATION_RBAC.md
- 🏢 Organization yapısı açıklaması
- 👥 Tüm roller ve yetkileri
- 🔐 Data isolation stratejisi
- 🎯 Best practices

**Lokasyon:** `docs/ORGANIZATION_RBAC.md`

#### 2.2 MULTI_TENANT_SETUP.md
- 🔐 Keycloak multi-tenant kurulumu
- 🎯 Single Realm vs Multiple Realms
- 👤 User attributes (organizationId)
- 🗺️ Protocol mappers
- 💻 Backend & Frontend entegrasyon örnekleri
- 🧪 Test kullanıcı oluşturma

**Lokasyon:** `docs/keycloak/MULTI_TENANT_SETUP.md`

#### 2.3 FEATURES.md Güncellemesi
- 🏥 Multi-tenant yapı açıklaması eklendi
- 0. ORGANİZASYON YÖNETİMİ bölümü eklendi
- Kullanıcı rolleri güncellendi
- Organizasyon ilişkisi açıklandı

**Lokasyon:** `docs/FEATURES.md`

---

## 📊 Database Değişiklikleri

### Yeni Tablolar
1. ✅ `organizations` - Klinik bilgileri

### Güncellenen Tablolar
1. ✅ `users` - `organization_id` kolonu eklendi
2. ✅ `locations` - `organization_id` kolonu eklendi (zorunlu)

### Enum Değişiklikleri
1. ✅ `UserRole` - `ASSISTANT` kaldırıldı, `RECEPTIONIST` ve `ACCOUNTANT` eklendi

---

## 🎯 Sonraki Adımlar (Backend Keycloak Entegrasyonu)

### 1. Keycloak Konfigürasyonu
- [ ] User attribute ekle: `organizationId`
- [ ] Protocol mapper ekle: `organizationId` → Token claim
- [ ] Test kullanıcıları oluştur

### 2. NestJS Backend
- [ ] JWT Strategy güncelle (organizationId validation)
- [ ] OrganizationGuard implement et
- [ ] AuthService güncelle (Keycloak entegrasyon)
- [ ] Organization registration endpoint
- [ ] User invitation endpoint

### 3. API Endpoints
```typescript
// Auth
POST   /api/v1/auth/register-organization
POST   /api/v1/auth/login
POST   /api/v1/auth/logout

// Organizations (SUPER_ADMIN only)
GET    /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id
DELETE /api/v1/organizations/:id

// Users (ADMIN can manage own org users)
POST   /api/v1/users/invite
GET    /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

// Locations (ADMIN manages locations)
POST   /api/v1/locations
GET    /api/v1/locations
PATCH  /api/v1/locations/:id
DELETE /api/v1/locations/:id

// Rooms (ADMIN manages rooms)
POST   /api/v1/rooms
GET    /api/v1/rooms
PATCH  /api/v1/rooms/:id
DELETE /api/v1/rooms/:id
```

### 4. Frontend
- [ ] NextAuth.js Keycloak provider kur
- [ ] Organization context (Zustand store)
- [ ] Organization registration page
- [ ] Organization settings page
- [ ] User invitation flow

---

## 🧪 Test Senaryoları

### Senaryo 1: Klinik Kaydı
1. Kullanıcı `/register` sayfasına gider
2. Klinik bilgilerini doldurur
3. Admin kullanıcı bilgilerini girer
4. Sistem:
   - Organization oluşturur
   - Keycloak'ta kullanıcı oluşturur (organizationId attribute ile)
   - PostgreSQL'de User oluşturur
   - Email verification gönderir
5. Kullanıcı email'i doğrular
6. Login olur → Dashboard'a yönlendirilir

### Senaryo 2: Terapist Davet
1. ADMIN `/settings/users` sayfasına gider
2. "Terapist Davet Et" butonuna tıklar
3. Email ve temel bilgileri girer
4. Sistem:
   - Keycloak'ta kullanıcı oluşturur (aynı organizationId)
   - PostgreSQL'de User oluşturur
   - Davet email'i gönderir
5. Terapist email'deki linke tıklar
6. Şifre oluşturur
7. Profil tamamlar (lisans, uzmanlık)
8. Login olur → Kendi dashboard'ına yönlendirilir

### Senaryo 3: Data Isolation Test
1. Kadıköy Psikoloji'den ADMIN login olur
2. `/appointments` endpoint'ine istek atar
3. Backend:
   - JWT token'dan `organizationId` alır
   - Sadece `organizationId = "org-kadikoy-123"` olan randevuları döner
4. Nişantaşı Psikoloji'nin randevularını GÖREMEMELİ

### Senaryo 4: SUPER_ADMIN Access
1. SUPER_ADMIN login olur
2. `/organizations` endpoint'ine istek atar
3. TÜM klinikleri görebilmeli
4. Herhangi bir kliniğin verilerine erişebilmeli

---

## 📝 Migration Notları

### Mevcut Veriler
Eğer sistemde **halihazırda kullanıcılar varsa**:

1. **Varsayılan Organization Oluştur:**
   ```sql
   INSERT INTO organizations (id, name, slug, country, subscription_plan, subscription_status, is_active, created_at, updated_at)
   VALUES ('org-default', 'Varsayılan Klinik', 'varsayilan-klinik', 'Turkey', 'premium', 'active', true, NOW(), NOW());
   ```

2. **Tüm Kullanıcıları Bu Organization'a Bağla:**
   ```sql
   UPDATE users
   SET organization_id = 'org-default'
   WHERE role IN ('ADMIN', 'THERAPIST', 'RECEPTIONIST', 'ACCOUNTANT');
   -- CLIENT kullanıcıları organization'a bağlanmaz
   ```

3. **ASSISTANT Rolünü Dönüştür:**
   ```sql
   -- Eğer ASSISTANT kullanıcılar varsa, RECEPTIONIST yap
   UPDATE users
   SET role = 'RECEPTIONIST'
   WHERE role = 'ASSISTANT';
   ```

---

## 🔍 Keycloak User Attribute Nasıl Eklenir?

### Manuel (UI):
1. **Keycloak Admin Console** → http://localhost:8080
2. **Users** → Kullanıcı seç
3. **Attributes** sekmesi
4. **Add attribute:**
   - Key: `organizationId`
   - Value: `org-kadikoy-123`
5. **Save**

### Otomatik (REST API):
```bash
# Admin token al
ADMIN_TOKEN=$(curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r .access_token)

# User attribute güncelle
curl -X PUT "http://localhost:8080/admin/realms/psikolog-sistemi/users/USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "organizationId": ["org-kadikoy-123"],
      "organizationSlug": ["kadikoy-psikoloji"]
    }
  }'
```

---

## 🎉 Özet

✅ **Database schema güncellendi** (Organization modeli eklendi)  
✅ **UserRole enum güncellendi** (RECEPTIONIST, ACCOUNTANT eklendi)  
✅ **Dökümanlar oluşturuldu** (RBAC, Keycloak setup)  
✅ **Migration başarılı** (PostgreSQL'e push edildi)  

🔄 **Sonraki:** Backend Keycloak entegrasyonu ve API endpoint'leri

---

## 📚 İlgili Dökümanlar

- [ORGANIZATION_RBAC.md](./ORGANIZATION_RBAC.md) - Multi-tenant yapı ve roller
- [MULTI_TENANT_SETUP.md](./keycloak/MULTI_TENANT_SETUP.md) - Keycloak entegrasyon detayları
- [FEATURES.md](./FEATURES.md) - Sistem özellikleri
- [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) - İleri seviye özellikler

