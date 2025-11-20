# 🚀 Gelişmiş Özellikler - Detaylı Açıklama

Bu doküman, sistemin **kritik** gelişmiş özelliklerini detaylı olarak açıklar.

---

## 🏢 1. ÇOKLU LOKASYON VE ODA YÖNETİMİ

### Problem
Sistem sadece "Zamanı" değil, "Mekanı" da yönetmelidir. Bir kliniğin farklı semtlerde şubeleri veya aynı bina içinde farklı katları olabilir.

### Çözüm

#### 1.1 Şube ve Lokasyon Mantığı

**Database Modelleri:**
- `Location`: Şube/lokasyon bilgileri (Kadıköy Şube, Nişantaşı Şube)
- `TherapistLocation`: Terapistin hangi günlerde hangi lokasyonda olduğu

**Nasıl Çalışır:**
1. Terapist için `workingHours` tanımlanırken lokasyon bazlı kural setleri oluşturulur
2. Örnek: Terapist A, Pazartesi günleri Kadıköy'de, Salı günleri Online, Çarşamba günleri Nişantaşı'nda
3. Randevu alınırken danışan "Yüz Yüze" seçerse, sistem o gün terapistin hangi şubede olduğunu otomatik algılar

**Örnek JSON:**
```json
{
  "monday": {
    "start": "09:00",
    "end": "17:00",
    "locationId": "kadikoy-branch-id"
  },
  "tuesday": {
    "start": "10:00",
    "end": "18:00",
    "locationId": "online"
  }
}
```

#### 1.2 Oda (Resource) Rezervasyonu

**Database Modelleri:**
- `Room`: Oda bilgileri (Oyun Terapisi Odası, EMDR Odası)
- `RoomType`: Oda tipi (INDIVIDUAL, GROUP, PLAY_THERAPY, EMDR, COUPLE)

**Çifte Çakışma Kontrolü (Double Conflict Check):**
1. Terapist o saatte müsait mi? ✅
2. Seçilen terapi türüne uygun oda o saatte müsait mi? ✅

**Randevu Oluşturma Akışı:**
```
1. Danışan randevu almak ister
2. Terapist seçilir
3. Tarih/saat seçilir
4. Terapi türü seçilir (Örn: Oyun Terapisi)
5. Sistem kontrol eder:
   - Terapist o saatte müsait mi?
   - Oyun Terapisi Odası o saatte müsait mi?
6. İkisi de müsaitse → Randevu oluşturulur
7. Biri müsait değilse → Hata mesajı
```

---

## 👥 2. BAĞLI HESAPLAR (Family Management)

### Problem
Çocuk, ergen ve çift terapileri için kritik eksiklik. 18 yaş altı danışanların yasal velisi sisteme kayıt olur, ancak klinik notlar çocuğun adına tutulur.

### Çözüm

#### 2.1 Ebeveyn - Çocuk İlişkisi

**Database Modelleri:**
- `LinkedAccount`: Master-Sub ilişkisi
- `relationship`: "parent", "guardian", "spouse", "partner"

**Nasıl Çalışır:**

1. **Master Account (Veli):**
   - Ödemeyi yapar
   - Randevuyu alır
   - Fatura bu kişiye kesilir
   - Randevu saatini görür

2. **Sub-Profile (Çocuk):**
   - Tıbbi geçmiş
   - Seans notları
   - Tanılar
   - Tüm klinik veriler

3. **Gizlilik Ayrımı:**
   - Ebeveyn sisteme girdiğinde randevu saatini ve ödemeyi görür
   - Ancak terapist "Gizli Not" (`isPrivate: true`) olarak işaretlediyse çocuğun seans içeriğini göremez
   - **Ergen gizliliği esastır**

**Privacy Settings:**
```typescript
{
  canViewNotes: false,    // Ebeveyn seans notlarını görebilir mi?
  canViewPayments: true   // Ebeveyn ödemeleri görebilir mi?
}
```

#### 2.2 Çift Terapisi Yönetimi

**Nasıl Çalışır:**
- Randevu kartında "Primary Client" (Birincil Danışan) ve "Partner" alanları
- Sistem iki kişinin de dosyasında bu seansı gösterir
- Not tek bir yere yazılır ve diğerine referans (link) verilir
- Her iki danışan için ayrı ödeme takibi (opsiyonel)

---

## ⏳ 3. BEKLEME LİSTESİ (Waitlist)

### Problem
Dolu takvimlerden gelir kaybını önlemek için.

### Çözüm

