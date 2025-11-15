# Katkıda Bulunma Rehberi

## Başlamadan Önce

Bu projeye katkıda bulunmak için:

1. Projeyi fork edin
2. Local bilgisayarınıza klonlayın
3. Bağımlılıkları yükleyin: `pnpm install`
4. Development branch'inden yeni bir feature branch oluşturun

## Geliştirme Süreci

### 1. Branch Oluşturma

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

Branch isimlendirme:
- `feature/` - Yeni özellikler için
- `fix/` - Bug düzeltmeleri için
- `refactor/` - Kod iyileştirmeleri için
- `docs/` - Dokümantasyon güncellemeleri için

### 2. Kod Yazımı

- TypeScript kullanın
- ESLint ve Prettier kurallarına uyun
- Anlamlı değişken ve fonksiyon isimleri kullanın
- Kod yorumları Türkçe veya İngilizce olabilir
- Unit testler yazın

### 3. Commit Mesajları

Conventional Commits formatını kullanın:

```
feat: yeni randevu bildirimi eklendi
fix: tarih seçici bug'ı düzeltildi
refactor: auth servisi iyileştirildi
docs: API dokümantasyonu güncellendi
test: appointment servis testleri eklendi
```

### 4. Test

```bash
# Tüm testleri çalıştır
pnpm test

# Belirli bir paketi test et
pnpm --filter @psikolog/api test

# E2E testler
pnpm test:e2e
```

### 5. Pull Request

1. Branch'inizi push edin
2. GitHub'da Pull Request açın
3. PR açıklamasını detaylı yazın
4. Değişikliklerin ekran görüntülerini ekleyin (UI değişiklikleri için)
5. Review bekleyin

## Kod Standartları

### TypeScript

- `any` kullanımından kaçının
- Interface'leri doğru kullanın
- Type safety'yi koruyun
- Null checks yapın

### React/Next.js

- Functional components kullanın
- Custom hooks oluşturun
- Prop types tanımlayın
- Accessibility (a11y) kurallarına uyun

### NestJS

- Modüler yapıyı koruyun
- DTO'ları doğru kullanın
- Dependency Injection'ı uygulayın
- Exception handling yapın

### Database

- Migration oluştururken dikkatli olun
- Index'leri unutmayın
- Seed data ekleyin
- Foreign key'leri doğru tanımlayın

## Code Review Süreci

Tüm PR'lar en az bir kişi tarafından review edilmelidir:

- [ ] Kod standartlarına uygun
- [ ] Testler geçiyor
- [ ] Dokümantasyon güncel
- [ ] Breaking change yok
- [ ] Performance etkileri değerlendirildi

## Sorular

Sorularınız için:
- GitHub Issues
- Pull Request yorumları
- Proje maintainer'larına ulaşın

Katkılarınız için teşekkürler! 🙏

