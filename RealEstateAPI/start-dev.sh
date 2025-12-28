#!/bin/bash

# .NET Backend Development Server (Hot Reload ile)
# Bu script nodemon gibi çalışır - kod değişikliklerinde otomatik yeniden başlatır

echo "🚀 .NET Backend Development Server başlatılıyor..."
echo "📝 Kod değişikliklerinde otomatik yeniden başlatma aktif"
echo "🛑 Durdurmak için Ctrl+C"
echo ""

cd "$(dirname "$0")"
dotnet watch run --project RealEstateAPI.csproj

