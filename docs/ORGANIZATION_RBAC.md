# 🏢 Multi-Tenant Organization & RBAC

## 📋 Genel Bakış

Bu sistem **klinik bazlı (multi-tenant)** bir yapıya sahiptir. Her klinik kendi organizasyonu altında bağımsız çalışır.

---

## 🏥 Organization (Klinik) Yapısı

### Organization Modeli

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String   // "Kadıköy Psikoloji Merkezi"
  slug        String   @unique // "kadikoy-psikoloji"
  description String?
  logo        String?
  
  // Contact
  email       String?
  phone       String?
  website     String?
  address     String?
  city        String?
  country     String   @default("Turkey")
  
  // Business Info
  taxNumber   String?  @unique
  taxOffice   String?
  
  // Subscription & Billing
  subscriptionPlan   String   @default("trial")
  subscriptionStatus String   @default("active")
  subscriptionExpiresAt DateTime?
  
  // Settings
  settings    Json?
  isActive    Boolean  @default(true)
  
  // Relations
  users       User[]
  locations   Location[]
}
```

### Subscription Plans

| Plan | Özellikler | Fiyat |
|------|-----------|-------|
| **Trial** | 14 gün deneme, 1 terapist, temel özellikler | Ücretsiz |
| **Basic** | 5 terapist, 2 lokasyon, temel raporlar | ₺999/ay |
| **Premium** | Sınırsız terapist, sınırsız lokasyon, gelişmiş raporlar, AI notlar | ₺2,499/ay |
| **Enterprise** | Özel kurulum, API erişimi, öncelikli destek | Teklif |

---

## 👥 Kullanıcı Rolleri (RBAC)

### Role Hierarchy

```
SUPER_ADMIN (Platform)
    └── ADMIN (Klinik)
        ├── THERAPIST
        ├── RECEPTIONIST
        └── ACCOUNTANT

CLIENT (Bağımsız)
```

### 1. SUPER_ADMIN (Platform Yöneticisi)

**Yetkiler:**
- ✅ Tüm organizasyonlara erişim
- ✅ Yeni organizasyon oluşturma
- ✅ Subscription yönetimi
- ✅ Platform ayarları
- ✅ Sistem logları
- ✅ Tüm kullanıcıları yönetme

**Use Case:**
- Platform sahipleri (bizler)
- Teknik destek ekibi
- Sistem bakımı

---

### 2. ADMIN (Klinik Yöneticisi)

**Organizasyon Bağlantısı:** ✅ (Kendi kliniği)

**Yetkiler:**
- ✅ Kendi organizasyonunu yönetme
- ✅ Kullanıcı ekleme/çıkarma (kendi kliniğinde)
- ✅ Lokasyon ve oda yönetimi
- ✅ Terapist profil ayarları
- ✅ Finansal raporlar
- ✅ Klinik ayarları
- ❌ Başka klinikleri görme

**Use Case:**
- Klinik sahibi
- Klinik müdürü

---

### 3. THERAPIST (Terapist)

**Organizasyon Bağlantısı:** ✅ (Çalıştığı klinik)

**Yetkiler:**
- ✅ Kendi randevularını yönetme
- ✅ Seans notları yazma
- ✅ Danışan profilleri (kendi danışanları)
- ✅ Kendi takvimini görme
- ✅ Kendi ödemelerini görme
- ✅ Bekleme listesi yönetimi (kendi için)
- ❌ Diğer terapistlerin notlarını okuma
- ❌ Finansal raporlar

**Use Case:**
- Klinikte çalışan psikologlar

---

### 4. RECEPTIONIST (Resepsiyonist/Asistan)

**Organizasyon Bağlantısı:** ✅ (Çalıştığı klinik)

**Yetkiler:**
- ✅ Tüm randevuları görme (kendi kliniği)
- ✅ Randevu oluşturma/iptal etme
- ✅ Check-in işlemleri
- ✅ Bekleme listesi yönetimi
- ✅ Danışan bilgileri (temel)
- ✅ Lokasyon ve oda seçimi
- ❌ Seans notlarını okuma
- ❌ Ödeme işlemleri (sadece görüntüleme)

**Use Case:**
- Resepsiyon görevlisi
- Randevu koordinatörü

---

### 5. ACCOUNTANT (Muhasebe)

**Organizasyon Bağlantısı:** ✅ (Çalıştığı klinik)

**Yetkiler:**
- ✅ Tüm ödemeleri görme (kendi kliniği)
- ✅ Fatura oluşturma
- ✅ Gelir raporları
- ✅ Paket satışları
- ✅ Nakit/kredi kartı işlemleri
- ❌ Seans notlarını okuma
- ❌ Randevu oluşturma

**Use Case:**
- Mali işler sorumlusu
- Muhasebe elemanı

---

### 6. CLIENT (Danışan/Hasta)

**Organizasyon Bağlantısı:** ❌ (Bağımsız)

**Yetkiler:**
- ✅ Kendi randevularını görme
- ✅ Kendi ödeme geçmişini görme
- ✅ Kendi formlarını doldurma (intake, KVKK)
- ✅ Online randevu alma (eğer terapist izin verdiyse)
- ✅ Bağlantılı hesaplar (aile üyeleri)
- ❌ Seans notlarını okuma
- ❌ Diğer danışanları görme

**Use Case:**
- Terapi alan kişi
- Ebeveyn (çocuk için)

---

## 🔐 Data Isolation (Veri İzolasyonu)

### Organizasyon Bazlı Filtreleme

**Backend'de her query organizasyona göre filtrelenmelidir:**

```typescript
// ❌ YANLIŞ (güvenlik riski)
const appointments = await prisma.appointment.findMany();

