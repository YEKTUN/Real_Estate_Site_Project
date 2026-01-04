# 📱 Telefon Doğrulama Sistemi - SMS Simülasyonu

## 🎯 Genel Bakış

Kullanıcılar **ilan oluşturmadan önce** telefon numaralarını doğrulamalıdır. Gerçek SMS gönderimi ücretli olduğu için, bu sistem **simülasyon** modunda çalışır.

---

## 🔧 Backend Değişiklikleri

### 1. **Database Şeması** ✅

`AspNetUsers` tablosuna eklenen alanlar:

```sql
ALTER TABLE "AspNetUsers" 
ADD COLUMN "PhoneVerified" boolean NOT NULL DEFAULT false,
ADD COLUMN "PhoneVerificationCode" VARCHAR(6),
ADD COLUMN "PhoneVerificationExpires" timestamp with time zone;
```

### 2. **ApplicationUser Model** ✅

```csharp
public bool PhoneVerified { get; set; } = false;
public string? PhoneVerificationCode { get; set; }
public DateTime? PhoneVerificationExpires { get; set; }
```

### 3. **PhoneVerificationController** ✅

**Endpoint'ler:**

- `POST /api/PhoneVerification/send-code` - Doğrulama kodu gönder
- `POST /api/PhoneVerification/verify-code` - Kodu doğrula
- `GET /api/PhoneVerification/status` - Doğrulama durumunu kontrol et

### 4. **ListingController** ✅

İlan oluşturma öncesi telefon doğrulama kontrolü:

```csharp
if (!user.PhoneVerified)
{
    return BadRequest(new ListingResponseDto
    {
        Success = false,
        Message = "İlan oluşturmak için telefon numaranızı doğrulamanız gerekmektedir.",
        RequiresPhoneVerification = true
    });
}
```

---

## 🎨 Frontend Değişiklikleri

### 1. **API Fonksiyonları** ✅

`phoneVerificationApi.ts`:
- `sendVerificationCodeApi()` - Kod gönder
- `verifyPhoneCodeApi()` - Kod doğrula
- `getPhoneVerificationStatusApi()` - Durum kontrol

### 2. **PhoneVerificationModal Bileşeni** ✅

İki adımlı doğrulama modal:
1. **Telefon Girişi**: 05XXXXXXXXX formatında
2. **Kod Doğrulama**: 6 haneli kod

**Özellikler:**
- ✅ Geri sayım timer (5 dakika)
- ✅ Kod yeniden gönderme
- ✅ Simülasyon modu göstergesi
- ✅ Gerçek zamanlı validasyon
- ✅ Modern, premium tasarım

### 3. **UserDto Güncellemesi** ✅

```typescript
export interface UserDto {
  // ...
  phoneVerified: boolean;
}
```

---

## 📋 Kullanım Senaryosu

### Senaryo 1: Yeni Kullanıcı İlan Oluşturmak İstiyor

1. Kullanıcı kayıt olur (telefon **opsiyonel**)
2. Panel'e gider, "Yeni İlan" butonuna tıklar
3. **Telefon doğrulanmamışsa:**
   - Hata mesajı: "İlan oluşturmak için telefon numaranızı doğrulamanız gerekmektedir."
   - `RequiresPhoneVerification: true` döner
4. Frontend telefon doğrulama modalını açar
5. Kullanıcı telefon numarasını girer
6. **Simülasyon:** 6 haneli kod oluşturulur ve ekranda gösterilir
7. Kullanıcı kodu girer ve doğrular
8. `PhoneVerified = true` olur
9. Artık ilan oluşturabilir! 🎉

### Senaryo 2: Profil Sayfasında Doğrulama

1. Kullanıcı profil sayfasına gider
2. Telefon numarası alanında doğrulama durumu gösterilir:
   - ✅ **Doğrulanmış**: Yeşil badge
   - ❌ **Doğrulanmamış**: "Doğrula" butonu
3. "Doğrula" butonuna tıklar
4. Modal açılır ve doğrulama işlemi yapılır

---

## 🔐 Güvenlik ve Validasyon

### Telefon Formatı

- **Format**: `05XXXXXXXXX` (11 hane)
- **Regex**: `/^0[5][0-9]{9}$/`
- **Örnek**: `05342503741`

### Doğrulama Kodu

- **Uzunluk**: 6 hane
- **Format**: Sadece rakamlar
- **Geçerlilik**: 5 dakika
- **Örnek**: `123456`

