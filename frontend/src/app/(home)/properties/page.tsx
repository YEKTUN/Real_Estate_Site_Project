'use client';

import { useState } from 'react';

/**
 * İlanlar Sayfası
 * 
 * Tüm gayrimenkul ilanlarını listeler. Home layout'unu kullanır.
 * URL: /properties
 */

export default function PropertiesPage() {
  const [filters, setFilters] = useState({
    type: 'all',
    priceMin: '',
    priceMax: '',
    rooms: 'all',
  });

  /**
   * Filtre değişikliği handler
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Gayrimenkul İlanları
        </h1>
        <p className="text-gray-600 text-lg">
          Binlerce ilan arasından size en uygun olanı bulun
        </p>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Filtreler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tip Filtresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlan Tipi
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              <option value="sale">Satılık</option>
              <option value="rent">Kiralık</option>
            </select>
          </div>

          {/* Min Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Fiyat
            </label>
            <input
              type="number"
              value={filters.priceMin}
              onChange={(e) => handleFilterChange('priceMin', e.target.value)}
              placeholder="₺ 0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Max Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Fiyat
            </label>
            <input
              type="number"
              value={filters.priceMax}
              onChange={(e) => handleFilterChange('priceMax', e.target.value)}
              placeholder="₺ 10,000,000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Oda Sayısı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oda Sayısı
            </label>
            <select
              value={filters.rooms}
              onChange={(e) => handleFilterChange('rooms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              <option value="1">1+0</option>
              <option value="2">1+1</option>
              <option value="3">2+1</option>
              <option value="4">3+1</option>
              <option value="5">4+1</option>
            </select>
          </div>
        </div>

        {/* Filtre Butonları */}
        <div className="flex gap-4 mt-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Filtrele
          </button>
          <button
            onClick={() =>
              setFilters({
                type: 'all',
                priceMin: '',
                priceMax: '',
                rooms: 'all',
              })
            }
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Sonuç Sayısı */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-800">1,234</span> ilan bulundu
        </p>
        <select className="px-4 py-2 border border-gray-300 rounded-lg outline-none">
          <option>Önerilen</option>
          <option>Fiyat (Düşükten Yükseğe)</option>
          <option>Fiyat (Yüksekten Düşüğe)</option>
          <option>Tarih (Yeniden Eskiye)</option>
        </select>
      </div>

      {/* İlan Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer"
          >
            {/* Görsel */}
            <div className="h-56 bg-gradient-to-br from-blue-400 to-purple-500 relative">
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Satılık
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full cursor-pointer hover:bg-white transition-colors">
                ❤️
              </div>
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                📸 12 Fotoğraf
              </div>
            </div>

            {/* İçerik */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                  Lüks 3+1 Daire Deniz Manzaralı
                </h3>
              </div>

              <p className="text-gray-600 mb-4 flex items-center">
                📍 Kadıköy, İstanbul
              </p>

              {/* Özellikler */}
              <div className="flex gap-4 mb-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  🛏️ 3 Oda
                </span>
                <span className="flex items-center gap-1">
                  🚿 2 Banyo
                </span>
                <span className="flex items-center gap-1">
                  📐 150m²
                </span>
              </div>

              {/* Fiyat ve Buton */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  ₺2,500,000
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                  Detaylar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ← Önceki
        </button>
        {[1, 2, 3, 4, 5].map((page) => (
          <button
            key={page}
            className={`px-4 py-2 rounded-lg transition-colors ${
              page === 1
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Sonraki →
        </button>
      </div>
    </div>
  );
}