// ✅ DOĞRU (organizasyon filtresi)
const appointments = await prisma.appointment.findMany({
  where: {
    therapist: {
      user: {
        organizationId: user.organizationId
      }
    }
  }
});
```

### Guard Yapısı

**Keycloak + NestJS Guards:**

```typescript
// 1. JwtAuthGuard: Token doğrulama
// 2. OrganizationGuard: Organizasyon kontrolü
// 3. RolesGuard: Role kontrolü

@UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
@Roles('ADMIN', 'THERAPIST')
@Get('appointments')
async getAppointments(@CurrentUser() user: User) {
  // user.organizationId otomatik filtrelenir
}
```

---

## 📊 Multi-Tenant Database Design

### Approach: **Shared Database, Shared Schema**

**장점:**
- ✅ Daha kolay yönetim
- ✅ Daha az maliyet
- ✅ Daha kolay migration

**Dezavantajlar:**
- ⚠️ Application-level isolation gerekli
- ⚠️ Query her zaman `organizationId` ile filtrelenmeli

### Alternative: **Shared Database, Separate Schema**

Her organizasyon için ayrı PostgreSQL schema:
- `org_kadikoy_psikoloji.*`
- `org_nisantasi_psikoloji.*`

**Bu versiyonda kullanmıyoruz** (complexity artar).

---

## 🔑 Keycloak Integration

### Realm Structure

**Seçenek 1: Single Realm (Önerilen)**
- Tek `psikolog-sistemi` realm
- Tüm kullanıcılar bu realm'de
- `organizationId` → User Attribute olarak saklanır
- Token'da `organizationId` claim'i döner

```json
{
  "sub": "user-id",
  "email": "terapist@example.com",
  "roles": ["THERAPIST"],
  "organizationId": "org-123",
  "organizationSlug": "kadikoy-psikoloji"
}
```

**Seçenek 2: Multiple Realms**
- Her klinik için ayrı realm
- Daha fazla izolasyon
- Daha karmaşık yönetim

**→ Seçenek 1'i kullanacağız (basitlik).**

---

## 🚀 Onboarding Flow

### 1. Klinik Kaydı
```
1. Kullanıcı kayıt formunu doldurur
   - Klinik adı
   - Yönetici email/şifre
   - Telefon, adres
   
2. System:
   - Organization oluşturur
   - ADMIN kullanıcı oluşturur
   - organizationId atanır
   - Trial plan başlatılır (14 gün)

3. Email verification gönderilir
```

### 2. Terapist Ekleme
```
1. ADMIN terapist davet eder
   - Email gönderilir
   - Şifre oluşturma linki
   
2. Terapist:
   - Şifre oluşturur
   - Profil tamamlar (lisans, uzmanlık)
   - Çalışma saatlerini ayarlar
```

### 3. Lokasyon & Oda Ayarı
```
1. ADMIN:
   - Lokasyon ekler (Kadıköy Şube)
   - Oda ekler (Oyun Terapisi Odası)
   
2. Terapist:
   - Hangi lokasyonlarda çalıştığını seçer
   - Gün/saat bazlı müsaitlik ayarlar
```

---

## 📝 Best Practices

### 1. Her Query'de Organization Kontrolü
```typescript
// Middleware/Interceptor ile otomatik organizasyon filtresi
@Injectable()
export class OrganizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    request.organizationId = request.user.organizationId;
    return next.handle();
  }
}
```

### 2. Row-Level Security (PostgreSQL)
```sql
-- Her tabloya organizationId kontrolü
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON appointments
  USING (organization_id = current_setting('app.current_organization_id')::text);
```

### 3. Audit Logging
Her organizasyon için ayrı audit log:
```typescript
auditLog.create({
  organizationId: user.organizationId,
  action: 'CREATE_APPOINTMENT',
  userId: user.id,
  // ...
});
```

---

## 🎯 Sonraki Adımlar

1. ✅ Database schema güncellendi (`Organization` modeli eklendi)
2. 🔄 Keycloak user attributes (organizationId)
3. 🔄 NestJS guards (OrganizationGuard)
4. 🔄 Frontend organization context (Zustand)
5. 🔄 Subscription & billing modülü