### Backend Validasyonu

```csharp
// Telefon formatı kontrolü
if (cleanedPhone.Length != 11 || !cleanedPhone.StartsWith("05"))
{
    return BadRequest("Geçerli bir telefon numarası giriniz");
}

// Kod süresi kontrolü
if (user.PhoneVerificationExpires < DateTime.UtcNow)
{
    return BadRequest("Doğrulama kodunun süresi dolmuş");
}

// Kod eşleşme kontrolü
if (user.PhoneVerificationCode != request.Code)
{
    return BadRequest("Geçersiz doğrulama kodu");
}
```

---

## 🎭 Simülasyon Modu

### Development (Şu Anki Durum)

```typescript
// API Response
{
  success: true,
  message: "Doğrulama kodu gönderildi",
  code: "123456", // ⚠️ Simülasyon için gösteriliyor
  expiresAt: "2026-01-02T16:45:00Z"
}
```

Modal'da sarı arka planla kod gösterilir:

```
📱 SİMÜLASYON MODU
Gerçek SMS gönderilmedi. Test için kod:
┌─────────┐
│ 123456  │
└─────────┘
```

### Production (Gelecek)

1. `SendVerificationCode` endpoint'inden `code` alanını kaldır
2. Gerçek SMS servisi entegre et (Twilio, Nexmo, vb.)
3. Modal'daki simülasyon uyarısını kaldır

---

## 🚀 Sonraki Adımlar

### Frontend Entegrasyonu

1. **İlan Oluşturma Sayfası**:
   ```typescript
   // Hata yakalandığında
   if (error.requiresPhoneVerification) {
     setShowPhoneVerificationModal(true);
   }
   ```

2. **Profil Sayfası**:
   ```typescript
   {!user.phoneVerified && (
     <button onClick={() => setShowPhoneVerificationModal(true)}>
       Telefonu Doğrula
     </button>
   )}
   ```

3. **Panel Dashboard**:
   ```typescript
   {!user.phoneVerified && (
     <Alert>
       İlan oluşturmak için telefon numaranızı doğrulayın
     </Alert>
   )}
   ```

### Test Senaryoları

- [ ] Telefon numarası olmayan kullanıcı
- [ ] Telefon numarası var ama doğrulanmamış
- [ ] Telefon numarası doğrulanmış
- [ ] Kod süresi dolmuş
- [ ] Yanlış kod girilmiş
- [ ] Kod yeniden gönderme

---

## 📊 Database Durumu

```sql
-- Tüm kullanıcıların doğrulama durumunu kontrol et
SELECT 
  "Email",
  "Phone",
  "PhoneVerified",
  "PhoneVerificationCode",
  "PhoneVerificationExpires"
FROM "AspNetUsers";

-- Doğrulanmamış kullanıcıları listele
SELECT "Email", "Phone" 
FROM "AspNetUsers" 
WHERE "PhoneVerified" = false;

-- Test için bir kullanıcıyı doğrulanmış yap
UPDATE "AspNetUsers" 
SET "PhoneVerified" = true 
WHERE "Email" = 'test@example.com';
```

---

## ✅ Tamamlanan İşler

- [x] Database şeması güncellendi
- [x] Backend controller oluşturuldu
- [x] İlan oluşturma kontrolü eklendi
- [x] Frontend API fonksiyonları yazıldı
- [x] PhoneVerificationModal bileşeni oluşturuldu
- [x] Telefon validasyonu güncellendi (4-3-2-2 format)
- [x] UserDto'ya phoneVerified eklendi

## 🔜 Yapılacaklar

- [ ] İlan oluşturma sayfasına modal entegrasyonu
- [ ] Profil sayfasına doğrulama butonu ekleme
- [ ] Panel dashboard'a uyarı ekleme
- [ ] AuthSlice'a phoneVerified state yönetimi
- [ ] Test senaryolarının yazılması

---

## 🎉 Sonuç

Telefon doğrulama sistemi başarıyla kuruldu! Kullanıcılar artık ilan oluşturmadan önce telefon numaralarını doğrulamalıdır. Sistem simülasyon modunda çalıştığı için gerçek SMS gönderilmez, kod ekranda gösterilir.

**Güvenlik Notu**: Production'a geçmeden önce simülasyon kodunu kaldırın ve gerçek SMS servisi entegre edin!
