# 🎯 Sistem Özellikleri - Psikolog Sistemi

## 📋 Genel Bakış

Bu sistem, **klinik bazlı (multi-tenant)** bir psikoloji pratik yönetim platformudur. Her klinik kendi organizasyonu altında bağımsız çalışır ve kendi verilerini yönetir.

### 🏥 Multi-Tenant (Klinik Bazlı) Yapı
- Her **klinik** ayrı bir **Organization** olarak sisteme kayıt olur
- Her klinik kendi **terapistlerini**, **lokasyonlarını**, **odalarını** ve **hastalarını** yönetir
- **Veri izolasyonu**: Bir klinik başka bir kliniğin verilerini göremez
- **SUPER_ADMIN** tüm kliniklere erişebilir (platform yönetimi için)
- Her klinik kendi **subscription planını** seçer (trial, basic, premium, enterprise)

---

## 🏢 0. ORGANİZASYON YÖNETİMİ (Organization Management)

### 0.1 Klinik Özellikleri
- ✅ Klinik adı ve slug (benzersiz URL)
- ✅ Logo ve açıklama
- ✅ İletişim bilgileri (email, telefon, website)
- ✅ Adres bilgisi (şehir, ülke)
- ✅ Vergi numarası ve vergi dairesi
- ✅ Subscription yönetimi:
  - **Trial**: 14 günlük deneme
  - **Basic**: Temel özellikler
  - **Premium**: Tüm özellikler
  - **Enterprise**: Özel kurulum
- ✅ Klinik özel ayarlar (JSON formatında)
- ✅ Aktif/Pasif durum yönetimi

### 0.2 Multi-Location Desteği
Her klinik birden fazla lokasyona sahip olabilir:
- Kadıköy Şubesi
- Nişantaşı Şubesi
- Online Hizmetler

---

## 👥 1. KULLANICI YÖNETİMİ (User Management)

### 1.1 Kullanıcı Rolleri
- **SUPER_ADMIN**: Platform yöneticisi (tüm kliniklere erişim)
- **ADMIN**: Klinik yöneticisi (kendi kliniğini yönetir)
- **THERAPIST**: Terapist (seans yönetimi, notlar)
- **RECEPTIONIST**: Resepsiyonist (randevu, check-in, bekleme listesi)
- **ACCOUNTANT**: Muhasebe (ödeme, fatura, raporlar)
- **CLIENT**: Danışan (kendi randevularını görüntüleme)

### 1.2 Organizasyon İlişkisi
- **Tüm çalışanlar** (ADMIN, THERAPIST, RECEPTIONIST, ACCOUNTANT) bir **Organization**'a bağlıdır
- **CLIENT** kullanıcıları birden fazla kliniğe gidebilir (organizasyona bağlı DEĞİL)
- Her kullanıcı sadece kendi organizasyonunun verilerini görebilir

### 1.2 Kullanıcı Özellikleri
- ✅ Email ve telefon ile kayıt/giriş
- ✅ Profil fotoğrafı yükleme (MinIO/S3)
- ✅ Multi-Factor Authentication (MFA) desteği
- ✅ Kullanıcı durumu yönetimi (Aktif, Pasif, Askıya Alınmış)
- ✅ Soft delete (veri koruma)
- ✅ Son giriş takibi
- ✅ Keycloak SSO entegrasyonu

### 1.3 Terapist Profili
- ✅ Lisans numarası kaydı
- ✅ Uzmanlık alanları (multiple)
- ✅ Biyografi ve deneyim yılları
- ✅ Saatlik ücret belirleme
- ✅ Çalışma saatleri ayarlama (haftalık program)
- ✅ Timezone desteği
- ✅ Seans süresi ayarlama (varsayılan 50 dakika)
- ✅ Online randevu açma/kapama
- ✅ Otomatik randevu onayı ayarı

