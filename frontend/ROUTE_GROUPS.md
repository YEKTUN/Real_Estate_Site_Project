# Route Groups Yapılandırması

## 📁 Proje Yapısı

```
src/app/
├── layout.tsx                 # Root Layout (Redux Provider)
├── globals.css               # Global stiller
│
├── (auth)/                   # Auth Route Group
│   ├── layout.tsx           # Auth Layout (minimal, merkezi)
│   ├── login/
│   │   └── page.tsx        # URL: /login
│   ├── register/
│   │   └── page.tsx        # URL: /register
│   └── forgot-password/
│       └── page.tsx        # URL: /forgot-password
│
└── (home)/                   # Home Route Group
    ├── layout.tsx           # Home Layout (navbar, footer)
    ├── page.tsx            # URL: / (Ana Sayfa)
    ├── properties/
    │   └── page.tsx        # URL: /properties
    ├── about/
    │   └── page.tsx        # URL: /about
    └── contact/
        └── page.tsx        # URL: /contact
```

## 🎯 Route Groups Nedir?

Route groups, Next.js'te **URL'yi etkilemeden** sayfaları gruplandırmanıza ve farklı layout'lar kullanmanıza olanak tanır.

### Özellikler:
- Parantez içindeki klasör adları `(auth)`, `(home)` URL'de görünmez
- Her route group'un kendi layout'u olabilir
- Organizasyon ve kod düzeni için mükemmel

## 📄 Layout Hiyerarşisi

```
Root Layout (layout.tsx)
├── Redux Provider
├── Font yapılandırması
├── HTML/Body tags
│
├─── Auth Layout ((auth)/layout.tsx)
│    ├── Minimal tasarım
│    ├── Merkezi form container
│    ├── Gradient arka plan
│    └── Logo + Footer
│
└─── Home Layout ((home)/layout.tsx)
     ├── Navbar (üst menü)
     ├── Main content area
     └── Footer (alt bilgi)
```

## 🔗 URL Yapısı

### Auth Sayfaları (Auth Layout)
- `/login` → `(auth)/login/page.tsx`
- `/register` → `(auth)/register/page.tsx`
- `/forgot-password` → `(auth)/forgot-password/page.tsx`

### Home Sayfaları (Home Layout)
- `/` → `(home)/page.tsx`
- `/properties` → `(home)/properties/page.tsx`
- `/about` → `(home)/about/page.tsx`
- `/contact` → `(home)/contact/page.tsx`

## 🎨 Layout Özellikleri

### Auth Layout
```typescript
// Minimal ve merkezi tasarım
- Navbar/Footer YOK
- Merkezi form container
- Gradient arka plan
- Logo ve branding
- Responsive tasarım
```

### Home Layout
```typescript
// Tam özellikli uygulama layout'u
- Sticky Navbar (üstte sabit)
- Navigation menü
- User actions (login, profile)
- Main content area
- Footer (şirket bilgileri, linkler)
- Responsive tasarım
```

## 🚀 Yeni Sayfa Ekleme

### Auth Sayfası Eklemek:
```bash
# 1. Klasör oluştur
mkdir -p src/app/(auth)/yeni-sayfa

# 2. page.tsx oluştur
touch src/app/(auth)/yeni-sayfa/page.tsx
```

URL: `/yeni-sayfa` (Auth Layout kullanır)

### Home Sayfası Eklemek:
```bash
# 1. Klasör oluştur
mkdir -p src/app/(home)/yeni-sayfa

# 2. page.tsx oluştur
touch src/app/(home)/yeni-sayfa/page.tsx
```

URL: `/yeni-sayfa` (Home Layout kullanır)

## 💡 Önemli Notlar

1. **Root Layout**: Tüm sayfalar için geçerli (Redux Provider burada)
2. **Route Group Layout**: Sadece o grup içindeki sayfalar için geçerli
3. **URL'de Görünmez**: `(auth)` ve `(home)` URL'de yer almaz
4. **Layout İçiçe Geçme**: Root Layout → Route Group Layout → Page
5. **Client Components**: Layout'larda 'use client' kullanabilirsiniz

## 🔧 Layout Değiştirme

Bir sayfayı farklı layout'a taşımak için:

```bash
# Auth'tan Home'a taşıma
mv src/app/(auth)/sayfa src/app/(home)/sayfa

# Home'dan Auth'a taşıma
mv src/app/(home)/sayfa src/app/(auth)/sayfa
```

## 📝 Örnek Kullanım

### Auth Sayfası Örneği:
```typescript
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <div>
      {/* Auth Layout otomatik uygulanır */}
      <h1>Giriş Yap</h1>
      {/* Form içeriği */}
    </div>
  );
}
```

### Home Sayfası Örneği:
```typescript
// src/app/(home)/properties/page.tsx
export default function PropertiesPage() {
  return (
    <div>
      {/* Home Layout otomatik uygulanır (Navbar + Footer) */}
      <h1>İlanlar</h1>
      {/* İlan listesi */}
    </div>
  );
}
```

## 🎯 Avantajlar

✅ **Temiz Kod Organizasyonu**: İlgili sayfalar gruplandırılmış
✅ **Farklı Layout'lar**: Her grup için özel tasarım
✅ **URL Temizliği**: Parantezler URL'de görünmez
✅ **Kolay Yönetim**: Sayfa ekleme/çıkarma kolay
✅ **Type Safety**: TypeScript ile tam destek
✅ **SEO Dostu**: Her sayfa için ayrı metadata

## 🔍 Test Etme

Tarayıcıda test et:
- http://localhost:3000/ (Home Layout)
- http://localhost:3000/login (Auth Layout)
- http://localhost:3000/register (Auth Layout)
- http://localhost:3000/properties (Home Layout)

Her sayfanın farklı layout kullandığını göreceksin!

