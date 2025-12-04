feat(payments): İyileştirmeler ve düzeltmeler

✨ Yeni Özellikler:
- Bekleyen ödemeler için tutar düzenleme özelliği eklendi
- İade sonrası kalan tutar tekrar işlenebilir hale getirildi
- Ödeme detaylarında kısmen ödenen ve iade edilen ödemeler için detaylı bilgi gösterimi

🐛 Düzeltmeler:
- İade yapıldıktan sonra kalan tutar hesaplaması düzeltildi
- İade sonrası ödeme işleme kontrolü iyileştirildi
- Ödeme istatistikleri (toplam gelir, bekleyen ödemeler) hesaplama mantığı düzeltildi
- ProcessPaymentDialog'da iade sonrası maxAmount hesaplaması düzeltildi
- Backend'de refundPayment metodunda status mantığı iyileştirildi (PENDING/PARTIALLY_PAID)

📚 Dokümantasyon:
- TEKNIK_DOKUMANTASYON.md'de Payments Modülü bölümü genişletildi
- Ödeme durumları, işlemleri ve API metodları detaylandırıldı
- Sorun çözme rehberine ödeme ile ilgili sorunlar eklendi
- README.md'de Payments & Billing özellikleri güncellendi

🔧 Teknik Detaylar:
- Frontend: ProcessPaymentDialog'da iade sonrası kalan tutar kontrolü eklendi
- Frontend: Dropdown menüde iade sonrası "Tekrar Ödeme Al" butonu gösterimi düzeltildi
- Backend: refundPayment metodunda remainingAmount hesaplaması iyileştirildi
- Backend: processPayment metodunda REFUNDED kontrolü kaldırıldı (artık PENDING/PARTIALLY_PAID kullanılıyor)

📝 Değişen Dosyalar:
- apps/web/src/app/(dashboard)/dashboard/payments/page.tsx
- apps/api/src/infrastructure/database/repositories/payment.repository.impl.ts
- apps/api/src/presentation/payments/payments.service.ts
- apps/web/src/lib/api.ts
- TEKNIK_DOKUMANTASYON.md
- README.md
