# Ödemeler Sistemi - Kurgu ve Düzeltmeler

## Mevcut Durum Analizi

### ✅ Çalışan Özellikler
1. **Ödeme Listeleme**: Ödemeler listeleniyor, filtreleme çalışıyor
2. **Ödeme Detayları**: Detay dialog'u var ve çalışıyor
3. **Stats Gösterimi**: Stats kartları gösteriliyor (ama hesaplama doğru mu kontrol edilmeli)

### ❌ Eksik/Çalışmayan Özellikler

1. **Yeni Ödeme Oluşturma**
   - Frontend'de "Yeni Ödeme Oluştur" butonu yok
   - `CreatePaymentData` interface'i backend ile uyumsuz:
     - Frontend: `clientId` gönderiyor
     - Backend: `userId` bekliyor
   - Seans bazlı veya manuel ödeme oluşturma dialog'u yok

2. **Ödeme İşleme (Process Payment)**
   - Dialog var ama çalışıyor mu kontrol edilmeli
   - Kısmi ödeme desteği var mı kontrol edilmeli
   - `paidAmount` ve `remainingAmount` hesaplamaları doğru mu?

3. **İade (Refund)**
   - Dialog var ama çalışıyor mu kontrol edilmeli
   - İade sonrası ödeme durumu güncelleniyor mu?

4. **Stats Hesaplama**
   - `totalRevenue` hesaplaması doğru mu?
   - `pendingAmount` hesaplaması doğru mu?
   - `paidCount` ve `pendingCount` hesaplamaları doğru mu?

5. **Backend-Frontend Uyumsuzlukları**
   - `Payment` interface'inde eksik alanlar olabilir
   - `CreatePaymentData` interface'i backend ile uyumsuz

## Yapılacaklar

### 1. Yeni Ödeme Oluşturma Dialog'u
- [ ] "Yeni Ödeme Oluştur" butonu ekle
- [ ] Dialog oluştur:
  - Kullanıcı seçimi (CLIENT rolündeki kullanıcılar)
  - Seans seçimi (opsiyonel)
  - Tutar girişi
  - Ödeme yöntemi seçimi (opsiyonel, default: CASH)
  - Notlar (opsiyonel)
- [ ] Backend API'ye doğru format ile gönder
- [ ] Başarılı oluşturma sonrası listeyi yenile

### 2. CreatePaymentData Interface Düzeltmesi
- [ ] `clientId` yerine `userId` kullan
- [ ] Backend'in beklediği format ile uyumlu hale getir:
  ```typescript
  {
    userId: string;
    sessionId?: string;
    amount: number;
    currency?: string; // default: 'TRY'
    method?: PaymentMethod; // default: 'CASH'
    notes?: string;
  }
  ```

### 3. Ödeme İşleme (Process Payment) Kontrolü
- [ ] Dialog'un çalıştığını kontrol et
- [ ] Kısmi ödeme desteğini kontrol et
- [ ] `paidAmount` ve `remainingAmount` hesaplamalarını kontrol et
- [ ] Ödeme durumunun doğru güncellendiğini kontrol et (PENDING → PAID veya PARTIALLY_PAID)

### 4. İade (Refund) Kontrolü
- [ ] Dialog'un çalıştığını kontrol et
- [ ] İade sonrası ödeme durumunun REFUNDED olduğunu kontrol et
- [ ] `refundAmount` ve `refundReason` kaydedildiğini kontrol et

### 5. Stats Hesaplama Düzeltmesi
- [ ] Backend'den gelen stats formatını kontrol et
- [ ] Frontend'de doğru alanları kullan
- [ ] `totalRevenue`, `pendingAmount`, `paidCount`, `pendingCount` hesaplamalarını düzelt

### 6. Payment Interface Genişletilmesi
- [ ] Backend'den gelen tüm alanları ekle
- [ ] `user`, `session` relation'larını kontrol et

## Backend API Endpoints

### GET /payments
- Query params: `page`, `limit`, `status`, `userId`
- Response: `PaginatedResponse<Payment>`

### GET /payments/:id
- Response: `ApiResponse<Payment>`

### POST /payments
- Body: `{ userId, sessionId?, amount, currency?, method?, notes? }`
- Response: `ApiResponse<Payment>`

### POST /payments/:id/process
- Body: `{ method: PaymentMethod, paidAmount: number }`
- Response: `ApiResponse<Payment>`

### POST /payments/:id/refund
- Body: `{ refundAmount: number, refundReason: string }`
- Response: `ApiResponse<Payment>`

### GET /payments/stats
- Query params: `startDate`, `endDate`, `userId`
- Response: `ApiResponse<{ totalRevenue, paidAmount, pendingAmount, refundedAmount, transactionCount }>`

### GET /payments/pending
- Query params: `userId?`
- Response: `ApiResponse<Payment[]>`

## Ödeme Durumları (PaymentStatus)

- `PENDING`: Bekliyor (varsayılan)
- `PAID`: Ödendi
- `PARTIALLY_PAID`: Kısmi Ödendi
- `REFUNDED`: İade Edildi
- `CANCELLED`: İptal Edildi
- `FAILED`: Başarısız

## Ödeme Yöntemleri (PaymentMethod)

- `CASH`: Nakit
- `CREDIT_CARD`: Kredi Kartı
- `BANK_TRANSFER`: Havale/EFT
- `ONLINE`: Online
- `INSURANCE`: Sigorta

## İş Akışı

### Yeni Ödeme Oluşturma
1. Kullanıcı "Yeni Ödeme Oluştur" butonuna tıklar
2. Dialog açılır
3. Kullanıcı bilgileri girilir (kullanıcı seçimi, tutar, yöntem, notlar)
4. Seans seçimi yapılabilir (opsiyonel)
5. "Oluştur" butonuna tıklanır
6. Backend'e POST /payments isteği gönderilir
7. Başarılı olursa liste yenilenir

### Ödeme İşleme
1. PENDING durumundaki bir ödeme için "Ödeme Al" seçilir
2. Dialog açılır
3. Alınacak tutar ve ödeme yöntemi seçilir
4. "Ödeme Al" butonuna tıklanır
5. Backend'e POST /payments/:id/process isteği gönderilir
6. Başarılı olursa:
   - Eğer `paidAmount === amount` → Durum `PAID` olur
   - Eğer `paidAmount < amount` → Durum `PARTIALLY_PAID` olur, `remainingAmount` hesaplanır
7. Liste yenilenir

### İade
1. PAID veya PARTIALLY_PAID durumundaki bir ödeme için "İade Et" seçilir
2. Dialog açılır
3. İade tutarı ve sebep girilir
4. "İade Et" butonuna tıklanır
5. Backend'e POST /payments/:id/refund isteği gönderilir
6. Başarılı olursa durum `REFUNDED` olur
7. Liste yenilenir

## Notlar

- Ödemeler seans bazlı veya manuel olabilir
- Seans bazlı ödemelerde `sessionId` set edilir
- Manuel ödemelerde `sessionId` null olur
- Kısmi ödeme yapılabilir (PARTIALLY_PAID)
- İade sadece ödenmiş ödemeler için yapılabilir
- Stats hesaplamaları tarih aralığına göre yapılır (default: son 30 gün)

