# 🔐 Keycloak Multi-Tenant Kurulumu

## 📋 Genel Bakış

Bu dokümanda, **klinik bazlı (multi-tenant)** yapı için Keycloak entegrasyonu anlatılmaktadır.

---

## 🏗️ Architecture Decision: Single Realm

### Seçenek 1: Single Realm (✅ Tercih Edilen)

**Yapı:**
- Tek `psikolog-sistemi` realm
- Tüm kullanıcılar bu realm'de
- `organizationId` → **User Attribute** olarak saklanır
- Token'da `organizationId` **claim** olarak döner

**Avantajları:**
- ✅ Daha basit yönetim
- ✅ Tek realm bakımı
- ✅ Daha az Keycloak resource
- ✅ Cross-organization user transfer mümkün (eğer gerekirse)

**Dezavantajları:**
- ⚠️ Application-level isolation gerekli
- ⚠️ Role mapping daha dikkatli yapılmalı

---

### Seçenek 2: Multiple Realms (Kullanmıyoruz)

**Yapı:**
- Her klinik için ayrı realm:
  - `kadikoy-psikoloji`
  - `nisantasi-psikoloji`

**Avantajları:**
- ✅ Tam realm-level izolasyon
- ✅ Her klinik kendi Keycloak ayarlarını yapabilir

**Dezavantajları:**
- ❌ Her klinik için realm oluşturma karmaşıklığı
- ❌ Binlerce klinik = binlerce realm (scalability sorunu)
- ❌ Platform-wide kullanıcı yönetimi zor

---

## 🎯 Single Realm Implementation

### 1. Realm Yapısı

```
psikolog-sistemi (Realm)
├── Clients
│   ├── psikolog-web (Next.js frontend)
│   └── psikolog-api (NestJS backend)
├── Roles
│   ├── SUPER_ADMIN
│   ├── ADMIN
│   ├── THERAPIST
│   ├── RECEPTIONIST
│   ├── ACCOUNTANT
│   └── CLIENT
├── Users
│   ├── User 1 (organizationId: "org-123")
│   ├── User 2 (organizationId: "org-123")
│   └── User 3 (organizationId: "org-456")
└── User Attributes
    └── organizationId (custom attribute)
```

---

### 2. User Attributes Kurulumu

#### 2.1 organizationId Attribute Ekleme

**Keycloak Admin Console:**

1. **Users** → Kullanıcı seç
2. **Attributes** sekmesi
3. **Add attribute:**
   ```
   Key: organizationId
   Value: org-12345678
   ```
4. **Save**

**Toplu Kullanıcı Oluşturma (REST API):**

```bash
curl -X POST "http://localhost:8080/admin/realms/psikolog-sistemi/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "terapist@kadikoy.com",
    "email": "terapist@kadikoy.com",
    "enabled": true,
    "attributes": {
      "organizationId": ["org-123"],
      "organizationSlug": ["kadikoy-psikoloji"]
    },
    "credentials": [{
      "type": "password",
      "value": "TempPassword123!",
      "temporary": true
    }]
  }'
```

---

#### 2.2 organizationId'yi Token'a Ekleme

**Keycloak Mapper (Protocol Mapper) Kurulumu:**

1. **Clients** → `psikolog-web` seç
2. **Mappers** sekmesi
3. **Create Protocol Mapper**:
   - **Name**: `organizationId-mapper`
   - **Mapper Type**: `User Attribute`
   - **User Attribute**: `organizationId`
   - **Token Claim Name**: `organizationId`
   - **Claim JSON Type**: `String`
   - **Add to ID token**: ✅
   - **Add to access token**: ✅
   - **Add to userinfo**: ✅
4. **Save**

**Sonuç (Decoded JWT Token):**

