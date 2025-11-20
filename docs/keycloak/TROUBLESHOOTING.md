# Keycloak Troubleshooting Guide

## "Account is not fully set up" Hatası

Bu hata genellikle kullanıcının hesabının tam olarak yapılandırılmamış olmasından kaynaklanır.

### Çözüm Adımları:

1. **Keycloak Admin Console'a gidin:**
   - http://localhost:8082
   - Admin / admin ile giriş yapın

2. **Kullanıcıyı kontrol edin:**
   - **Users** → `test.therapist` kullanıcısını açın

3. **Details sekmesi:**
   - ✅ **Enabled:** ON (açık olmalı)
   - ✅ **Email Verified:** ON (açık olmalı)

4. **Credentials sekmesi:**
   - **Set password** butonuna tıklayın
   - **Password:** `Test123!`
   - **Password confirmation:** `Test123!`
   - ⚠️ **Temporary:** OFF (kapalı olmalı - çok önemli!)
   - **Save** → **Save password** (onay popup'ında)

5. **Required Actions sekmesi:**
   - Bu sekmede **hiçbir şey olmamalı**
   - Eğer "Update Password" veya başka bir action varsa:
     - Ya tamamlayın
     - Ya da **Remove** ile kaldırın

6. **Role Mapping sekmesi:**
   - **therapist** rolü atanmış olmalı

### Hala Çalışmıyorsa:

#### Seçenek 1: Kullanıcıyı Yeniden Oluşturun

1. **Users** → `test.therapist` → **Delete**
2. **Create new user:**
   ```
   Username: test.therapist
   Email: therapist@test.com
   Email verified: ON
   First name: Test
   Last name: Therapist
   Enabled: ON
   ```
3. **Credentials** → **Set password:**
   ```
   Password: Test123!
   Temporary: OFF
   ```
4. **Role mapping** → **Assign role** → **therapist**

#### Seçenek 2: Keycloak Realm Ayarlarını Kontrol Edin

1. **Realm Settings** → **Login** sekmesi
2. **User registration:** Kapalı olabilir (sorun değil)
3. **Edit username:** Açık olabilir (sorun değil)
4. **Email as username:** Kapalı olmalı (test için)

#### Seçenek 3: Client Ayarlarını Kontrol Edin

1. **Clients** → **psikolog-api**
2. **Settings** sekmesi:
   - **Access Type:** confidential
   - **Standard flow:** ON
   - **Direct access grants:** ON (çok önemli!)
   - **Service accounts roles:** OFF

### Test Komutu:

```powershell
# PowerShell'de
.\test-keycloak-token.ps1
```

veya

```bash
# Bash'de
curl -X POST http://localhost:8082/realms/psikolog-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=psikolog-api" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=test.therapist" \
  -d "password=Test123!"
```

### Başarılı Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 900,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "Bearer"
}
```

### Diğer Yaygın Hatalar:

#### "Invalid client credentials"
- Client secret yanlış veya eksik
- `.env` dosyasında `KEYCLOAK_CLIENT_SECRET` kontrol edin

#### "Invalid user credentials"
- Kullanıcı adı veya şifre yanlış
- Keycloak'ta kullanıcı şifresini kontrol edin

#### "Client not allowed for direct access grants"
- Client ayarlarında **Direct access grants** kapalı
- **Clients** → **psikolog-api** → **Settings** → **Direct access grants: ON**

