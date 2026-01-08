# 🧪 Test Dokümantasyonu

Bu dokümantasyon, Real Estate Site Project'in test yapısını ve sonuçlarını içermektedir.

## 📊 Test Özeti

### Backend Tests (C# / .NET)
- **Toplam Test Sayısı**: 273
- **Başarılı**: 273 ✅
- **Başarısız**: 0
- **Başarı Oranı**: %100
- **Test Süresi**: ~6 saniye

### Frontend Tests (TypeScript / Jest)
- **Toplam Test Dosyası**: 38
- **Test Framework**: Jest + React Testing Library
- **Çalışan Testler**: Tümü başarılı ✅

---

## 🗂️ Backend Test Yapısı

### Test Kategorileri

#### 1. **Controller Tests** (9 dosya)
API endpoint'lerinin doğru çalıştığını test eder.

```
Tests/Unit/Controllers/
├── AdminUserControllerTests.cs
├── AuthControllerTests.cs
├── CommentControllerTests.cs
├── FavoriteControllerTests.cs
├── HealthControllerTests.cs
├── ListingControllerTests.cs
├── MessageControllerTests.cs
├── PhoneVerificationControllerTests.cs
└── UserSettingsControllerTests.cs
```

#### 2. **Repository Tests** (3 dosya)
Veritabanı işlemlerini test eder.

```
Tests/Unit/Repositories/
├── AuthRepositoryTests.cs
├── CommentRepositoryTests.cs
└── FavoriteRepositoryTests.cs
```

#### 3. **Service Tests** (5 dosya)
İş mantığı katmanını test eder.

```
Tests/Unit/Services/
├── AuthServiceTests.cs
├── CommentServiceTests.cs
├── EmailServiceTests.cs
├── FavoriteServiceTests.cs
└── MessageServiceTests.cs
```

#### 4. **DTO Validation Tests** (1 dosya)
Veri transfer objelerinin doğrulamasını test eder.

```
Tests/Unit/
└── DTOValidationTests.cs
```

### Backend Test Komutları

```bash
# Tüm testleri çalıştır
cd RealEstateAPI
dotnet test

# Detaylı çıktı ile çalıştır
dotnet test --verbosity normal

# Sonuçları dosyaya kaydet
dotnet test --verbosity normal 2>&1 | tee backend-test-results.txt
```

---

## 🗂️ Frontend Test Yapısı

### Test Kategorileri

#### 1. **Unit Tests - Redux Slices** (7 dosya)
State yönetimi testleri.

```
__tests__/unit/redux/
├── authSlice.test.ts
├── cloudinarySlice.test.ts
├── commentSlice.test.ts
├── favoriteSlice.test.ts
├── listingSlice.test.ts
├── messageSlice.test.ts
└── AdminListingSlice.test.ts (redux/slices/admin/)
```

#### 2. **Unit Tests - API** (7 dosya)
API çağrılarını test eder.

```
__tests__/unit/api/
├── authApi.test.ts
├── cloudinaryApi.test.ts
├── commentApi.test.ts
├── favoriteApi.test.ts
├── listingApi.test.ts
├── messageApi.test.ts
└── phoneVerificationApi.test.ts
```

#### 3. **Unit Tests - Utils** (1 dosya)
Yardımcı fonksiyonları test eder.

```
__tests__/unit/utils/
└── formatPrice.test.ts
```

#### 4. **Component Tests** (22 dosya)
React bileşenlerini test eder.

```
__tests__/components/
├── admin/
│   └── AdminPanel.test.tsx
├── auth/
│   ├── LoginPage.test.tsx
│   └── RegisterPage.test.tsx
├── forget-password/
│   ├── ForgetPasswordPage.test.tsx
│   └── ResetPasswordPage.test.tsx
├── listing/
│   ├── EmptyState.test.tsx
│   ├── ListingDetailPage.test.tsx
│   ├── Listings.test.tsx
│   ├── LoadingState.test.tsx
│   └── Pagination.test.tsx
├── panel/
│   ├── createListing/
│   │   └── CreateListing.test.tsx
│   ├── settings/
│   │   └── Settings.test.tsx
│   ├── updateListingModal/
│   │   └── UpdateListingModal.test.tsx
│   ├── FavoriteListings.test.tsx
│   ├── MyListings.test.tsx
│   └── UserAvatar.test.tsx
├── profile/
│   └── UserProfilePage.test.tsx
├── AuthGuard.test.tsx
├── Footer.test.tsx
├── GoogleLoginButton.test.tsx
└── PhoneVerificationModal.test.tsx
```