**Database Modelleri:**
- `WaitlistRequest`: Bekleme listesi talepleri

**Akıllı Sıra Sistemi:**

1. **Talebi Oluşturma:**
   - Danışan istediği saat doluysa "Bu saat açılırsa bana haber ver" diyebilir
   - Terapist veya danışan, dolu bir slot için "Waitlist Request" oluşturur

2. **Otomatik Bildirim:**
   - Eğer o saatteki asıl randevu iptal edilirse (Status: CANCELLED)
   - Sistem bekleme listesindeki kişilere bakar

3. **Bildirim Modları:**

   **Manuel Mod:**
   - Terapiste "Yer açıldı, bekleyen 3 kişi var, kimi arayalım?" diye sorar
   - Terapist manuel olarak seçer

   **Otomatik Mod (First Come First Serve):**
   - Bekleyen herkese "Saat 14:00 boşa çıktı, ilk kapan alır" SMS'i/Bildirimi gider
   - İlk rezervasyon yapan alır

**Özellikler:**
- Öncelik sırası (priority)
- Otomatik expire (X gün sonra)
- Bildirim sayısı takibi
- Randevu ile otomatik bağlantı

---

## 🏨 4. RESEPSİYON VE KARŞILAMA MODÜLÜ

### Problem
Fiziksel kliniklerdeki asistanın operasyonel ekranı.

### Çözüm

**Database Modelleri:**
- `ReceptionCheckIn`: Check-in kayıtları

#### 4.1 Check-in (Giriş) Akışı

**Nasıl Çalışır:**
1. Asistan ekranında "Bugünkü Randevular" listesi akar
2. Danışan kapıdan girdiğinde asistan "Geldi" (Arrived) butonuna basar
3. Terapistin ekranına anlık bir "Toast Notification" düşer: "Danışanınız Ahmet Bey bekleme salonunda."
4. Bu özellik, terapistin seansı toparlayıp odadan çıkmasını sağlar

**Özellikler:**
- Check-in zamanı kaydı
- Bekleme süresi takibi
- Check-in yapan asistan bilgisi

#### 4.2 Gecikme Yönetimi

**Nasıl Çalışır:**
1. Terapist "Seansım 10 dk uzayacak" butonuna basar
2. Sistem, sıradaki danışana (henüz gelmediyse) SMS atar
3. Asistana bilgi verir ("Çay ikram edip bekletin")
4. Gecikme geçmişi tutulur

---

## 📝 5. ÖN DEĞERLENDİRME VE FORMLAR

### Problem
Seans verimliliğini artırmak için veri toplama.

### Çözüm

**Database Modelleri:**
- `IntakeForm`: Form kayıtları

**Otomatik Form Gönderimi:**

1. **Tetikleme:**
   - Randevu CONFIRMED statüsüne geçtiğinde
   - Sistem otomatik bir email/SMS atar: "İlk seansımızdan önce sizi tanımamız için lütfen bu formu doldurun."

2. **Form Türleri:**
   - Genel Başvuru Formu
   - KVKK Onayı
   - Beck Depresyon Ölçeği
   - Özel formlar (yönetilebilir)

3. **Tamamlanma:**
   - Danışan formu dijital olarak doldurup imzaladığında
   - PDF olarak dosyasına eklenir
   - Terapiste "Form tamamlandı" bildirimi gider

**Özellikler:**
- Form template yönetimi (JSON)
- Dijital imza
- PDF oluşturma
- Otomatik expire (X gün sonra)
- Form tamamlanma takibi

---

## 💳 6. PAKET VE FİZİKSEL ÖDEME YÖNETİMİ

### Problem
Online ödeme dışındaki finansal senaryolar.

### Çözüm

#### 6.1 Seans Paketleri (Bundles)

**Database Modelleri:**
- `SessionPackage`: Paket kayıtları

**Nasıl Çalışır:**
1. Danışan toplu ödeme yapar (Örn: 10 Seans için %20 indirim)
2. Hesabına "10 Seans Kredisi" yüklenir
3. Her seans tamamlandığında (COMPLETED), bakiyeden para değil "1 Seans Hakkı" düşülür
4. Sistem kalan hakları takip eder
5. Bitmeye yakın uyarı verir

**Özellikler:**
- Paket adı ve açıklama
- Toplam seans sayısı
- Kullanılan seans sayısı
- İndirim yüzdesi
- Expire tarihi
- Paket durumu (ACTIVE, USED_UP, EXPIRED, CANCELLED)

