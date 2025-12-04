# 🧪 Test Kılavuzu - Psikolog Sistemi

## 📋 İçindekiler
1. [Testler Ne İçin?](#testler-ne-için)
2. [Ne Zaman Kullanılmalı?](#ne-zaman-kullanılmalı)
3. [Nasıl Çalıştırılır?](#nasıl-çalıştırılır)
4. [Test Türleri ve Açıklamaları](#test-türleri-ve-açıklamaları)
5. [Test Senaryoları](#test-senaryoları)
6. [Best Practices](#best-practices)

---

## 🎯 Testler Ne İçin?

E2E (End-to-End) testleri, **tüm sistemin gerçek kullanım senaryolarını** simüle eder:

### ✅ Faydaları:
- **Regresyon Önleme**: Yeni özellik eklerken eski özelliklerin bozulmadığını garanti eder
- **Dokümantasyon**: API'nin nasıl çalıştığını gösterir
- **Güven**: Production'a deploy etmeden önce sistemin çalıştığından emin olursun
- **Hata Bulma**: Manuel test etmeden önce hataları yakalarsın
- **CI/CD**: Otomatik deployment pipeline'ında kullanılır

---

## ⏰ Ne Zaman Kullanılmalı?

### 1. **Her Kod Değişikliğinden Sonra** (Önerilen)
```bash
# Yeni bir feature ekledikten sonra
pnpm test:e2e

# Veya sadece ilgili test dosyasını çalıştır
pnpm test:e2e -- --testPathPattern=auth.e2e-spec.ts
```

### 2. **Commit Öncesi** (Pre-commit Hook)
```bash
# Git commit yapmadan önce testleri çalıştır
pnpm test:e2e
```

### 3. **Pull Request Öncesi**
- PR açmadan önce tüm testlerin geçtiğinden emin ol

### 4. **Production Deploy Öncesi** (Zorunlu!)
- Production'a deploy etmeden önce MUTLAKA testleri çalıştır

### 5. **Sprint Sonu / Release Öncesi**
- Tüm sprint boyunca yapılan değişikliklerin test edilmesi

---

## 🚀 Nasıl Çalıştırılır?

### Tüm Testleri Çalıştır
```bash
cd apps/api
pnpm test:e2e
```

### Belirli Bir Test Dosyasını Çalıştır
```bash
# Sadece auth testleri
pnpm test:e2e -- --testPathPattern=auth.e2e-spec.ts

# Sadece users testleri
pnpm test:e2e -- --testPathPattern=users.e2e-spec.ts

# Sadece appointments testleri
pnpm test:e2e -- --testPathPattern=appointments.e2e-spec.ts
```

### Watch Mode (Geliştirme Sırasında)
```bash
# Dosya değiştiğinde otomatik test çalıştır
pnpm test:e2e -- --watch
```

### Coverage (Kapsam) Raporu
```bash
# Hangi kodların test edildiğini göster
pnpm test:cov
```

---

## 📚 Test Türleri ve Açıklamaları

### 1. **app.e2e-spec.ts** - Health Check Testleri
**Ne Yapar?**
- API'nin çalışıp çalışmadığını kontrol eder
- Health endpoint'lerini test eder

**Test Senaryoları:**
- ✅ `/api/v1/health` - Genel sağlık kontrolü
- ✅ `/api/v1/health/live` - Liveness probe (Kubernetes için)
- ✅ `/api/v1/health/ready` - Readiness probe (Database/Redis kontrolü)

**Ne Zaman Kullanılır?**
- Deployment sonrası sistemin çalıştığını doğrulamak için
- Monitoring sistemlerinde health check olarak

---

### 2. **auth.e2e-spec.ts** - Kimlik Doğrulama Testleri
**Ne Yapar?**
- Kullanıcı kaydı, giriş, token yenileme işlemlerini test eder
- Güvenlik kontrollerini doğrular

**Test Senaryoları:**
- ✅ **Register**: Yeni kullanıcı kaydı (CLIENT, THERAPIST, ADMIN)
- ✅ **Duplicate Check**: Aynı email/telefon ile kayıt engelleme
- ✅ **Validation**: Geçersiz email, zayıf şifre kontrolü
- ✅ **Login**: Doğru/yanlış şifre ile giriş
- ✅ **Token Refresh**: Access token yenileme
- ✅ **Profile**: Kullanıcı profil bilgilerini alma
- ✅ **Logout**: Çıkış yapma
- ✅ **Password Reset**: Şifre sıfırlama akışı

**Ne Zaman Kullanılır?**
- Auth sistemi değişikliklerinden sonra
- Yeni role eklediğinde
- Güvenlik güncellemelerinden sonra

---

### 3. **users.e2e-spec.ts** - Kullanıcı Yönetimi Testleri
**Ne Yapar?**
- Kullanıcı CRUD işlemlerini test eder
- Yetkilendirme (authorization) kontrollerini doğrular

**Test Senaryoları:**
- ✅ **List Users**: Admin tüm kullanıcıları görebilir
- ✅ **Access Control**: Client sadece kendi profilini görebilir
- ✅ **Update Profile**: Kullanıcı kendi profilini güncelleyebilir
- ✅ **Duplicate Email**: Aynı email ile güncelleme engelleme
- ✅ **Soft Delete**: Admin kullanıcı silebilir
- ✅ **Restore**: Silinen kullanıcı geri yüklenebilir

**Ne Zaman Kullanılır?**
- User management özellikleri değiştiğinde
- Yeni role/permission eklediğinde
- Profile update mantığı değiştiğinde

---

### 4. **clients.e2e-spec.ts** - Danışan Yönetimi Testleri
**Ne Yapar?**
- Danışan (client) profil yönetimini test eder
- Onay (consent) yönetimini kontrol eder

**Test Senaryoları:**
- ✅ **List Clients**: Admin/Therapist danışanları görebilir
- ✅ **Search**: İsim/email ile arama
- ✅ **View Profile**: Danışan profil detayları
- ✅ **Update Profile**: Profil güncelleme
- ✅ **Consent Management**: Onay durumları (consent, recording, data processing)
- ✅ **Soft Delete**: Danışan silme/geri yükleme

**Ne Zaman Kullanılır?**
- Client profile özellikleri değiştiğinde
- Consent yönetimi güncellendiğinde
- KVKK uyumluluk kontrolleri için

---

### 5. **appointments.e2e-spec.ts** - Randevu Yönetimi Testleri
**Ne Yapar?**
- Randevu oluşturma, güncelleme, iptal işlemlerini test eder
- Çakışma (conflict) kontrolünü doğrular

**Test Senaryoları:**
- ✅ **Create Appointment**: Yeni randevu oluşturma
- ✅ **Conflict Detection**: Aynı saatte iki randevu engelleme
- ✅ **List Appointments**: Terapist/danışan randevularını listeleme
- ✅ **Update Appointment**: Randevu bilgilerini güncelleme
- ✅ **Status Update**: Randevu durumu değiştirme (SCHEDULED → CONFIRMED)
- ✅ **Cancel**: Randevu iptal etme
- ✅ **Reschedule**: Randevu yeniden planlama
- ✅ **Available Slots**: Boş zaman dilimlerini bulma

**Ne Zaman Kullanılır?**
- Randevu sistemi değişikliklerinden sonra
- Yeni randevu durumu eklediğinde
- Çakışma kontrolü mantığı değiştiğinde

---

### 6. **sessions.e2e-spec.ts** - Seans Yönetimi Testleri
**Ne Yapar?**
- Terapi seanslarını ve notlarını test eder
- Seans imzalama işlemini kontrol eder

**Test Senaryoları:**
- ✅ **Create Session**: Randevudan seans oluşturma
- ✅ **Update Notes**: Klinik notları, tedavi planı güncelleme
- ✅ **Sign Session**: Seans notlarını imzalama
- ✅ **Draft Sessions**: Taslak seansları listeleme
- ✅ **Client History**: Danışan seans geçmişi
- ✅ **Statistics**: Terapist istatistikleri

**Ne Zaman Kullanılır?**
- Seans notları sistemi değiştiğinde
- Yeni not alanı eklediğinde
- İmzalama akışı güncellendiğinde

---

### 7. **payments.e2e-spec.ts** - Ödeme Yönetimi Testleri
**Ne Yapar?**
- Ödeme işlemlerini ve durumlarını test eder
- İade (refund) işlemlerini kontrol eder

**Test Senaryoları:**
- ✅ **Create Payment**: Yeni ödeme kaydı oluşturma
- ✅ **Process Payment**: Ödeme işleme (tam/partial)
- ✅ **Refund**: Ödeme iadesi
- ✅ **Status Management**: Ödeme durumu yönetimi
- ✅ **Statistics**: Ödeme istatistikleri
- ✅ **Revenue by Method**: Ödeme yöntemine göre gelir

**Ne Zaman Kullanılır?**
- Ödeme sistemi değişikliklerinden sonra
- Yeni ödeme yöntemi eklediğinde
- İade mantığı güncellendiğinde

---

### 8. **reports.e2e-spec.ts** - Raporlama Testleri
**Ne Yapar?**
- Dashboard ve rapor endpoint'lerini test eder
- İstatistik hesaplamalarını doğrular

**Test Senaryoları:**
- ✅ **Dashboard Stats**: Genel istatistikler (toplam danışan, randevu, seans)
- ✅ **Appointment Stats**: Randevu istatistikleri (tamamlanma oranı, iptal oranı)
- ✅ **Revenue Report**: Gelir raporları
- ✅ **Therapist Performance**: Terapist performans raporları
- ✅ **Client Report**: Danışan raporları

**Ne Zaman Kullanılır?**
- Raporlama özellikleri değiştiğinde
- Yeni istatistik eklediğinde
- Dashboard güncellendiğinde

---

### 9. **tenant.e2e-spec.ts** - Multi-Tenant İzolasyon Testleri
**Ne Yapar?**
- Farklı organizasyonların birbirinden izole olduğunu test eder
- Güvenlik kontrollerini doğrular

**Test Senaryoları:**
- ✅ **Isolation**: Org A'daki admin, Org B'daki kullanıcıyı göremez
- ✅ **Same Org Access**: Aynı organizasyondaki kullanıcılar birbirini görebilir
- ✅ **Own Profile**: Kullanıcı kendi profilini her zaman görebilir
- ✅ **List Isolation**: Kullanıcı listesi organizasyona göre filtrelenir

**Ne Zaman Kullanılır?**
- Multi-tenant özellikleri değiştiğinde
- Güvenlik güncellemelerinden sonra
- Yeni organizasyon özelliği eklediğinde

---

## 🔍 Test Senaryoları Örnekleri

### Senaryo 1: Yeni Özellik Ekleme
```bash
# 1. Yeni özelliği kodla
# 2. İlgili test dosyasını güncelle veya yeni test ekle
# 3. Testleri çalıştır
pnpm test:e2e -- --testPathPattern=appointments.e2e-spec.ts

# 4. Tüm testler geçerse commit yap
```

### Senaryo 2: Bug Fix
```bash
# 1. Bug'ı düzelt
# 2. İlgili testi çalıştır
pnpm test:e2e -- --testPathPattern=auth.e2e-spec.ts

# 3. Eğer test yoksa, bug için test ekle (regresyon önleme)
# 4. Tüm testler geçerse commit yap
```

### Senaryo 3: Production Deploy
```bash
# 1. Tüm testleri çalıştır
pnpm test:e2e

# 2. Tüm testler geçmeli (114/114)
# 3. Deploy yap
```

---

## 💡 Best Practices

### ✅ Yapılması Gerekenler

1. **Her Feature İçin Test Yaz**
   - Yeni endpoint eklediğinde mutlaka test ekle
   - Test yazmak, kodun nasıl kullanılacağını düşünmene yardımcı olur

2. **Testleri Düzenli Çalıştır**
   - Her commit öncesi testleri çalıştır
   - CI/CD pipeline'ında otomatik çalıştır

3. **Test İsimlerini Açıklayıcı Yap**
   ```typescript
   // ❌ Kötü
   it('test 1', () => { ... });
   
   // ✅ İyi
   it('should register a new client user with valid data', () => { ... });
   ```

4. **Test Verilerini Temizle**
   - Her test öncesi database'i temizle (`cleanDatabase`)
   - Testler birbirini etkilememeli

5. **Gerçekçi Senaryolar Test Et**
   - Sadece "happy path" değil, hata durumlarını da test et
   - Edge case'leri düşün

### ❌ Yapılmaması Gerekenler

1. **Testleri Skip Etme**
   ```typescript
   // ❌ Kötü
   it.skip('should work', () => { ... });
   ```

2. **Test Verilerini Paylaşma**
   - Her test kendi verilerini oluşturmalı
   - Testler arası bağımlılık olmamalı

3. **Flaky Testler Yazma**
   - Test her çalıştırmada aynı sonucu vermeli
   - Rastgele değerler kullanma (timestamp hariç)

4. **Testleri Çok Karmaşık Yapma**
   - Her test tek bir şeyi test etmeli
   - Test okunabilir olmalı

---

## 🛠️ Troubleshooting

### Testler Çok Yavaş Çalışıyor
```bash
# Sadece değişen testleri çalıştır
pnpm test:e2e -- --onlyChanged
```

### Database Deadlock Hatası
- Testler seri çalışıyor (`maxWorkers: 1`)
- Eğer hala oluyorsa, test database'ini kontrol et

### Test Başarısız Oluyor
1. Hata mesajını oku
2. İlgili endpoint'i manuel test et
3. Test verilerini kontrol et
4. Database durumunu kontrol et

---

## 📊 Test Coverage Hedefi

- **Minimum**: %70
- **Hedef**: %80+
- **İdeal**: %90+

Coverage raporu:
```bash
pnpm test:cov
```

---

## 🎓 Öğrenme Kaynakları

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---

## 📝 Özet

**Testler = Güven + Hız + Kalite**

- ✅ Her değişiklikten sonra testleri çalıştır
- ✅ Yeni özellik eklerken test de ekle
- ✅ Production deploy öncesi MUTLAKA test et
- ✅ Testler başarısız olursa deploy yapma

**Unutma**: Testler senin en iyi arkadaşın! 🚀