#### 5. **Integration Tests** (1 dosya)
Entegrasyon testleri.

```
__tests__/integration/
└── ListingDetailPage.test.tsx
```

#### 6. **API Tests** (1 dosya)
Admin API testleri.

```
__tests__/api/
└── adminApi.test.ts
```

### Frontend Test Komutları

```bash
# Tüm testleri çalıştır
cd frontend
npm test

# Tek seferde çalıştır (CI/CD için)
npm test -- --runInBand --no-coverage

# Hafıza artırarak çalıştır
NODE_OPTIONS="--max-old-space-size=8192" npm test -- --runInBand

# Sonuçları dosyaya kaydet
npm test -- --runInBand --no-coverage 2>&1 | tee frontend-test-results.txt
```

---

## 📈 Test Kapsama Alanları

### Backend Test Kapsamı

| Kategori | Test Sayısı | Açıklama |
|----------|-------------|----------|
| **Authentication** | 65+ | Kullanıcı girişi, kayıt, token yönetimi |
| **Comments** | 45+ | Yorum CRUD, yanıtlar, moderasyon |
| **Favorites** | 30+ | Favori ekleme/çıkarma, listeleme |
| **Listings** | 40+ | İlan CRUD, filtreleme, arama |
| **Messages** | 25+ | Mesajlaşma, teklif sistemi |
| **Admin** | 20+ | Admin paneli, kullanıcı yönetimi |
| **Email** | 10+ | Email gönderimi, şifre sıfırlama |
| **Phone Verification** | 15+ | Telefon doğrulama |
| **User Settings** | 20+ | Kullanıcı ayarları, gizlilik |

### Frontend Test Kapsamı

| Kategori | Test Dosyası | Açıklama |
|----------|--------------|----------|
| **Redux State** | 7 | State yönetimi, actions, reducers |
| **API Calls** | 7 | HTTP istekleri, error handling |
| **Components** | 22 | UI bileşenleri, user interactions |
| **Integration** | 1 | End-to-end akışlar |
| **Utils** | 1 | Yardımcı fonksiyonlar |

---

## 🚀 Continuous Integration

### Test Otomasyonu

Testler her commit'te otomatik olarak çalıştırılabilir:

```yaml
# .github/workflows/tests.yml örneği
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
      - name: Run Backend Tests
        run: |
          cd RealEstateAPI
          dotnet test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm install
          npm test -- --runInBand
```

---

## 📝 Test Yazma Kuralları

### Backend (C#)

```csharp
[Fact]
public async Task MethodName_Scenario_ExpectedBehavior()
{
    // Arrange
    var testData = CreateTestData();
    
    // Act
    var result = await _service.MethodName(testData);
    
    // Assert
    Assert.True(result.Success);
    Assert.NotNull(result.Data);
}
```

### Frontend (TypeScript/Jest)

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const { getByText } = render(<ComponentName />);
    
    // Act & Assert
    expect(getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 🔍 Test Sonuçları

### Backend Test Sonuçları
Detaylı sonuçlar için: `RealEstateAPI/backend-test-results.txt`

**Özet:**
- ✅ Tüm testler başarılı
- ⏱️ Ortalama test süresi: 6 saniye
- 📊 273 test geçti

### Frontend Test Sonuçları
Detaylı sonuçlar için: `frontend/frontend-test-results.txt`

**Özet:**
- ✅ Çalışan testler başarılı
- 📁 38 test dosyası
- 🧪 Unit, Integration ve Component testleri

---

## 🛠️ Sorun Giderme

### Frontend Hafıza Sorunu

Eğer testler hafıza sorunu verirse:

```bash
# Hafıza limitini artır
NODE_OPTIONS="--max-old-space-size=8192" npm test

# Testleri sırayla çalıştır
npm test -- --runInBand

# Belirli bir testi çalıştır
npm test -- __tests__/unit/redux/authSlice.test.ts
```

### Backend Test Hataları

```bash
# Önce build et
dotnet build

# Sonra test et
dotnet test

# Belirli bir test sınıfını çalıştır
dotnet test --filter "FullyQualifiedName~AuthServiceTests"
```

---

## 📚 Kaynaklar

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)

---

## ✅ Test Checklist

Yeni özellik eklerken:

- [ ] Unit testler yazıldı mı?
- [ ] Integration testler eklendi mi?
- [ ] Edge case'ler test edildi mi?
- [ ] Error handling test edildi mi?
- [ ] Tüm testler geçiyor mu?
- [ ] Test coverage yeterli mi?

---

**Son Güncelleme**: 8 Ocak 2026
**Test Durumu**: ✅ Tüm testler başarılı
