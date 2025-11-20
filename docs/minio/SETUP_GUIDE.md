# 📦 MinIO Setup Guide - Psikolog Sistemi

## 📋 İçindekiler
1. [MinIO'ya Erişim](#minioya-erişim)
2. [Bucket Oluşturma](#bucket-oluşturma)
3. [Access Policy Konfigürasyonu](#access-policy-konfigürasyonu)
4. [Lifecycle Policies](#lifecycle-policies)
5. [Access Keys Yönetimi](#access-keys-yönetimi)
6. [Test & Verification](#test--verification)

---

## 🚀 MinIO'ya Erişim

### 1. MinIO Console
```
URL: http://localhost:9001
Username: minioadmin
Password: minioadmin
```

### 2. İlk Giriş
1. Tarayıcınızda `http://localhost:9001` adresine gidin
2. Kullanıcı adı: `minioadmin`
3. Şifre: `minioadmin`
4. **Login** butonuna tıklayın

---

## 🪣 Bucket Oluşturma

MinIO'da dosyaları organize etmek için 4 farklı bucket oluşturacağız.

### Bucket 1: psikolog-avatars (Profil Resimleri)

#### Adım 1: Bucket Oluştur
1. Sol menüden **Buckets** seçin
2. **Create Bucket** butonuna tıklayın
3. Bucket bilgileri:

```yaml
Bucket Name: psikolog-avatars
```

4. **Create Bucket** butonuna tıklayın

#### Adım 1.5: Versioning Ayarları (Bucket Oluşturulduktan Sonra)
1. **psikolog-avatars** bucket'ına tıklayın
2. Üst menüden **Settings** (⚙️) sekmesine gidin
3. **Versioning** bölümünü bulun
4. **Versioning: OFF** olarak ayarlayın (kapalı olmalı)
5. **Object Locking: OFF** (kapalı olmalı - genelde varsayılan olarak kapalıdır)

#### Adım 2: Access Policy (Public Read)
1. **psikolog-avatars** bucket'ına tıklayın
2. **Anonymous** tab'ına gidin
3. **Add Access Rule** butonuna tıklayın
4. Aşağıdaki policy'yi seçin:

```yaml
Prefix: * (tüm dosyalar)
Access: readonly (download only)
```

**Not:** Avatar'lar public olarak erişilebilir olmalı (CDN gibi)

---

### Bucket 2: psikolog-documents (Belgeler - Private)

#### Adım 1: Bucket Oluştur
1. **Create Bucket** → Bucket Name: `psikolog-documents` → **Create Bucket**

#### Adım 1.5: Versioning Ayarları
1. **psikolog-documents** bucket'ına tıklayın
2. **Settings** (⚙️) sekmesine gidin
3. **Versioning** bölümünde **Versioning: ON** yapın (açık olmalı)
4. **Object Locking: OFF** (kapalı)

**Bu bucket private kalacak, access policy EKLEMEYİN!**

#### Kullanım Alanları:
- Terapi seans notları
- Raporlar
- Hasta belgeleri
- Consent formları (KVKK)
- Psikolojik test sonuçları

---

### Bucket 3: psikolog-attachments (Genel Dosyalar - Private)

#### Adım 1: Bucket Oluştur
1. **Create Bucket** → Bucket Name: `psikolog-attachments` → **Create Bucket**

#### Adım 1.5: Versioning Ayarları
1. **psikolog-attachments** bucket'ına tıklayın
2. **Settings** (⚙️) sekmesine gidin
3. **Versioning: OFF** (kapalı)
4. **Object Locking: OFF** (kapalı)

**Bu bucket da private!**

#### Kullanım Alanları:
- Faturalar
- Makbuzlar
- Email attachments
- Genel dokümanlar

---

### Bucket 4: psikolog-backups (Yedekler - Private)

#### Adım 1: Bucket Oluştur
1. **Create Bucket** → Bucket Name: `psikolog-backups` → **Create Bucket**

#### Adım 1.5: Versioning Ayarları
1. **psikolog-backups** bucket'ına tıklayın
2. **Settings** (⚙️) sekmesine gidin
3. **Versioning: ON** (açık - yedek güvenliği için)
4. **Object Locking: OFF** (kapalı)

#### Kullanım Alanları:
- Database backups
- Configuration backups
- System snapshots

---

## 🔒 Access Policy Konfigürasyonu

### Bucket Policy JSON (Advanced)

Daha detaylı kontrol için JSON policy kullanabilirsiniz.

#### psikolog-avatars (Public Read Policy)

1. **psikolog-avatars** → **Anonymous** → **Access Rules** → **Custom Policy**
2. Aşağıdaki JSON'ı yapıştırın:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::psikolog-avatars/*"]
    }
  ]
}
```

#### psikolog-documents (Signed URL Only)

Private bucket - sadece signed URL ile erişim.
Policy EKLEMEYE GEREK YOK.

#### CORS Ayarları (Her bucket için)

Eğer web'den direct upload yapılacaksa CORS gerekli:

1. Bucket seçin → **Settings** → **CORS**
2. Aşağıdaki konfigürasyonu ekleyin:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedOrigin>http://localhost:3001</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
  </CORSRule>
</CORSConfiguration>
```

> Production'da `AllowedOrigin`'i gerçek domain'iniz ile değiştirin!

---

## ⏰ Lifecycle Policies (Otomatik Silme/Arşivleme)

### psikolog-backups için Lifecycle Policy

Eski backupları otomatik silmek için:

1. **psikolog-backups** bucket → **Lifecycle**
2. **Add Lifecycle Rule**

```yaml
Rule Name: delete-old-backups
Status: Enabled
Prefix: database/ (opsiyonel)
Expiration:
  - Delete objects after: 90 days
```

3. **Save**

### psikolog-documents için Retention Policy (KVKK Uyumu)

KVKK'ya göre hasta verilerini 7 yıl saklamak zorunludur:

```yaml
Rule Name: retain-documents-7-years
Status: Enabled
Prefix: session-notes/
Expiration:
  - Delete objects after: 2555 days (7 yıl)
Transition: - (arşivleme yok)
```

---

## 🔑 Access Keys Yönetimi

### Root User Access Key (Development)

Development için root credentials kullanılabilir:
```env
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

### Service Account Oluşturma (Önerilen - Production)

#### Adım 1: Service Account Oluştur

1. Sol menüden **Identity** → **Service Accounts**
2. **Create Service Account**

```yaml
Access Key: psikolog-api-service
Secret Key: (otomatik generate edilecek - kaydedin!)
Description: Backend API S3 access
Policy: readwrite (aşağıda custom policy)
```

#### Adım 2: Custom Policy

Daha güvenli bir yaklaşım için specific policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::psikolog-avatars",
        "arn:aws:s3:::psikolog-documents",
        "arn:aws:s3:::psikolog-attachments"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::psikolog-avatars/*",
        "arn:aws:s3:::psikolog-documents/*",
        "arn:aws:s3:::psikolog-attachments/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::psikolog-backups",
        "arn:aws:s3:::psikolog-backups/*"
      ]
    }
  ]
}
```

#### Adım 3: Environment Variables

Generated credentials'ları `.env` dosyasına ekleyin:

```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=<generated-access-key>
S3_SECRET_KEY=<generated-secret-key>
S3_REGION=us-east-1
S3_USE_SSL=false
S3_FORCE_PATH_STYLE=true
```

**Not:** `S3_FORCE_PATH_STYLE=true` MinIO için **zorunludur** çünkü MinIO path-style URL'ler kullanır (AWS S3'ten farklı olarak).

---

## 🧪 Test & Verification

### Test 1: MinIO CLI (mc) ile Test

MinIO CLI'yi Docker ile kullanarak test:

```bash
# MinIO Client container'ı çalıştır
docker run -it --rm --network psikolog-network \
  minio/mc alias set local http://minio:9000 minioadmin minioadmin

# Bucket listele
docker run -it --rm --network psikolog-network \
  minio/mc ls local

# Test dosyası yükle
echo "Test file content" > test.txt
docker run -it --rm -v ${PWD}:/data --network psikolog-network \
  minio/mc cp /data/test.txt local/psikolog-avatars/test.txt

# Dosyayı listele
docker run -it --rm --network psikolog-network \
  minio/mc ls local/psikolog-avatars/

# Dosyayı sil
docker run -it --rm --network psikolog-network \
  minio/mc rm local/psikolog-avatars/test.txt
```

### Test 2: cURL ile HTTP Test

```bash
# Bucket listele (AWS S3 API)
curl -X GET http://localhost:9000 \
  -H "Host: localhost:9000"

# Public avatar'a erişim testi
# (Önce Console'dan bir test dosyası yükleyin)
curl -X GET http://localhost:9000/psikolog-avatars/test.jpg

# Private document erişim testi (403 dönmeli)
curl -X GET http://localhost:9000/psikolog-documents/private.pdf
# Expected: AccessDenied error
```

### Test 3: Node.js Test Script

`test-minio.js` dosyası oluşturun:

```javascript
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true, // MinIO için gerekli
});

async function testMinIO() {
  try {
    // Bucket listele
    const bucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await s3Client.send(bucketsCommand);
    console.log('✅ Buckets:', bucketsResponse.Buckets.map(b => b.Name));

    // Test dosya yükle
    const uploadCommand = new PutObjectCommand({
      Bucket: 'psikolog-avatars',
      Key: 'test-upload.txt',
      Body: 'Hello from Node.js!',
      ContentType: 'text/plain',
    });
    await s3Client.send(uploadCommand);
    console.log('✅ File uploaded successfully!');

    console.log('\n✅ MinIO connection test passed!');
  } catch (error) {
    console.error('❌ MinIO test failed:', error.message);
  }
}

testMinIO();
```

Çalıştır:
```bash
node test-minio.js
```

---

## 📊 Monitoring & Metrics

### Console üzerinden Monitoring

1. **Monitoring** → **Metrics**
   - Total storage usage
   - Object count
   - API request metrics
   - Error rates

### Bucket Statistics

Her bucket için:
1. Bucket seçin → **Summary**
   - Object count
   - Total size
   - Bandwidth usage

---

## 🔧 Troubleshooting

### Sorun 1: MinIO'ya erişilemiyor

```bash
# Container durumu
docker ps | grep minio

# MinIO logları
docker logs psikolog-minio

# Restart
docker restart psikolog-minio

# Health check
curl -f http://localhost:9000/minio/health/live
```

### Sorun 2: Upload edilemiyor (403 Forbidden)

**Çözüm:**
- Service account permission'larını kontrol edin
- Bucket policy'sini gözden geçirin
- CORS ayarlarını kontrol edin

### Sorun 3: Public bucket'a erişilemiyor

**Çözüm:**
- Anonymous access policy'si eklenmiş mi?
- Browser cache'i temizleyin
- URL'yi kontrol edin: `http://localhost:9000/bucket-name/file-name`

### Sorun 4: Disk doldu

**Çözüm:**
```bash
# Disk kullanımı
docker exec psikolog-minio df -h

# Volume temizliği (DİKKAT: VERİ KAYBEDİLEBİLİR!)
docker volume prune
```

---

## 🚀 Production Considerations

### 1. External Access

Production'da MinIO'yu external access için expose etmek:

```yaml
# docker-compose.yml
minio:
  environment:
    MINIO_SERVER_URL: https://s3.psikolog.com
    MINIO_BROWSER_REDIRECT_URL: https://console.psikolog.com
```

### 2. TLS/SSL

```yaml
minio:
  volumes:
    - ./certs:/root/.minio/certs
  environment:
    MINIO_OPTS: "--certs-dir /root/.minio/certs"
```

### 3. High Availability

Multi-node MinIO cluster için:
- Minimum 4 node önerilir
- Distributed setup
- Load balancer (NGINX/HAProxy)

### 4. Backup Strategy

```bash
# Bucket'ı başka bir MinIO/S3'e replicate et
mc mirror local/psikolog-documents remote/psikolog-documents-backup
```

---

## 📚 Sonraki Adımlar

1. ✅ Backend S3 client entegrasyonu (`@aws-sdk/client-s3`)
2. ✅ File upload endpoints (`POST /api/v1/files/upload`)
3. ✅ Signed URL generation (`GET /api/v1/files/:id/download`)
4. ✅ Frontend file upload component
5. ✅ Image optimization (sharp/next-image)

Detaylı entegrasyon için `ROADMAP.md` dosyasına bakın.

---

## 📎 Faydalı Linkler

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [AWS SDK for JavaScript v3 - S3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)
- [MinIO Client (mc) Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)

---

**Oluşturulma Tarihi:** 18 Kasım 2025
**Son Güncelleme:** 18 Kasım 2025
**Versiyon:** 1.0