### 1.4 Danışan Profili
- ✅ Kişisel bilgiler (doğum tarihi, cinsiyet, meslek)
- ✅ Acil durum iletişim bilgileri
- ✅ Adres bilgisi
- ✅ Tıbbi geçmiş (şifreli)
- ✅ Mevcut ilaçlar (şifreli)
- ✅ Alerjiler (şifreli)
- ✅ Referans bilgisi
- ✅ KVKK onay formları
  - Genel onay
  - Kayıt onayı
  - Veri işleme onayı
- ✅ İç notlar (sadece terapist görebilir)

---

## 📅 2. RANDEVU YÖNETİMİ (Appointment Management)

### 2.1 Randevu Oluşturma
- ✅ Terapist ve danışan seçimi
- ✅ Tarih/saat seçimi (takvim entegrasyonu)
- ✅ Randevu türü:
  - Bireysel
  - Grup
  - Online (video call link)
  - Yüz yüze (lokasyon belirleme)
- ✅ Randevu süresi (varsayılan terapist ayarından)
- ✅ Timezone desteği
- ✅ Randevu notları (ön hazırlık notları)

### 2.2 Randevu Durumları
- ✅ **SCHEDULED**: Planlandı
- ✅ **CONFIRMED**: Onaylandı
- ✅ **CHECKED_IN**: Giriş yapıldı
- ✅ **IN_PROGRESS**: Devam ediyor
- ✅ **COMPLETED**: Tamamlandı
- ✅ **CANCELLED**: İptal edildi
- ✅ **NO_SHOW**: Gelmedi
- ✅ **RESCHEDULED**: Yeniden planlandı

### 2.3 Randevu Özellikleri
- ✅ Çakışma kontrolü (aynı saatte iki randevu olamaz)
- ✅ Otomatik onaylama (terapist ayarına göre)
- ✅ İptal nedeni kaydı
- ✅ Randevu hatırlatmaları (email, SMS, WhatsApp)
- ✅ Online randevu linki oluşturma
- ✅ Randevu geçmişi görüntüleme

### 2.4 Takvim Görünümü
- ✅ Günlük görünüm
- ✅ Haftalık görünüm
- ✅ Aylık görünüm
- ✅ Terapist bazlı filtreleme
- ✅ Danışan bazlı filtreleme
- ✅ Durum bazlı filtreleme

---

## 📝 3. SEANS YÖNETİMİ (Session Management)

### 3.1 Seans Notları
- ✅ Klinik notlar (şifreli)
- ✅ Tedavi planı
- ✅ İlerleme notları
- ✅ Tanı bilgisi
- ✅ Müdahaleler (multiple)
- ✅ Ev ödevi
- ✅ Risk değerlendirmesi

### 3.2 Seans Durumları
- ✅ **DRAFT**: Taslak
- ✅ **COMPLETED**: Tamamlandı
- ✅ **REVIEWED**: İncelendi
- ✅ **ARCHIVED**: Arşivlendi

### 3.3 Seans Özellikleri
- ✅ Seans numarası takibi (1., 2., 3. seans)
- ✅ Gerçek başlangıç/bitiş zamanı
- ✅ Gerçek süre hesaplama
- ✅ Seans kaydı (video/audio) URL'i
- ✅ Transkript URL'i
- ✅ AI özet (opsiyonel)
- ✅ Dijital imza (terapist)
- ✅ İmza tarihi ve imzalayan kişi

### 3.4 Seans İlişkileri
- ✅ Randevu ile otomatik bağlantı
- ✅ Ödeme ile ilişkilendirme
- ✅ Terapist ve danışan bilgileri

---

## 💳 4. ÖDEME YÖNETİMİ (Payment & Billing)

### 4.1 Ödeme Türleri
- ✅ **CASH**: Nakit
- ✅ **CREDIT_CARD**: Kredi kartı
- ✅ **BANK_TRANSFER**: Banka transferi
- ✅ **ONLINE**: Online ödeme (iyzico/Stripe)
- ✅ **INSURANCE**: Sigorta

