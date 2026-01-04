# Real Estate Site Project 🏠✨

Modern, ultra hızlı ve premium tasarımlı yeni nesil emlak platformu. Bu proje, hem kullanıcıların ilanlarını profesyonelce yönetebileceği gelişmiş bir kullanıcı paneli, hem de yapay zeka destekli akıllı bir moderasyon sistemi içeren admin paneli sunar.

---

## 🌟 Öne Çıkan Özellikler

### 💎 Premium Kullanıcı Deneyimi
- **Modern UI/UX:** En son tasarım trendlerine uygun, cam efektli (glassmorphism), dinamik geçişli ve kullanıcıyı yormayan arayüz.
- **Kişiselleştirilmiş Profil:** Kullanıcıların kendi ilanlarını, favorilerini ve mesajlarını yönetebileceği şık profil sayfaları.
- **Gelişmiş Gizlilik (🔒):** Telefon ve e-posta bilgilerini kimlerin görebileceğini kontrol eden hassas gizlilik ayarları ve dinamik veri maskeleme.
- **Güvenli Oturum:** JWT tabanlı güvenli giriş ve Google OAuth ile hızlı kayıt imkanı.

### 🛡️ Akıllı Admin Denetimi & Moderasyon
- **Otomatik Onay Sistemi:** Belirlenen kurallar (fiyat sınırları, yasaklı kelimeler, kategori bazlı limitler) ile ilanların anlık denetimi.
- **Dinamik Kural Yönetimi:** Adminlerin kod yazmadan sistem kurallarını değiştirebileceği yönetim arayüzü.
- **İlan & Kullanıcı Kontrolü:** Tüm ilanların yaşam döngüsünü (Beklemede, Aktif, Pasif, Reddedildi) yönetme yetkisi.

### 🔍 Güçlü Arama & Mesajlaşma
- **İlan Bazlı Mesajlaşma:** Alıcı ve satıcı arasında ilana özel oluşturulan sohbet odaları (Threads).
- **Detaylı Filtreleme:** Oda sayısı, m², bina yaşı, ısınma tipi, kullanım durumu gibi onlarca kriterde akıllı arama.
- **Favoriler & Notlar:** İlanları favorilere eklerken sadece sizin görebileceğiniz özel notlar alabilme özelliği.
- **Görsel Galeri:** Cloudinary altyapısı ile yüksek performanslı, optimize edilmiş ilan görselleri.

### 📱 Güvenlik & Doğrulama
- **Telefon Doğrulama:** İlan oluşturmadan önce zorunlu kılınan SMS doğrulama sistemi (Simülasyon modunda).

---

## 🚀 Teknolojik Altyapı

### **Frontend (Modern Stack)**
- **Next.js 14/15+:** App Router ile SEO dostu ve hızlı sayfa geçişleri.
- **Redux Toolkit:** Merkezi durum yönetimi ve stabil veri akışı.
- **Tailwind CSS:** Modern ve responsive (mobil uyumlu) tasarım.
- **Axios & Interceptors:** Gelişmiş API iletişimi ve otomatik token yönetimi.

### **Backend (Robust & Scalable)**
- **.NET 8 Web API:** Yüksek performanslı ve ölçeklenebilir backend mimarisi.
- **Entity Framework Core:** LINQ tabanlı veritabanı sorgulama ve PostgreSQL desteği.
- **Identity Framework:** Güvenli kullanıcı yönetimi ve rol tabanlı yetkilendirme (RBAC).
- **Cloudinary:** Akıllı görsel saklama ve optimizasyon servisi.

---

## 🛠️ Proje Klasör Yapısı

```
Real_Estate_Site_Project/
├── frontend/                # Next.js Uygulaması
│   ├── src/app/             # Sayfa yönlendirmeleri (App Router)
│   ├── src/body/            # UI Bileşenleri & Sayfa İçerikleri
│   ├── src/body/redux/      # API Servisleri & Durum Yönetimi
│   └── src/lib/             # Yardımcı kütüphaneler (Cloudinary, Axios)
├── RealEstateAPI/           # .NET Web API
│   ├── Controllers/         # API Uç Noktaları
│   ├── Services/            # İş Mantığı (Logic)
│   ├── Models/              # Database Şeması (Entities)
│   ├── Repositories/        # Veri Erişim Katmanı (Patterns)
│   └── DTOs/                # Veri Transfer Nesneleri
└── README_DEV.md            # Detaylı Teknik Geliştirici Rehberi
```

---

## 📦 Hızlı Kurulum

1. **Database:** `docker-compose up -d` ile PostgreSQL'i başlatın.
2. **Backend:** `RealEstateAPI` klasöründe `dotnet run` ile servisi başlatın.
3. **Frontend:** `frontend` klasöründe `npm run dev` ile arayüzü başlatın.

---

## 📅 Versiyon Geçmişi & Güncellemeler
- **v2.0:** Premium UI tasarımı, Otomatik Moderasyon sistemi ve Telefon Doğrulama entegrasyonu tamamlandı.
- **v1.5:** Favori ilanlara not ekleme ve mesajlaşma thread'leri eklendi.
- **v1.0:** Dasar CRUD işlemleri, Üyelik sistemi ve Cloudinary entegrasyonu.

---
📧 **İletişim:** Sorularınız ve destek için ekip üyeleriyle iletişime geçebilirsiniz. 🚀✨
