# 🛠️ Geliştirici Rehberi & Teknik Dokümantasyon

Bu dosya, projenin iç mimarisi, teknik kararlar, veritabanı şeması ve geliştirme iş akışları hakkında kapsamlı bilgi sağlar.

---

## 🏗️ Mimari Yapı

Proje, modern yazılım prensiplerine uygun olarak **N-Tier (N-Katmanlı)** ve **Repository Pattern** kullanılarak inşa edilmiştir.

### 🧩 Backend (RealEstateAPI)
- **Controllers:** RESTful API uç noktaları. İstekleri karşılar, DTO dönüşümlerini yönetir.
- **Services:** İş mantığının (Business Logic) ana merkezi. Validasyonlar, hesaplamalar ve servisler arası koordinasyon burada yapılır.
- **Repositories:** Veritabanı soyutlama katmanı. Veri erişim mantığını servislerden ayırır.
- **Models & Entity Framework:** PostgreSQL tabanlı ilişkisel veritabanı yönetimi.
- **DTOs:** Veri transfer nesneleri. API güvenliği için modelleri dış dünyaya kapatır.
- **Middleware:** Global hata yönetimi, loglama ve yetkilendirme kontrolleri.

### 🎨 Frontend (Next.js Application)
- **App Router:** Dosya tabanlı modern yönlendirme sistemi.
- **Redux Toolkit:** Merkezi durum yönetimi. API çağrıları için merkezi bir `axiosInstance` kullanır.
- **Interceptors:** JWT token'ların otomatik eklenmesi ve 401/403 hatalarının merkezi yönetimi.
- **Atomic Components:** Tekrar kullanılabilir UI bileşenleri.
- **Cloudinary SDK:** Görsellerin istemci tarafında veya sunucu tarafında işlenmesi.

---

## 📊 Veritabanı Şeması & İlişkiler

Sistem, **Entity Framework Core** kullanılarak yönetilen PostgreSQL üzerinde çalışır.

### 1️⃣ Kullanıcı & Güvenlik
- **AspNetUsers:** Identity sistemi ile entegre. `PhoneVerified`, `IsAdmin`, `Status` gibi ek alanlar içerir.
- **UserSettings:** Kullanıcı bazlı gizlilik ayarları (E-posta/Telefon görünürlüğü).
- **RefreshTokens:** Uzun süreli oturum yönetimi için.

### 2️⃣ İlan & Detaylar
- **Listing:** Ana ilan verileri.
- **ListingFeatures:** Teknik detaylar (Isınma tipi, yapı durumu, kullanım durumu vb.).
- **ListingImage:** Cloudinary üzerinde saklanan görsellerin meta verileri.
- **ListingComment:** İlan altına yapılan kullanıcı geri bildirimleri.
- **FavoriteListing:** Hangi kullanıcının hangi ilanı, hangi özel notla takip ettiği bilgisi.

### 3️⃣ Sohbet & Mesajlaşma
- **ListingMessageThread:** Alıcı, satıcı ve ilan arasındaki bağı kuran mesaj odası.
- **ListingMessage:** Odadaki tekil mesajlar ve okunma durumları.

---

## ⚙️ Özel Sistemler ve Mantıklar

### 🛡️ Akıllı Moderasyon Sistemi
Yeni eklenen ilanlar otomatik olarak denetimden geçer:
- **Rule Engine:** `AdminModerationRule` tablosundaki aktif kurallar (Max Fiyat, Yasaklı Kelimeler vb.) taranır.
- **Status Workflow:** Kurallara uymayan ilanlar `Pending` (Beklemede) veya `Rejected` durumuna alınır.

### � Telefon Doğrulama (SMS Simulation)
- **Mode:** Geliştirme aşamasında "Simulation" modunda çalışır.
- **Flow:** Kod backend'de üretilir, veritabanına kaydedilir ve frontend'e (dev modunda) döner.
- **Constraint:** `PhoneVerified` olmayan kullanıcılar ilan oluşturamaz.

### 🔒 Gizlilik Algoritması
Backend'de `AuthService` içindeki `MapToUserDto` metodu `ignorePrivacy` parametresi alır:
- Kullanıcı kendi verisine bakıyorsa: Tüm bilgiler açık.
- Başkası bakıyorsa: `UserSettings` kontrol edilir, gizli ise `null` döner.

---

## 🚀 Environment & Kurulum Detayları

### Backend (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Database=...;"
  },
  "Jwt": {
    "Key": "GizliKey",
    "Issuer": "RealEstateAPI"
  },
  "Cloudinary": {
    "CloudName": "...",
    "ApiKey": "...",
    "ApiSecret": "..."
  }
}
```

---

## 🧪 Test ve Debugging

- **xUnit:** Backend servisleri için birim testleri.
- **Next.js DevTools:** State takibi için Redux DevTools.
- **API Docs:** Swagger üzerinden tüm uç noktaların dökümantasyonu (`/swagger`).

---

## 📝 Son Notlar
Proje, hem dikey (`Vertical Slice`) hem de yatay (`Layered`) genişlemeye uygun şekilde modüler yapıda tasarlanmıştır. Yeni bir özellik eklerken mevcut Repository ve Service desenlerini takip etmeniz önerilir.