### 4.2 Ödeme Durumları
- ✅ **PENDING**: Beklemede
- ✅ **PAID**: Ödendi
- ✅ **PARTIALLY_PAID**: Kısmen ödendi
- ✅ **REFUNDED**: İade edildi
- ✅ **CANCELLED**: İptal edildi
- ✅ **FAILED**: Başarısız

### 4.3 Ödeme Özellikleri
- ✅ Seans ile otomatik bağlantı
- ✅ Tutar ve para birimi (TRY)
- ✅ Ödeme tarihi
- ✅ Ödenen tutar takibi
- ✅ Kalan tutar hesaplama
- ✅ İade işlemleri
- ✅ İade nedeni kaydı
- ✅ Fatura URL'i (PDF)
- ✅ Makbuz URL'i (PDF)

### 4.4 Entegrasyonlar
- ✅ **Stripe** entegrasyonu
- ✅ **iyzico** entegrasyonu
- ✅ Otomatik fatura oluşturma
- ✅ Makbuz oluşturma

---

## 🔔 5. BİLDİRİM SİSTEMİ (Notifications)

### 5.1 Bildirim Türleri
- ✅ **EMAIL**: E-posta
- ✅ **SMS**: SMS
- ✅ **WHATSAPP**: WhatsApp
- ✅ **PUSH**: Push notification (mobil)
- ✅ **IN_APP**: Uygulama içi bildirim

### 5.2 Bildirim Durumları
- ✅ **PENDING**: Beklemede
- ✅ **SENT**: Gönderildi
- ✅ **DELIVERED**: Teslim edildi
- ✅ **FAILED**: Başarısız
- ✅ **READ**: Okundu

### 5.3 Bildirim Senaryoları
- ✅ Randevu hatırlatması (24 saat önce, 1 saat önce)
- ✅ Randevu onayı
- ✅ Randevu iptali
- ✅ Ödeme hatırlatması
- ✅ Seans notu tamamlandı bildirimi
- ✅ Sistem bildirimleri

### 5.4 Bildirim Özellikleri
- ✅ Kullanıcı tercihlerine göre kanal seçimi
- ✅ Bildirim geçmişi
- ✅ Okunma takibi
- ✅ Hata loglama
- ✅ Yeniden gönderme

---

## 🔐 6. GÜVENLİK & UYUMLULUK (Security & Compliance)

### 6.1 Kimlik Doğrulama
- ✅ Keycloak SSO entegrasyonu
- ✅ JWT token yönetimi
- ✅ Refresh token desteği
- ✅ Multi-Factor Authentication (MFA)
- ✅ Session yönetimi
- ✅ Otomatik logout (idle timeout)

### 6.2 Yetkilendirme
- ✅ Role-Based Access Control (RBAC)
- ✅ Attribute-Based Access Control (ABAC)
- ✅ Endpoint-level yetkilendirme
- ✅ Resource-level yetkilendirme

### 6.3 Veri Güvenliği
- ✅ End-to-end encryption (hassas veriler)
- ✅ Field-level encryption (klinik notlar)
- ✅ Veritabanı şifreleme
- ✅ Backup şifreleme
- ✅ Audit logging (tüm erişimler loglanır)

### 6.4 KVKK/HIPAA Uyumluluğu
- ✅ Veri işleme onayları
- ✅ Veri silme talepleri
- ✅ Veri erişim talepleri
- ✅ Veri taşınabilirliği
- ✅ Veri saklama politikaları (7 yıl)
- ✅ Audit trail (tüm değişiklikler kayıt altında)

### 6.5 Audit Logging
- ✅ Tüm CRUD işlemleri loglanır
- ✅ Login/Logout kayıtları
- ✅ IP adresi ve user agent kaydı
- ✅ Değişiklik detayları (before/after)
- ✅ Zaman damgası
- ✅ Kullanıcı kimliği

---

## 📊 7. RAPORLAMA & ANALİTİK (Reporting & Analytics)

