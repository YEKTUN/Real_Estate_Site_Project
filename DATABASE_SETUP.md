# 🐘 PostgreSQL + pgAdmin Kurulum Rehberi

## 📋 Gereksinimler

- Docker
- Docker Compose

---

## 🚀 Adım 1: Docker Kurulumu

Terminal'de şu komutları çalıştır:

```bash
# Docker ve Docker Compose kurulumu
sudo apt update
sudo apt install -y docker.io docker-compose

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker

# Kullanıcını docker grubuna ekle (sudo olmadan kullanmak için)
sudo usermod -aG docker $USER

# Değişikliklerin geçerli olması için (veya bilgisayarı yeniden başlat)
newgrp docker
```

### Docker Kurulumunu Test Et:

```bash
docker --version
docker-compose --version
```

---

## 🐘 Adım 2: PostgreSQL + pgAdmin Başlat

Proje ana dizininde:

```bash


# Container'ları başlat
docker-compose up -d

# Logları kontrol et
docker-compose logs -f
```

### Container'ları Durdur:

```bash
docker-compose down
```

### Container'ları Sil (Veri dahil):

```bash
docker-compose down -v
```

---

## 🌐 Adım 3: Erişim Bilgileri

### PostgreSQL Database:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `RealEstateDB`
- **Username**: `postgres`
- **Password**: `admin123`

### pgAdmin Web Arayüzü:
- **URL**: http://localhost:5050
- **Email**: `admin@realestate.com`
- **Password**: `admin123`

---

## 🔧 Adım 4: pgAdmin'de PostgreSQL Bağlantısı

1. Tarayıcıda http://localhost:5050 aç
2. Email ve şifre ile giriş yap
3. Sol menüde **Servers** → Sağ tık → **Register** → **Server**
4. **General** sekmesi:
   - Name: `RealEstate`
5. **Connection** sekmesi:
   - Host: `postgres` (Docker network içinde)
   - Port: `5432`
   - Database: `RealEstateDB`
   - Username: `postgres`
   - Password: `admin123`
6. **Save** butonuna tıkla

---

## 📊 Adım 5: .NET Projesi Yapılandırması

### 1. Npgsql Paketini Yükle:

```bash
cd backend/RealEstateAPI
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.11
```

### 2. Connection String'i Güncelle:

`appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=RealEstateDB;Username=postgres;Password=admin123"
}
```

### 3. Program.cs'i Güncelle:

```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 4. Migration Oluştur ve Uygula:

```bash
# Migration oluştur
dotnet ef migrations add InitialCreate

# Database'i güncelle
dotnet ef database update
```

---

## 🛠️ Yararlı Komutlar

### Docker Container'ları Kontrol Et:

```bash
# Çalışan container'ları listele
docker ps

# Tüm container'ları listele
docker ps -a

# PostgreSQL container'ına bağlan
docker exec -it realestate-postgres psql -U postgres -d RealEstateDB

# Container loglarını görüntüle
docker logs realestate-postgres
docker logs realestate-pgadmin
```

### PostgreSQL Komutları (Container içinde):

```sql
-- Database'leri listele
\l

-- Tabloları listele
\dt

-- Tablo yapısını göster
\d table_name

-- Çıkış
\q
```

---

## 🔍 Sorun Giderme

### Port Zaten Kullanımda:

```bash
# 5432 portunu kullanan process'i bul
sudo lsof -i :5432

# Process'i durdur
sudo kill -9 <PID>
```

### Container Başlamıyor:

```bash
# Container'ları temizle
docker-compose down
docker system prune -a

# Yeniden başlat
docker-compose up -d
```

### Veri Sıfırlama:

```bash
# Volume'ları sil (TÜM VERİ SİLİNİR!)
docker-compose down -v
docker-compose up -d
```

---

## 📚 Ek Bilgiler

### Production İçin Güvenlik:

1. **Şifreleri Değiştir**: Güçlü şifreler kullan
2. **Environment Variables**: Hassas bilgileri .env dosyasında sakla
3. **Network Güvenliği**: Sadece gerekli portları aç
4. **Backup**: Düzenli yedekleme yap

### Backup Alma:

```bash
# Backup oluştur
docker exec realestate-postgres pg_dump -U postgres RealEstateDB > backup.sql

# Backup'tan geri yükle
docker exec -i realestate-postgres psql -U postgres RealEstateDB < backup.sql
```

---

## ✅ Kurulum Tamamlandı!

Artık PostgreSQL ve pgAdmin kullanıma hazır! 🎉

- 🐘 PostgreSQL: `localhost:5432`
- 🌐 pgAdmin: http://localhost:5050
- 📊 Database: `RealEstateDB`

Backend projesinde Entity Framework yapılandırmasına devam edebilirsin.

