# 🔐 Keycloak Setup Guide - Psikolog Sistemi

## 📋 İçindekiler
1. [Keycloak'a Erişim](#keycloaka-erişim)
2. [Realm Oluşturma](#realm-oluşturma)
3. [Client Konfigürasyonu](#client-konfigürasyonu)
4. [Role ve Permission Yönetimi](#role-ve-permission-yönetimi)
5. [User Federation (Opsiyonel)](#user-federation)
6. [Realm Export](#realm-export)

---

## 🚀 Keycloak'a Erişim

### 1. Keycloak Admin Console
```
URL: http://localhost:8082
Username: admin
Password: admin
```

### 2. İlk Giriş
1. Tarayıcınızda `http://localhost:8082` adresine gidin
2. **Administration Console** butonuna tıklayın
3. Kullanıcı adı: `admin`, Şifre: `admin` girin
4. **Sign In** butonuna tıklayın

---

## 🏢 Realm Oluşturma

### Adım 1: Yeni Realm
1. Sol üst köşede **Master** dropdown'ına tıklayın
2. **Create Realm** butonuna tıklayın
3. Aşağıdaki bilgileri girin:

```yaml
Realm name: psikolog-realm
Enabled: ON
```

4. **Create** butonuna tıklayın

### Adım 2: Realm Ayarları

#### General Settings
- **Realm Settings** → **General**
  - Display name: `Psikolog Sistemi`
  - HTML Display name: `<b>Psikolog</b> Sistemi`
  - Frontend URL: `http://localhost:8082` (production'da değişecek)

#### Login Settings
- **Realm Settings** → **Login**
  ```yaml
  User registration: ON (kullanıcı kaydı için)
  Forgot password: ON
  Remember me: ON
  Verify email: ON (email service kurulunca)
  Login with email: ON
  Duplicate emails: OFF
  Require SSL: External requests (development için)
  ```

#### Email Settings (İleriki adımda yapılacak)
- **Realm Settings** → **Email**
  ```yaml
  Host: smtp.gmail.com (örnek)
  Port: 587
  From: noreply@psikolog.com
  Enable StartTLS: ON
  Enable Authentication: ON
  Username: your-email@gmail.com
  Password: your-app-password
  ```

#### Tokens
- **Realm Settings** → **Tokens**
  ```yaml
  Access Token Lifespan: 15 minutes (15m) - ⚠️ SSO Session Idle'dan KISA olmalı!
  Access token lifespan (for implicit flow): 15 minutes
  SSO Session Idle: 30 minutes (NOT: Bu ayar "Sessions" sekmesinde!)
  SSO Session Max: 10 hours (NOT: Bu ayar "Sessions" sekmesinde!)
  Refresh Token Max Reuse: 0 (NOT: Bu ayar "Advanced" sekmesinde olabilir!)
  ```

**🔴 ÖNEMLİ GÜVENLİK KURALI:**
> **Access Token Lifespan MUTLAKA SSO Session Idle Timeout'tan KISA olmalıdır!**
> 
> Keycloak bu kuralı zorunlu kılar. Eğer SSO Session Idle 30 dakika ise, Access Token en fazla 30 dakikadan kısa olmalıdır (ör: 15 dakika).

**Neden?**
- Access Token kısa ömürlü olmalı (güvenlik)
- Refresh Token ile yenilenir (uzun ömürlü)
- SSO Session, kullanıcının genel oturum süresidir

**Önerilen Değerler (Development):**
- Access Token: **15 dakika** (güvenlik için kısa)
- SSO Session Idle: **30 dakika** (kullanıcı deneyimi)
- SSO Session Max: **10 saat** (günlük çalışma süresi)
- Refresh Token: **7 gün** (otomatik yenilenir)

**⚠️ ÖNEMLİ NOT:** Keycloak 24.0'da bazı ayarlar farklı yerlerde:
- **SSO Session Idle** ve **SSO Session Max** → **Realm Settings** → **Sessions** sekmesinde
- **Refresh Token Max Reuse** → **Realm Settings** → **Tokens** → **Advanced** altında veya **Sessions** sekmesinde olabilir

#### Sessions (SSO Session Ayarları)
- **Realm Settings** → **Sessions**
  ```yaml
  SSO Session Idle: 30 minutes (30m) - Kullanıcı inaktif kalırsa oturum kapanır
  SSO Session Max: 10 hours (10h) - Maksimum oturum süresi
  SSO Session Idle Remember Me: 30 days (30d) - "Beni Hatırla" ile idle süre
  SSO Session Max Remember Me: 30 days (30d) - "Beni Hatırla" ile max süre
  Client Session Idle Timeout: 30 minutes (30m)
  Client Session Max Lifespan: - (sınırsız, realm ayarı kullanılır)
  ```

**Not:** Eğer bu ayarları göremiyorsanız, Keycloak versiyonunuz farklı olabilir. Bu durumda:
1. **Realm Settings** → **Tokens** sekmesinde sadece token ömürlerini ayarlayın
2. **Sessions** sekmesinde SSO session ayarlarını kontrol edin
3. Gerekirse varsayılan değerleri kullanabilirsiniz (production için daha sonra optimize edilir)

---

## 🔌 Client Konfigürasyonu

### Client 1: Backend API (psikolog-api)

#### Adım 1: Client Oluştur
1. Sol menüden **Clients** seçin
2. **Create client** butonuna tıklayın

#### Adım 2: General Settings
```yaml
Client type: OpenID Connect
Client ID: psikolog-api
Name: Psikolog API
Description: Backend NestJS API
Always display in console: OFF
```

**Next** butonuna tıklayın

#### Adım 3: Capability Config
```yaml
Client authentication: ON (confidential client)
Authorization: ON
Authentication flow:
  ✅ Standard flow
  ✅ Direct access grants
  ❌ Implicit flow (güvenli değil)
  ❌ Service accounts roles
  ❌ OAuth 2.0 Device Authorization Grant
```

**Next** ve sonra **Save** butonuna tıklayın

#### Adım 4: Settings Tab
```yaml
Root URL: http://localhost:3001
Home URL: http://localhost:3001
Valid redirect URIs: 
  - http://localhost:3001/*
  - http://localhost:3000/*
Valid post logout redirect URIs: 
  - http://localhost:3000
  - http://localhost:3000/login
Web origins: 
  - http://localhost:3001
  - http://localhost:3000
```

**⚠️ ÖNEMLİ - Redirect URI Formatı:**
- Her URI **ayrı bir satırda** olmalı
- Wildcard (`*`) kullanırken **sadece path sonunda** kullanılabilir: `http://localhost:3000/*`
- **Fragment (`#`) kullanmayın** - Keycloak bunu kabul etmez
- **Trailing slash** (`/`) olmadan yazın: `http://localhost:3000` (doğru), `http://localhost:3000/` (yanlış değil ama tutarlı olmalı)

**Alternatif (Eğer localhost çalışmazsa):**
Bazı Keycloak versiyonlarında `localhost` yerine `127.0.0.1` kullanmanız gerekebilir:
```yaml
Valid redirect URIs: 
  - http://127.0.0.1:3001/*
  - http://127.0.0.1:3000/*
```

**🔴 KRİTİK - Post Logout Redirect URI:**
- **Post logout URI'lerde WILDCARD (`*`) KULLANMAYIN!**
- Sadece **tam URL'ler** kabul edilir: `http://localhost:3000`, `http://localhost:3000/login`
- Wildcard kullanımı: `http://localhost:3001/*` → **HATA VERİR!**

**Not:** `Valid post logout redirect URIs` alanı, kullanıcı logout yaptıktan sonra yönlendirilebileceği URL'leri belirtir. Genellikle frontend'in ana sayfası veya login sayfası eklenir. **Wildcard kullanılamaz!**

**Save** butonuna tıklayın

#### Adım 5: Client Secret Alma
1. **Credentials** tab'ına gidin
2. **Client secret** değerini kopyalayın
3. Bu değeri `.env` dosyasına ekleyin:
```env
KEYCLOAK_CLIENT_SECRET=<copied-secret>
```

---

### Client 2: Frontend Web (psikolog-web)

#### Adım 1: Client Oluştur
1. **Clients** → **Create client**

#### Adım 2: General Settings
```yaml
Client type: OpenID Connect
Client ID: psikolog-web
Name: Psikolog Web Frontend
Description: Next.js Frontend Application
```

**Next**

#### Adım 3: Capability Config
```yaml
Client authentication: OFF (public client)
Authorization: OFF
Authentication flow:
  ✅ Standard flow
  ❌ Direct access grants
  ❌ Implicit flow
  ❌ Service accounts roles
```

**Save**

#### Adım 4: Settings
```yaml
Root URL: http://localhost:3000
Home URL: http://localhost:3000
Valid redirect URIs: 
  - http://localhost:3000/*
  - http://localhost:3000/api/auth/callback/keycloak
Valid post logout redirect URIs: 
  - http://localhost:3000
  - http://localhost:3000/login
Web origins: 
  - http://localhost:3000
```

**⚠️ Redirect URI Formatı:**
- Her URI **ayrı bir satırda** olmalı
- Wildcard (`*`) sadece path sonunda: `http://localhost:3000/*`
- Fragment (`#`) kullanmayın
- Trailing slash (`/`) tutarlı kullanın veya kullanmayın

**Alternatif (localhost çalışmazsa):**
```yaml
Valid redirect URIs: 
  - http://127.0.0.1:3000/*
  - http://127.0.0.1:3000/api/auth/callback/keycloak
```

**Save**

---

## 👥 Role ve Permission Yönetimi

### Adım 1: Realm Roles Oluşturma

1. Sol menüden **Realm roles** seçin
2. **Create role** butonuna tıklayın

Her bir rol için aşağıdaki adımları tekrarlayın:

#### Role 1: super-admin
```yaml
Role name: super-admin
Description: Süper yönetici - Tam sistem erişimi
```

#### Role 2: admin
```yaml
Role name: admin
Description: Yönetici - Klinik yönetimi ve raporlar
```

#### Role 3: therapist
```yaml
Role name: therapist
Description: Terapist - Hasta ve seans yönetimi
```

#### Role 4: assistant
```yaml
Role name: assistant
Description: Asistan - Randevu ve destek görevleri
```

#### Role 5: client
```yaml
Role name: client
Description: Danışan - Kısıtlı erişim
```

### Adım 2: Composite Roles (Hiyerarşi)

Role inheritance (kalıtım) için composite roles:

1. **admin** rolünü seç
2. **Composite roles** switch'ini ON yap
3. **therapist** ve **assistant** rollerini ekle

Bu şekilde:
```
super-admin (her şey)
  └── admin
       ├── therapist
       └── assistant
```

### Adım 3: Default Role

1. **Realm settings** → **User registration** → **Default roles**
2. **client** rolünü default olarak ekleyin

---

## 🔗 Client Role Mapping

### Backend API İçin

1. **Clients** → **psikolog-api** → **Roles** tab
2. **Create role** butonuna tıklayın

Client-specific roller:
```yaml
api-admin: API yönetim erişimi
api-user: Temel API kullanımı
```

### Client Roles'u Realm Roles'a Mapping

1. **Clients** → **psikolog-api** → **Client scopes** tab
2. **psikolog-api-dedicated** scope'a tıklayın
3. **Add mapper** → **By configuration** → **User Realm Role**

```yaml
Name: realm-roles
Mapper Type: User Realm Role
Multivalued: ON
Token Claim Name: realm_access.roles
Claim JSON Type: String
Add to ID token: ON
Add to access token: ON
Add to userinfo: ON
```

---

## 👤 Test User Oluşturma

### Adım 1: Kullanıcı Oluştur

1. **Users** → **Add user**

```yaml
Username: test.therapist
Email: therapist@test.com
Email Verified: ON
First name: Test
Last name: Therapist
Enabled: ON
```

**Create**

### Adım 2: Password Ayarla

1. Oluşturduğunuz kullanıcıya tıklayın
2. **Credentials** tab'ına gidin
3. **Set password**

```yaml
Password: Test123!
Temporary: OFF (kalıcı şifre)
```

**Save**

### Adım 3: Role Ata

1. **Role mapping** tab'ına gidin
2. **Assign role** butonuna tıklayın
3. **therapist** rolünü seçin
4. **Assign** butonuna tıklayın

### Test Kullanıcıları (Önerilen)

Aşağıdaki kullanıcıları oluşturun:

```yaml
1. Super Admin:
   Username: admin
   Email: admin@psikolog.com
   Password: Admin123!
   Role: super-admin

2. Admin:
   Username: admin.user
   Email: admin@test.com
   Password: Admin123!
   Role: admin

3. Therapist:
   Username: therapist.user
   Email: therapist@test.com
   Password: Therapist123!
   Role: therapist

4. Assistant:
   Username: assistant.user
   Email: assistant@test.com
   Password: Assistant123!
   Role: assistant

5. Client:
   Username: client.user
   Email: client@test.com
   Password: Client123!
   Role: client
```

---

## 🔄 User Federation (Opsiyonel - Gelişmiş)

LDAP veya Active Directory entegrasyonu için:

1. **User federation** → **Add provider**
2. **ldap** veya **kerberos** seçin
3. Konfigürasyon ayarlarını doldurun

> Not: Bu adım çoğu durumda gerekli değildir. Sadece kurumsal LDAP entegrasyonu gerekiyorsa kullanın.

---

## 📤 Realm Export (Yedekleme)

### Manuel Export

1. **Realm settings** → **Action** dropdown → **Partial export**
2. Export options:
```yaml
Include groups and roles: YES
Include clients: YES
Include users: YES (dikkat: şifreler export edilmez)
```
3. **Export** butonuna tıklayın
4. `realm-export.json` dosyasını kaydedin

### CLI Export (Önerilen)

Docker container üzerinden:

```bash
docker exec -it psikolog-keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/keycloak-export \
  --realm psikolog-realm \
  --users realm_file

# Export'u local'e kopyala
docker cp psikolog-keycloak:/tmp/keycloak-export/psikolog-realm.json ./docs/keycloak/realm-export.json
```

---

## 🧪 Keycloak Test

### REST API ile Test

```bash
# Token alma (Direct Grant)
curl -X POST http://localhost:8082/realms/psikolog-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=psikolog-api" \
  -d "client_secret=<YOUR_CLIENT_SECRET>" \
  -d "grant_type=password" \
  -d "username=test.therapist" \
  -d "password=Test123!"

# Response:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
#   "expires_in": 604800,
#   "refresh_expires_in": 2592000,
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
#   "token_type": "Bearer",
#   "not-before-policy": 0,
#   "session_state": "...",
#   "scope": "profile email"
# }
```

### Token Decode

Access token'ı [jwt.io](https://jwt.io) sitesinde decode edin ve içeriğini kontrol edin:

```json
{
  "realm_access": {
    "roles": ["therapist"]
  },
  "resource_access": {
    "psikolog-api": {
      "roles": ["api-user"]
    }
  },
  "email": "therapist@test.com",
  "preferred_username": "test.therapist"
}
```

---

## 🔧 Troubleshooting

### Sorun 1: Keycloak'a erişilemiyor
```bash
# Container durumunu kontrol et
docker ps | grep keycloak

# Logları kontrol et
docker logs psikolog-keycloak

# Restart
docker restart psikolog-keycloak
```

### Sorun 2: "A redirect URI is not a valid URI" Hatası

**Hata Mesajı:** `Could not create client: 'A redirect URI is not a valid URI'`

**Çözüm Adımları:**

1. **URI Formatını Kontrol Edin:**
   - Her URI **ayrı bir satırda** olmalı (virgülle ayırmayın)
   - Wildcard (`*`) **sadece path sonunda** kullanılabilir: `http://localhost:3000/*`
   - Fragment (`#`) kullanmayın
   - Boşluk karakteri olmamalı

2. **Doğru Format Örnekleri:**
   ```yaml
   ✅ DOĞRU:
   - http://localhost:3000/*
   - http://localhost:3000/api/auth/callback/keycloak
   - http://127.0.0.1:3000/*
   
   ❌ YANLIŞ:
   - http://localhost:3000/*, http://localhost:3001/* (virgülle ayırmayın)
   - http://localhost:3000/*#fragment (fragment kullanmayın)
   - http://localhost:3000/ * (boşluk olmamalı)
   - *://localhost:3000/* (wildcard protocol'de kullanılamaz)
   ```

3. **localhost Yerine 127.0.0.1 Deneyin:**
   Bazı Keycloak versiyonlarında `localhost` sorun çıkarabilir:
   ```yaml
   Valid redirect URIs: 
     - http://127.0.0.1:3000/*
     - http://127.0.0.1:3001/*
   ```

4. **Web Origins Kontrolü:**
   - Web Origins'de **sadece domain** olmalı (path olmamalı)
   - Doğru: `http://localhost:3000`
   - Yanlış: `http://localhost:3000/*`

5. **Client Oluştururken:**
   - İlk önce **sadece bir URI** ekleyin: `http://localhost:3000/*`
   - Save edin
   - Sonra diğer URI'leri ekleyin

6. **Post Logout Redirect URI'lerde Wildcard Kullanmayın:**
   - Post logout URI'lerde **wildcard (`*`) kullanılamaz!**
   - Sadece tam URL'ler kabul edilir
   - ❌ Yanlış: `http://localhost:3001/*`
   - ✅ Doğru: `http://localhost:3000`, `http://localhost:3000/login`

7. **Mevcut Client'ı Düzenliyorsanız:**
   - Tüm redirect URI'leri silin
   - Post logout URI'lerden wildcard'ları kaldırın
   - Tek tek, her biri ayrı satırda ekleyin
   - Her eklemeden sonra Save edin

8. **Client Oluşturma Sırasında:**
   - "Next" butonlarına tıklarken tüm alanları doldurun
   - "Client authentication" seçeneğini doğru seçin (ON/OFF)
   - İlk kayıt sırasında sadece zorunlu alanları doldurun
   - Save ettikten sonra diğer ayarları yapın

9. **Root URL ve Home URL Kontrolü:**
   - Root URL ve Home URL **boş bırakılabilir** veya tam URL olmalı
   - ❌ Yanlış: `http://localhost:3001/` (trailing slash sorun çıkarabilir)
   - ✅ Doğru: `http://localhost:3001` (trailing slash olmadan)
   - ✅ Alternatif: Bu alanları **tamamen boş bırakın** ve sadece redirect URI'leri kullanın

10. **Client'ı Sıfırdan Oluşturun:**
    - Mevcut client'ı **silin** (eğer varsa)
    - Yeni client oluştururken **sadece zorunlu alanları** doldurun:
      - Client ID: `psikolog-api`
      - Client type: OpenID Connect
    - "Next" → "Client authentication: ON" → "Next" → "Save"
    - Save başarılı olduktan sonra **Settings** tab'ına gidin
    - Orada redirect URI'leri ekleyin

11. **Minimal Konfigürasyon ile Deneyin:**
    İlk önce en minimal ayarlarla deneyin:
    ```yaml
    Root URL: (BOŞ BIRAKIN)
    Home URL: (BOŞ BIRAKIN)
    Valid redirect URIs: 
      - http://localhost:3001/*
    Valid post logout redirect URIs: (BOŞ BIRAKIN - sonra ekleyin)
    Web origins: 
      - http://localhost:3001
    ```
    Save edin. Başarılı olursa, diğer URI'leri tek tek ekleyin.

12. **Keycloak Versiyon Kontrolü:**
    Keycloak 24.0'da bazı durumlarda bu hata bilinen bir bug olabilir.
    ```bash
    # Keycloak versiyonunu kontrol edin
    docker exec psikolog-keycloak /opt/keycloak/bin/kc.sh --version
    ```
    Eğer sorun devam ederse, Keycloak'ı restart edin:
    ```bash
    docker restart psikolog-keycloak
    ```

13. **Browser Cache Temizleyin:**
    - Browser'ın cache'ini temizleyin
    - Veya **Incognito/Private mode** kullanın
    - Keycloak console'a tekrar giriş yapın

14. **Alternatif: Keycloak Admin CLI Kullanın:**
    Eğer UI'dan oluşturamıyorsanız, CLI ile deneyin:
    ```bash
    docker exec -it psikolog-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
      --server http://localhost:8082 \
      --realm master \
      --user admin \
      --password admin
    
    docker exec -it psikolog-keycloak /opt/keycloak/bin/kcadm.sh create clients \
      -r psikolog-realm \
      -s clientId=psikolog-api \
      -s 'redirectUris=["http://localhost:3001/*","http://localhost:3000/*"]' \
      -s 'webOrigins=["http://localhost:3001","http://localhost:3000"]' \
      -s publicClient=false \
      -s secret=your-secret-here
    ```

### Sorun 3: Token Expired
- **Realm Settings** → **Tokens** → **Access Token Lifespan** ayarını kontrol edin
- Refresh token kullanımını aktifleştirin

---

## 📚 Sonraki Adımlar

1. ✅ Backend API Keycloak entegrasyonu
2. ✅ Frontend NextAuth Keycloak provider
3. ✅ Role-based access control (RBAC) implementasyonu
4. ✅ User sync mekanizması (Keycloak ↔ PostgreSQL)

Detaylı entegrasyon adımları için `ROADMAP.md` dosyasına bakın.

---

**Oluşturulma Tarihi:** 18 Kasım 2025
**Son Güncelleme:** 18 Kasım 2025
**Versiyon:** 1.0