### 7.1 Terapist Raporları
- ✅ Aylık seans sayısı
- ✅ Gelir raporu
- ✅ Danışan sayısı
- ✅ Ortalama seans süresi
- ✅ İptal oranı
- ✅ No-show oranı
- ✅ En çok görüşülen danışanlar

### 7.2 Finansal Raporlar
- ✅ Günlük/haftalık/aylık gelir
- ✅ Ödeme yöntemleri dağılımı
- ✅ Bekleyen ödemeler
- ✅ İade raporları
- ✅ Vergi raporları

### 7.3 Danışan Raporları
- ✅ Seans geçmişi
- ✅ Ödeme geçmişi
- ✅ İlerleme raporu (opsiyonel)

### 7.4 Sistem Raporları
- ✅ Kullanıcı aktivitesi
- ✅ Sistem kullanım istatistikleri
- ✅ Hata logları
- ✅ Performans metrikleri

---

## 📁 8. DOSYA YÖNETİMİ (File Management)

### 8.1 Dosya Türleri
- ✅ **psikolog-avatars**: Profil fotoğrafları (public)
- ✅ **psikolog-documents**: Belgeler (private, şifreli)
  - Seans notları
  - Raporlar
  - Hasta belgeleri
  - KVKK formları
  - Test sonuçları
- ✅ **psikolog-attachments**: Genel dosyalar (private)
  - Faturalar
  - Makbuzlar
  - Email ekleri
- ✅ **psikolog-backups**: Yedekler (private, versioning)

### 8.2 Dosya Özellikleri
- ✅ Upload (drag & drop)
- ✅ Download (signed URL)
- ✅ Preview (görüntü, PDF)
- ✅ Versioning (belgeler ve yedekler için)
- ✅ Lifecycle policies (otomatik silme)
- ✅ CORS desteği (web upload için)

---

## 🌐 9. ÇOKLU PLATFORM (Multi-Platform)

### 9.1 Web Uygulaması (Next.js)
- ✅ Responsive tasarım
- ✅ Dark/Light mode
- ✅ PWA desteği
- ✅ Offline mode (sınırlı)
- ✅ Real-time bildirimler

### 9.2 Mobil Uygulama (React Native - Gelecek)
- ✅ iOS ve Android
- ✅ Push notifications
- ✅ Offline mode
- ✅ Biometric authentication
- ✅ Kamera entegrasyonu (belge çekme)

---

## 🔧 10. SİSTEM YÖNETİMİ (System Administration)

### 10.1 Sistem Ayarları
- ✅ Sistem konfigürasyonları (JSON)
- ✅ Genel ayarlar
- ✅ Email/SMS provider ayarları
- ✅ Ödeme gateway ayarları

### 10.2 Kullanıcı Yönetimi
- ✅ Kullanıcı oluşturma/düzenleme/silme
- ✅ Rol atama
- ✅ Durum yönetimi
- ✅ Toplu işlemler

---

## 🏢 11. ÇOKLU LOKASYON VE ODA YÖNETİMİ (Multi-Location & Room Resource)

### 11.1 Şube ve Lokasyon Mantığı
- ✅ Çoklu şube desteği (Kadıköy Şube, Nişantaşı Şube, vb.)
- ✅ Lokasyon bazlı çalışma saatleri
- ✅ Terapist bazlı lokasyon ataması
  - Örnek: Terapist A, Pazartesi Kadıköy'de, Salı Online, Çarşamba Nişantaşı'nda
- ✅ Randevu alınırken otomatik lokasyon algılama
- ✅ Lokasyon bazlı adres yönetimi

### 11.2 Oda (Resource) Rezervasyonu
- ✅ Oda tanımlama (Oyun Terapisi Odası, EMDR Odası, vb.)
- ✅ Oda tipi ve kapasitesi
- ✅ Çifte Çakışma Kontrolü (Double Conflict Check):
  - Terapist o saatte müsait mi?
  - Seçilen terapi türüne uygun oda o saatte müsait mi?
