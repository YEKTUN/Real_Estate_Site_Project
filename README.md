# Real Estate Site Project 🏠

Modern, hızlı ve kullanıcı dostu bir emlak platformu. Bu proje, hem kullanıcıların ilanlarını yönetebileceği gelişmiş bir kullanıcı paneli hem de platform yöneticilerinin ilanları denetleyebileceği yapay zeka destekli bir admin paneli sunar.

## 🚀 Teknolojiler

### Frontend
- **Framework:** Next.js 14 (App Router)
- **State Management:** Redux Toolkit
- **Styling:** Vanilla CSS & Tailwind CSS (UI Components)
- **Testing:** Jest & React Testing Library
- **Icons:** Lucid React & Emojis

### Backend
- **Framework:** .NET 8 Web API
- **ORM:** Entity Framework Core
- **Database:** SQL Server / PostgreSQL
- **Image Hosting:** Cloudinary
- **Authentication:** JWT (JSON Web Token) & Google Auth

---

## 🛠️ Proje Yapısı

```
Real_Estate_Site_Project/
├── frontend/                # Next.js Uygulaması
│   ├── src/app/             # Sayfa yönlendirmeleri
│   ├── src/body/            # Bileşenler ve iş mantığı
│   ├── src/body/redux/      # Store, Slices ve API servisleri
│   └── __tests__/           # Birim ve entegrasyon testleri
└── RealEstateAPI/           # .NET Web API Uygulaması
    ├── Controllers/         # API uç noktaları
    ├── Models/              # Veritabanı modelleri
    ├── Services/            # İş mantığı servisleri
    └── Repositories/        # Veri erişim katmanı
```

---

## ✨ Temel Özellikler

### 1. Admin Paneli (Yeni!) 🛡️
- **İlan Denetimi:** Bekleyen (Pending), onaylanan ve reddedilen ilanların yönetimi.
- **Otomatik Onay Sistemi:** Belirlenen kurallara (fiyat aralığı, kelime filtreleri vb.) göre ilanların otomatik olarak onaylanması veya incelemeye alınması.
- **Dinamik Kurallar:** Yönetici tarafından anlık olarak güncellenebilen denetim kuralları.

### 2. Kullanıcı Paneli 👤
- **İlan Yönetimi:** İlan oluşturma, düzenleme ve "Pasif" konuma getirme özellikleri.
- **Favoriler:** İlanları favorilere ekleme ve özel notlar alma.
- **Mesajlaşma:** İlan sahipleriyle anlık iletişim.

### 3. Arama ve Filtreleme 🔍
- Gelişmiş filtreleme seçenekleri (Fiyat, konum, oda sayısı, ısıtma tipi vb.).
- Kompakt tasarım ve hızlı arama sonuçları.

---

## �️ Veritabanı Mimarisi

Sistem, ilişkisel bir veritabanı yapısı üzerine kuruludur ve kompleks veriler arasındaki bütünlüğü korumak için SQL ilişkilerini (Foreign Keys) kullanır.

### Ana Tablolar ve Görevleri

| Tablo Adı | Açıklama |
| :--- | :--- |
| **ApplicationUser** | Kimlik doğrulama, kullanıcı profili, iletişim bilgileri ve sistem rollerini (Admin/Kullanıcı) tutar. |
| **Listing** | Sistemin kalbidir. Başlık, fiyat, konum (İl/İlçe/Mahalle), teknik özellikler (m², oda sayısı, bina yaşı vb.) ve ilan durumunu tutar. |
| **ListingImage** | İlanlara ait Cloudinary URL'lerini ve görüntüleme sıralarını tutar. |
| **ListingComment** | İlanlar altına yapılan kullanıcı yorumlarını ve puanlamaları yönetir. |
| **FavoriteListing** | Kullanıcıların favoriye eklediği ilanları ve bu ilanlar için aldıkları özel notları saklar. |
| **ListingMessageThread** | İki kullanıcı arasındaki bir ilana özel başlatılan sohbet oturumunu temsil eder. |
| **ListingMessage** | Sohbet oturumu içindeki tekil mesajları (içerik, zaman damgası, okunma durumu) tutar. |
| **AdminModerationRule** | Otomatik onay mekanizması için gereken filtreleri (kelime bazlı red, fiyat sınırı vb.) saklar. |

### İlişkisel Yapı (Entity Relationships)

- **1-N (Bire-Çok):** Bir `ApplicationUser` birden fazla `Listing` (İlan) sahibi olabilir. Aynı şekilde her `Listing`, birden fazla `ListingImage` ve `ListingComment` içerebilir.
- **M-N (Çoktan-Çoğa):** `FavoriteListing` tablosu, Kullanıcılar ve İlanlar arasında köprü kurarak hangi kullanıcının hangi ilanları favorilediğini yönetir.
- **Sohbet Mimarisi:** `ListingMessageThread`, hem ilgili `Listing` tablosuna hem de Alıcı/Satıcı olan iki farklı `ApplicationUser` kaydına bağlıdır. Mesajlar bu thread üzerinden takip edilir.
- **Denetim Akışı:** Yeni bir ilan oluşturulduğunda `AdminModerationRule` tablosundaki aktif kurallar taranır ve ilanın durumu `Pending`, `Active` veya `Rejected` olarak otomatik güncellenir.

---

## �📦 Kurulum ve Çalıştırma

### Backend
1. `RealEstateAPI/appsettings.json` dosyasındaki veritabanı bağlantı bilgilerini ve Cloudinary API anahtarlarını yapılandırın.
2. Bağımlılıkları yükleyin:
   ```bash
   dotnet restore
   ```
3. Veritabanı migration'larını uygulayın:
   ```bash
   dotnet ef database update
   ```
4. Uygulamayı başlatın:
   ```bash
   dotnet run
   ```

### Frontend
1. `frontend/` dizinine gidin.
2. `.env` dosyasını oluşturun ve `NEXT_PUBLIC_API_URL` adresini tanımlayın.
3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

---

## 🧪 Testler

Proje yüksek test kapsamına sahiptir:
- **Frontend:** `npm test` komutu ile tüm UI ve Redux testlerini koşturabilirsiniz.
- **Backend:** `dotnet test` komutu ile servis ve repository testlerini çalıştırabilirsiniz.

---

## 📝 Son Güncellemeler (Özet)
- Admin paneli tasarımı tamamen yenilendi ve "Otomatik Onay" iş akışı entegre edildi.
- İlan kartları daha modern ve kompakt bir yapıya kavuşturuldu.
- Frontend test suite'i güncellendi; Redux slice'ları ve API servisleri için kapsamlı testler eklendi.
- İlan detay sayfasındaki UX hataları giderildi ve mobil uyumluluk artırıldı.

---
📧 **İletişim:** Proje hakkında sorularınız için ekip üyeleriyle iletişime geçebilirsiniz.