```json
{
  "sub": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "email": "terapist@kadikoy.com",
  "email_verified": true,
  "name": "Ahmet Yılmaz",
  "given_name": "Ahmet",
  "family_name": "Yılmaz",
  "realm_access": {
    "roles": ["THERAPIST"]
  },
  "organizationId": "org-123",
  "organizationSlug": "kadikoy-psikoloji",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

### 3. Role Management

#### 3.1 Realm Roles (Global Roles)

**Keycloak Admin Console:**

1. **Realm Roles** → **Create Role**
2. Aşağıdaki rolleri oluştur:
   - `SUPER_ADMIN`
   - `ADMIN`
   - `THERAPIST`
   - `RECEPTIONIST`
   - `ACCOUNTANT`
   - `CLIENT`

#### 3.2 Composite Roles (Opsiyonel)

**Örnek: ADMIN rolü THERAPIST yetkilerini de içerebilir:**

1. **Realm Roles** → `ADMIN` seç
2. **Composite Roles** sekmesi
3. **Add Realm Roles** → `THERAPIST` seç

Bu sayede ADMIN kullanıcılar hem admin hem therapist yetkilerine sahip olur.

---

### 4. Client Configuration

#### 4.1 Frontend Client (psikolog-web)

```yaml
Client ID: psikolog-web
Client Type: Public
Access Type: public

Valid Redirect URIs:
  - http://localhost:3000/*
  - https://app.psikologsistemi.com/*

Valid Post Logout Redirect URIs:
  - http://localhost:3000
  - https://app.psikologsistemi.com

Web Origins:
  - http://localhost:3000
  - https://app.psikologsistemi.com

Direct Access Grants: OFF
Standard Flow: ON
Implicit Flow: OFF
```

#### 4.2 Backend Client (psikolog-api)

```yaml
Client ID: psikolog-api
Client Type: Confidential
Access Type: confidential

Service Accounts Enabled: ON
Direct Access Grants: ON

Valid Redirect URIs:
  - http://localhost:3001/*

Credentials:
  Client Secret: [GENERATE & COPY]
```

---

### 5. Backend NestJS Integration

#### 5.1 Environment Variables

```bash
# apps/api/.env
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=psikolog-sistemi
KEYCLOAK_CLIENT_ID=psikolog-api
KEYCLOAK_CLIENT_SECRET=<YOUR_SECRET_HERE>
```

#### 5.2 JWT Strategy (Passport)

```typescript
// apps/api/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: 'psikolog-api',
      issuer: `${configService.get('KEYCLOAK_BASE_URL')}/realms/${configService.get('KEYCLOAK_REALM')}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get('KEYCLOAK_BASE_URL')}/realms/${configService.get('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
      organizationId: payload.organizationId, // 🔑 KEY: Organization ID
      organizationSlug: payload.organizationSlug,
    };
  }
}
```

---

#### 5.3 Organization Guard

```typescript
// apps/api/src/common/guards/organization.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN her organizasyona erişebilir
    if (user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    // Diğer kullanıcılar organizationId'ye sahip olmalı
    if (!user.organizationId) {
      throw new ForbiddenException('User is not associated with any organization');
    }

    // Request'e organizationId'yi ekle (query'lerde kullanmak için)
    request.organizationId = user.organizationId;

    return true;
  }
}
```

**Kullanım:**

```typescript
@Controller('appointments')
@UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
export class AppointmentsController {
  @Get()
  @Roles('ADMIN', 'THERAPIST', 'RECEPTIONIST')
  async getAppointments(@Req() request: Request) {
    const organizationId = request['organizationId'];
    
    // Sadece kendi organizasyonunun randevularını döndür
    return this.appointmentsService.findAll(organizationId);
  }
}
```

---

### 6. Frontend Next.js Integration

#### 6.1 NextAuth.js Configuration

```typescript
// apps/web/lib/auth.ts
import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Keycloak token'dan organizationId'yi al
      const decoded = JSON.parse(
        Buffer.from(token.accessToken.split('.')[1], 'base64').toString()
      );
      
      session.user.id = decoded.sub;
      session.user.roles = decoded.realm_access?.roles || [];
      session.user.organizationId = decoded.organizationId; // 🔑
      session.user.organizationSlug = decoded.organizationSlug;
      session.accessToken = token.accessToken;
      
      return session;
    },
  },
});
```

#### 6.2 Zustand Store (Organization Context)

```typescript
// apps/web/store/organization.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationState {
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName: string | null;
  setOrganization: (org: { id: string; slug: string; name: string }) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organizationId: null,
      organizationSlug: null,
      organizationName: null,
      setOrganization: (org) => set({
        organizationId: org.id,
        organizationSlug: org.slug,
        organizationName: org.name,
      }),
      clearOrganization: () => set({
        organizationId: null,
        organizationSlug: null,
        organizationName: null,
      }),
    }),
    {
      name: 'organization-storage',
    }
  )
);
```

---

## 🧪 Testing