#### 6.2 Fiziksel Kasa (Petty Cash)

**Nasıl Çalışır:**
1. Sistemde sanal bir "Kasa Hesabı" olur
2. Asistan nakit tahsilat yaptığında Payment Method: CASH seçer
3. Gün sonunda "Z Raporu" benzeri bir raporla kasadaki fiziksel paranın sistemdekiyle tutarlılığı kontrol edilir

**Özellikler:**
- Günlük kasa raporu
- Tutarlılık kontrolü
- Kasa geçmişi

---

## 🔄 7. ÇİFT YÖNLÜ TAKVİM ENTEGRASYONU

### Problem
Terapistin özel hayatı ile iş hayatını çakıştırmamak için.

### Çözüm

**Database Modelleri:**
- `CalendarSync`: Takvim senkronizasyonu

**Dışarıdan İçeriye Veri Akışı (External to System):**

1. **Entegrasyon:**
   - Google Calendar API
   - Outlook Calendar API
   - Apple Calendar (iCal)

2. **Nasıl Çalışır:**
   - Sistem Google Calendar API (veya Outlook) üzerinden watch (izleme) yapar
   - Terapistin kişisel takvimindeki "Busy" (Meşgul) işaretli her blok
   - Yönetim panelinde otomatik olarak "Bloke Zaman" olarak işaretlenir
   - Etkinlik adı "Meşgul" olarak görünür, detay gizlenir

3. **Senkronizasyon Yönü:**
   - `syncToExternal`: System → External (opsiyonel)
   - `syncFromExternal`: External → System (varsayılan: açık)

**Özellikler:**
- OAuth2 authentication
- Token refresh
- Otomatik senkronizasyon
- Çakışma önleme

---

## 🚨 8. ACİL DURUM VE GÜVENLİK

### Problem
Güvenlik ve gizlilik kritik.

### Çözüm

#### 8.1 Panik Butonu (Quick Exit)

**Nasıl Çalışır:**
1. Ekranın her zaman görünür bir yerinde (genelde sağ alt veya üst) belirgin bir buton
2. Klavye kısayolu (Örn: ESC tuşuna iki kez basmak)
3. Basıldığında:
   - Site anında Google anasayfasına, bir haber sitesine veya hava durumu sayfasına yönlenir
   - Tarayıcı geçmişinden son işlem silinir
   - Sessiz mod (bildirimler kapatılır)

**Frontend Implementation:**
```typescript
// Quick exit button
const handleQuickExit = () => {
  // Clear session
  sessionStorage.clear();
  localStorage.clear();
  
  // Redirect to safe page
  window.location.href = 'https://www.google.com';
  
  // Clear history (if possible)
  window.history.replaceState(null, '', 'about:blank');
};
```

#### 8.2 Veri İhracı (Data Export)

**Database Modelleri:**
- `DataExport`: Export kayıtları

**Nasıl Çalışır:**
1. "Tüm Verilerimi İndir" butonu
2. Sistem arka planda bir Worker çalıştırır
3. Tüm notlar, ödemeler, randevu geçmişi ve yüklenen dosyalar bir ZIP dosyası haline getirilir
4. PDF formatında okunabilir dökümler oluşturulur
5. İndirme linki güvenli email ile iletilir

**Özellikler:**
- Export türü (FULL, APPOINTMENTS, SESSIONS, PAYMENTS)
- Background processing (Worker)
- PDF generation
- ZIP file creation
- Secure download link
- Auto-expire (X gün sonra link geçersiz olur)
- KVKK uyumlu

---

## 📊 Öncelik Sırası (Geliştirme Planı)

### Faz 1: Temel (MVP)
1. ✅ Keycloak & MinIO Setup
2. 🔄 Backend Keycloak Entegrasyonu
3. 🔄 Backend MinIO/S3 Entegrasyonu

### Faz 2: Kritik Özellikler (1-2 Hafta)
1. 🏢 Lokasyon ve Oda Yönetimi
2. 👥 Bağlı Hesaplar (Family Management)
3. ⏳ Bekleme Listesi

### Faz 3: Operasyonel (2-3 Hafta)
1. 🏨 Resepsiyon Modülü
2. 📝 Intake Forms
3. 💳 Seans Paketleri

### Faz 4: Gelişmiş (3-4 Hafta)
1. 🔄 Takvim Entegrasyonu
2. 🚨 Panik Butonu
3. 📦 Veri İhracı

---

**Son Güncelleme:** 19 Kasım 2025  
**Versiyon:** 1.0