- ✅ Oda rezervasyon yönetimi
- ✅ Oda işgal takibi

---

## 👥 12. BAĞLI HESAPLAR (Linked Accounts / Family Management)

### 12.1 Ebeveyn - Çocuk İlişkisi
- ✅ Master Account (Veli): Ödeme yapar, randevu alır, fatura alır
- ✅ Sub-Profile (Çocuk): Tıbbi geçmiş, seans notları, tanılar bu profil altında
- ✅ Yaş kontrolü (18 yaş altı otomatik veli bağlantısı)
- ✅ Gizlilik Ayrımı:
  - Ebeveyn randevu saatini ve ödemeyi görür
  - "Gizli Not" işaretli seans içeriğini göremez (Ergen gizliliği)
- ✅ Veli onay sistemi

### 12.2 Çift Terapisi Yönetimi
- ✅ Primary Client (Birincil Danışan) ve Partner alanları
- ✅ İki kişinin dosyasında aynı seans gösterimi
- ✅ Tek seans notu, çift referans
- ✅ Her iki danışan için ayrı ödeme takibi (opsiyonel)

---

## ⏳ 13. BEKLEME LİSTESİ (Waitlist Management)

### 13.1 Akıllı Sıra Sistemi
- ✅ Dolu slot için "Bekleme Listesi" talebi
- ✅ Otomatik bildirim (randevu iptal edildiğinde)
- ✅ Manuel Mod: Terapiste "Yer açıldı, bekleyen X kişi var" bildirimi
- ✅ Otomatik Mod (First Come First Serve): Bekleyen herkese "İlk kapan alır" bildirimi
- ✅ Bekleme listesi öncelik sırası
- ✅ Bekleme listesi geçmişi

---

## 🏨 14. RESEPSİYON VE KARŞILAMA MODÜLÜ (Reception Desk)

### 14.1 Check-in (Giriş) Akışı
- ✅ "Bugünkü Randevular" listesi (asistan ekranı)
- ✅ "Geldi" (Arrived) butonu
- ✅ Terapiste anlık bildirim: "Danışanınız bekleme salonunda"
- ✅ Check-in zamanı kaydı
- ✅ Bekleme süresi takibi

### 14.2 Gecikme Yönetimi
- ✅ "Seansım X dk uzayacak" butonu
- ✅ Sıradaki danışana otomatik SMS/bildirim
- ✅ Asistana bilgilendirme
- ✅ Gecikme geçmişi

---

## 📝 15. ÖN DEĞERLENDİRME VE FORMLAR (Intake & Automated Forms)

### 15.1 Otomatik Form Gönderimi
- ✅ Randevu CONFIRMED olduğunda otomatik email/SMS
- ✅ Form türleri:
  - Genel Başvuru Formu
  - KVKK Onayı
  - Beck Depresyon Ölçeği
  - Özel formlar (yönetilebilir)
- ✅ Dijital imza desteği
- ✅ PDF olarak dosyaya ekleme
- ✅ "Form tamamlandı" terapiste bildirimi
- ✅ Form tamamlanma takibi

---

## 💳 16. PAKET VE FİZİKSEL ÖDEME YÖNETİMİ

### 16.1 Seans Paketleri (Bundles)
- ✅ "10 Seans alana %20 indirim" gibi kampanyalar
- ✅ Toplu ödeme ile "X Seans Kredisi" yükleme
- ✅ Her seans tamamlandığında "1 Seans Hakkı" düşülme
- ✅ Kalan hak takibi
- ✅ Bitmeye yakın uyarı sistemi
- ✅ Paket geçmişi

### 16.2 Fiziksel Kasa (Petty Cash)
- ✅ Sanal "Kasa Hesabı"
- ✅ Nakit tahsilat kaydı (Payment Method: CASH)
- ✅ Gün sonu "Z Raporu" benzeri rapor
- ✅ Kasa tutarlılık kontrolü
- ✅ Kasa geçmişi