### 1. Test User Oluşturma

**Organization 1 (Kadıköy Psikoloji):**

```bash
# Admin
username: admin@kadikoy.com
password: Admin123!
role: ADMIN
organizationId: org-kadikoy-123

# Therapist
username: terapist@kadikoy.com
password: Therapist123!
role: THERAPIST
organizationId: org-kadikoy-123

# Client
username: hasta@example.com
password: Client123!
role: CLIENT
organizationId: null (clients are not bound to org)
```

**Organization 2 (Nişantaşı Psikoloji):**

```bash
# Admin
username: admin@nisantasi.com
password: Admin123!
role: ADMIN
organizationId: org-nisantasi-456
```

---

### 2. Token Test

```bash
# Organization 1 kullanıcısı için token al
curl -X POST "http://localhost:8080/realms/psikolog-sistemi/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=psikolog-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=admin@kadikoy.com" \
  -d "password=Admin123!"

# Token'ı decode et (jwt.io)
# organizationId: "org-kadikoy-123" olmalı
```

---

## 🚀 User Onboarding Flow

### 1. Klinik Kaydı (Organization Creation)

**Endpoint: `POST /api/v1/auth/register-organization`**

```json
{
  "organization": {
    "name": "Kadıköy Psikoloji Merkezi",
    "slug": "kadikoy-psikoloji",
    "email": "info@kadikoy.com",
    "phone": "+90 555 123 4567"
  },
  "admin": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "admin@kadikoy.com",
    "password": "SecurePassword123!"
  }
}
```

**Backend İşlem:**

1. PostgreSQL'de `Organization` oluştur
2. Keycloak'ta kullanıcı oluştur:
   ```typescript
   const kcAdminClient = new KcAdminClient();
   await kcAdminClient.users.create({
     username: 'admin@kadikoy.com',
     email: 'admin@kadikoy.com',
     firstName: 'Ahmet',
     lastName: 'Yılmaz',
     enabled: true,
     emailVerified: false,
     attributes: {
       organizationId: [createdOrganization.id],
       organizationSlug: ['kadikoy-psikoloji'],
     },
     credentials: [{
       type: 'password',
       value: 'SecurePassword123!',
       temporary: false,
     }],
     realmRoles: ['ADMIN'],
   });
   ```
3. PostgreSQL'de `User` oluştur (organizationId ile)
4. Email verification gönder

---

### 2. Terapist Davet Etme

**Endpoint: `POST /api/v1/users/invite`**

```json
{
  "email": "terapist@kadikoy.com",
  "firstName": "Ayşe",
  "lastName": "Demir",
  "role": "THERAPIST"
}
```

**Backend İşlem:**

1. Keycloak'ta kullanıcı oluştur (organizationId = davet eden kullanıcının organizationId)
2. Temporary password oluştur
3. Email gönder: "Kadıköy Psikoloji Merkezi'ne davet edildiniz!"

---

## 📝 Best Practices

### 1. organizationId Kontrolü Her Zaman Yapılmalı

```typescript
// ❌ BAD
const appointments = await prisma.appointment.findMany();

// ✅ GOOD
const appointments = await prisma.appointment.findMany({
  where: {
    therapist: {
      user: {
        organizationId: request.organizationId,
      },
    },
  },
});
```

---

### 2. SUPER_ADMIN İçin İstisna

```typescript
// SUPER_ADMIN tüm organizasyonlara erişebilir
const query: any = {};

if (!user.roles.includes('SUPER_ADMIN')) {
  query.therapist = {
    user: {
      organizationId: user.organizationId,
    },
  };
}

const appointments = await prisma.appointment.findMany({ where: query });
```

---

### 3. Frontend'de Organization Context

```typescript
// Her API isteğinde organizationId header'ı gönder
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-Organization-Id': useOrganizationStore.getState().organizationId,
  },
});
```

---

## 🎯 Sonraki Adımlar

1. ✅ Keycloak realm yapısı planlandı (Single Realm)
2. 🔄 Keycloak'ta `organizationId` attribute'u ekle
3. 🔄 Protocol mapper kur (organizationId → Token)
4. 🔄 NestJS'de OrganizationGuard implement et
5. 🔄 Frontend'de organization context (Zustand)
6. 🔄 User registration endpoint (organization creation)
7. 🔄 User invitation endpoint (therapist davet)

