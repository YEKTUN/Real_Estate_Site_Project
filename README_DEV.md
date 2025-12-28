# 🚀 Development Guide - Otomatik Yeniden Başlatma

## .NET Backend - Hot Reload (Nodemon Benzeri)

.NET backend'inde kod değişikliklerinde otomatik yeniden başlatma için `dotnet watch` kullanılır.

### Yöntem 1: Terminal'den (Önerilen)

```bash
cd RealEstateAPI
dotnet watch run
```

veya script ile:

```bash
cd RealEstateAPI
./start-dev.sh
```

### Yöntem 2: VS Code'dan

1. **F5** tuşuna basın veya **Run and Debug** panelinden **".NET Core Watch"** seçeneğini seçin
2. Kod değişikliklerinde otomatik olarak yeniden başlatılacak

### Yöntem 3: VS Code Tasks

1. **Ctrl+Shift+P** (veya **Cmd+Shift+P**)
2. **Tasks: Run Task** yazın
3. **watch** seçeneğini seçin

## 📝 Notlar

- `dotnet watch` sadece `.cs`, `.cshtml`, `.json` gibi dosyaları izler
- `appsettings.json` değişikliklerinde de yeniden başlatır
- Hot reload özelliği sayesinde bazı değişiklikler restart gerektirmeden uygulanır
- Tam restart gerektiren değişikliklerde otomatik olarak yeniden başlatır

## 🔧 İzlenen Dosya Türleri

- `.cs` - C# dosyaları
- `.cshtml` - Razor view dosyaları
- `.json` - JSON yapılandırma dosyaları
- `.csproj` - Proje dosyaları

## ⚡ Performans

`dotnet watch` çok hızlıdır ve genellikle 1-2 saniye içinde yeniden başlatır.

