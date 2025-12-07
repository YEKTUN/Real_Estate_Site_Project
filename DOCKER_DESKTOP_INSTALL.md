# 🐳 Docker Desktop Kurulum Rehberi (Linux)

## 📥 Adım 1: Docker Desktop İndir

### Yöntem 1: Resmi Siteden İndir (Önerilen)

1. Tarayıcıda aç: https://www.docker.com/products/docker-desktop/
2. **Download for Linux** butonuna tıkla
3. **DEB package** seç (Ubuntu/Debian için)
4. İndirilen dosyayı kur

---

### Yöntem 2: Terminal ile İndir ve Kur

```bash
# 1. Gerekli paketleri yükle
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# 2. Docker'ın GPG anahtarını ekle
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 3. Docker repository'sini ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Docker Desktop'ı indir
cd ~/Downloads
wget https://desktop.docker.com/linux/main/amd64/docker-desktop-4.36.0-amd64.deb

# 5. Docker Desktop'ı kur
sudo apt update
sudo apt install -y ./docker-desktop-4.36.0-amd64.deb
```

---

## 🚀 Adım 2: Docker Desktop'ı Başlat

### GUI'den Başlat:
1. **Applications** menüsünden **Docker Desktop** ara
2. İkona tıkla
3. İlk açılışta ayarları yapılandır

### Terminal'den Başlat:
```bash
systemctl --user start docker-desktop
```

---

## ⚙️ Adım 3: Docker Desktop Ayarları

Docker Desktop açıldıktan sonra:

1. **Settings** (⚙️) → **Resources**
   - **CPUs**: 2-4 (önerilen)
   - **Memory**: 4-8 GB (önerilen)
   - **Disk**: 20 GB+

2. **Settings** → **Docker Engine**
   - Varsayılan ayarları koru

3. **Apply & Restart** butonuna tıkla

---

## 🐘 Adım 4: PostgreSQL + pgAdmin Başlat

Docker Desktop çalıştıktan sonra:

### Yöntem 1: Terminal ile

```bash
cd /home/ali/Masaüstü/benim/bilgisayara/Dersler/SWE/Real_Estate_Site_Project
docker-compose up -d
```

### Yöntem 2: Docker Desktop GUI ile

1. Docker Desktop'ta **Containers** sekmesine git
2. Sağ üstte **+** butonuna tıkla
3. **Import from docker-compose.yml** seç
4. `docker-compose.yml` dosyasını seç
5. **Run** butonuna tıkla

---

## 🌐 Adım 5: Erişim Kontrol

### Container'ları Kontrol Et:

Docker Desktop'ta **Containers** sekmesinde göreceksin:
- ✅ `realestate-postgres` (çalışıyor olmalı)
- ✅ `realestate-pgadmin` (çalışıyor olmalı)

### Erişim Bilgileri:

**PostgreSQL:**
- Host: `localhost`
- Port: `5432`
- Database: `RealEstateDB`
- Username: `postgres`
- Password: `admin123`

**pgAdmin (Web Arayüzü):**
- URL: http://localhost:5050
- Email: `admin@realestate.com`
- Password: `admin123`

---

## 🎯 Docker Desktop Özellikleri

### 1. Containers Yönetimi
- Container'ları başlat/durdur
- Logları görüntüle
- Terminal'e bağlan
- Kaynak kullanımını izle

### 2. Images Yönetimi
- İndirilen image'leri görüntüle
- Yeni image'ler çek
- Eski image'leri sil

### 3. Volumes Yönetimi
- Volume'ları görüntüle
- Veri yedekleme
- Volume'ları temizle

### 4. Networks
- Network'leri görüntüle
- Yeni network oluştur

---

## 🛠️ Yararlı Komutlar

### Container İşlemleri:

```bash
# Container'ları listele
docker ps

# Tüm container'ları listele (durmuş olanlar dahil)
docker ps -a

# Container'ı durdur
docker stop realestate-postgres

# Container'ı başlat
docker start realestate-postgres

# Container'ı yeniden başlat
docker restart realestate-postgres

# Container loglarını görüntüle
docker logs realestate-postgres

# Container'a bağlan
docker exec -it realestate-postgres bash
```

### Docker Compose İşlemleri:

```bash
# Container'ları başlat
docker-compose up -d

# Container'ları durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f

# Container'ları yeniden başlat
docker-compose restart
```

### Temizlik İşlemleri:

```bash
# Kullanılmayan container'ları sil
docker container prune

# Kullanılmayan image'leri sil
docker image prune

# Kullanılmayan volume'ları sil
docker volume prune

# Tüm kullanılmayanları sil
docker system prune -a
```

---

## 🔍 Sorun Giderme

### Docker Desktop Başlamıyor:

```bash
# Docker servisini kontrol et
systemctl --user status docker-desktop

# Docker Desktop'ı yeniden başlat
systemctl --user restart docker-desktop

# Logları kontrol et
journalctl --user -u docker-desktop
```

### Port Zaten Kullanımda:

```bash
# 5432 portunu kullanan process'i bul
sudo lsof -i :5432

# Process'i durdur
sudo kill -9 <PID>
```

### Container Başlamıyor:

1. Docker Desktop'ta container'a tıkla
2. **Logs** sekmesine git
3. Hata mesajlarını kontrol et

---

## 📚 Ek Kaynaklar

- **Docker Desktop Docs**: https://docs.docker.com/desktop/
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **pgAdmin Docs**: https://www.pgadmin.org/docs/

---

## ✅ Kurulum Sonrası

Docker Desktop kurulduktan sonra:

1. ✅ Docker Desktop'ı başlat
2. ✅ `docker-compose up -d` komutunu çalıştır
3. ✅ http://localhost:5050 adresinden pgAdmin'e eriş
4. ✅ Backend projesinde migration'ları çalıştır:
   ```bash
   cd backend/RealEstateAPI
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

Artık PostgreSQL ve pgAdmin kullanıma hazır! 🎉