---

## 🔄 17. ÇİFT YÖNLÜ TAKVİM ENTEGRASYONU (2-Way Sync)

### 17.1 Dışarıdan İçeriye Veri Akışı (External to System)
- ✅ Google Calendar API entegrasyonu
- ✅ Outlook Calendar entegrasyonu
- ✅ Terapistin kişisel takvimindeki "Busy" blokları otomatik "Bloke Zaman" olarak işaretleme
- ✅ Etkinlik adı "Meşgul" olarak görünür, detay gizlenir
- ✅ Çift yönlü senkronizasyon (opsiyonel)

---

## 🚨 18. ACİL DURUM VE GÜVENLİK (Safety & Privacy)

### 18.1 Panik Butonu (Quick Exit)
- ✅ Ekranın her zaman görünür yerinde buton (sağ alt/üst)
- ✅ Klavye kısayolu (ESC tuşuna iki kez basmak)
- ✅ Anında Google/haber sitesi/hava durumu sayfasına yönlendirme
- ✅ Tarayıcı geçmişinden son işlem silme
- ✅ Sessiz mod (bildirimler kapatılır)

### 18.2 Veri İhracı (Data Export)
- ✅ "Tüm Verilerimi İndir" butonu
- ✅ Arka planda Worker çalıştırma
- ✅ Tüm notlar, ödemeler, randevu geçmişi, dosyalar ZIP formatında
- ✅ PDF formatında okunabilir dökümler
- ✅ Güvenli email ile indirme linki
- ✅ KVKK uyumlu veri taşınabilirliği

---

## 🚀 19. GELECEKTEKİ ÖZELLİKLER (Future Features)

### 19.1 AI Desteği
- 🔜 Seans notu özetleme
- 🔜 Otomatik tanı önerileri
- 🔜 İlerleme analizi
- 🔜 Chatbot (danışan desteği)

### 19.2 Gelişmiş Özellikler
- 🔜 Video call entegrasyonu (Zoom, Google Meet)
- 🔜 Online ödeme gateway'leri (iyzico, Stripe)
- 🔜 SMS/WhatsApp gateway entegrasyonu
- 🔜 E-fatura entegrasyonu
- 🔜 E-imza entegrasyonu

### 19.3 Çoklu Kurum (Multi-Tenancy)
- 🔜 Kurum bazlı izolasyon
- 🔜 Kurum özel ayarlar
- 🔜 Kurum bazlı faturalama

---

## 📈 12. PERFORMANS & ÖLÇEKLENEBİLİRLİK

### 12.1 Performans
- ✅ Redis cache (hızlı erişim)
- ✅ Database indexing (optimize sorgular)
- ✅ Lazy loading
- ✅ Pagination (sayfalama)
- ✅ Image optimization

### 12.2 Ölçeklenebilirlik
- ✅ Horizontal scaling (çoklu instance)
- ✅ Load balancing
- ✅ Database replication
- ✅ CDN desteği (static assets)

---

## ✅ ÖZET: Sistem Tamamlandığında

### Kullanıcılar İçin:
- ✅ Kolay randevu alma/verme
- ✅ Güvenli seans notları
- ✅ Online ödeme
- ✅ Bildirimler (email, SMS, WhatsApp)
- ✅ Mobil erişim (gelecek)

### Terapistler İçin:
- ✅ Merkezi danışan yönetimi
- ✅ Detaylı seans notları
- ✅ Finansal takip
- ✅ Raporlama ve analitik
- ✅ KVKK uyumlu sistem

### Yöneticiler İçin:
- ✅ Sistem yönetimi
- ✅ Kullanıcı yönetimi
- ✅ Güvenlik ve uyumluluk
- ✅ Audit logging
- ✅ Performans izleme

---

**Son Güncelleme:** 19 Kasım 2025  
**Versiyon:** 1.0

