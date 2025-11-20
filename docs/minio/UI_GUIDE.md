# MinIO UI Kullanım Kılavuzu

## 📍 Settings Sekmesi Nerede?

MinIO'nun yeni versiyonlarında Settings sekmesi farklı yerlerde olabilir. İşte bulabileceğiniz yerler:

### Yöntem 1: Bucket Listesinden (En Yaygın)

1. Sol sidebar'da bucket listesine bakın
2. Her bucket'ın yanında **üç nokta (⋮)** veya **ayar ikonu (⚙️)** olabilir
3. Bu ikona tıklayın → **Settings** veya **Configuration** seçeneğini bulun

### Yöntem 2: Bucket İçindeyken

1. Bucket'a tıklayın (örneğin `psikolog-avatars`)
2. Üstteki sekmelerde şunları arayın:
   - **Settings** (⚙️)
   - **Configuration** 
   - **Properties**
   - **Summary** (burada da bazı ayarlar olabilir)

### Yöntem 3: Sağ Üst Menü

1. Bucket içindeyken sağ üstteki **üç nokta (⋮)** menüsüne bakın
2. **Bucket Settings** veya **Configure** seçeneğini arayın

### Yöntem 4: Bucket Adının Yanında

1. Bucket içindeyken sol üstte bucket adının yanında bir **ayar ikonu** olabilir
2. Bu ikona tıklayın

---

## ⚠️ ÖNEMLİ: Versioning Ayarları Zorunlu Değil!

**Development ortamında Versioning ayarları kritik değildir!**

- Varsayılan ayarlarla (Versioning: OFF) devam edebilirsiniz
- Production'a geçerken bu ayarları yapabilirsiniz
- Şu anda bucket'lar oluşturulmuş ve çalışır durumda

**Öncelik sırası:**
1. ✅ Bucket'lar oluşturuldu (TAMAMLANDI)
2. ⏭️ Versioning ayarları (opsiyonel - şimdilik atlanabilir)
3. 🔴 **psikolog-avatars için Anonymous access** (ÖNEMLİ - yapılmalı)
4. 🔴 **CORS ayarları** (ÖNEMLİ - yapılmalı)

---

## 🎯 Şimdi Yapılması Gerekenler

### 1. psikolog-avatars için Public Access (ÖNEMLİ)

1. **psikolog-avatars** bucket'ına tıklayın
2. **Anonymous** tab'ını bulun (Settings'te veya bucket içinde bir sekme olabilir)
3. **Add Access Rule** butonuna tıklayın
4. Ayarlar:
   ```
   Prefix: *
   Access: readonly
   ```
5. **Save**

**Eğer Anonymous tab'ını bulamazsanız:**
- Bucket içindeyken sağ üstteki menüden **Access Policy** veya **Permissions** arayın
- Veya bucket listesinde bucket'ın yanındaki menüden **Set Access Policy** seçeneğini arayın

### 2. CORS Ayarları (Her Bucket İçin)

1. Bucket'a tıklayın
2. **Settings** veya **Configuration** sekmesine gidin (yukarıdaki yöntemlerden biriyle)
3. **CORS** bölümünü bulun
4. **Add CORS Configuration** butonuna tıklayın
5. Aşağıdaki XML'i yapıştırın:

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

---

## 🔍 MinIO Versiyonunu Kontrol Etme

Terminal'de çalıştırın:

```powershell
docker exec psikolog-minio minio --version
```

veya

```powershell
docker logs psikolog-minio | Select-String -Pattern "Version"
```

---

## 💡 Alternatif: MinIO CLI ile Ayarlama

Eğer UI'da bulamazsanız, MinIO CLI ile ayarlayabilirsiniz:

```powershell
# MinIO Client container'ı çalıştır
docker run -it --rm --network psikolog-network minio/mc alias set local http://minio:9000 minioadmin minioadmin

# Versioning aç (psikolog-documents için)
docker run -it --rm --network psikolog-network minio/mc version enable local/psikolog-documents

# Versioning aç (psikolog-backups için)
docker run -it --rm --network psikolog-network minio/mc version enable local/psikolog-backups

# Public access (psikolog-avatars için)
docker run -it --rm --network psikolog-network minio/mc anonymous set download local/psikolog-avatars
```

---

## ✅ Özet: Şimdi Ne Yapmalısınız?

1. **Versioning ayarlarını şimdilik atlayın** (opsiyonel)
2. **psikolog-avatars için Anonymous access ekleyin** (ÖNEMLİ)
3. **CORS ayarlarını yapın** (ÖNEMLİ)
4. **Environment variables'ı ekleyin** (apps/api/.env)

Versioning ayarlarını bulamazsanız endişelenmeyin, varsayılan ayarlarla devam edebilirsiniz!

