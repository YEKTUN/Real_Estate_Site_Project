'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Ana Sayfa (Landing Page)
 * 
 * Home layout'unu kullanır. Navbar ve Footer dahil.
 * URL: / (route group parantezi URL'de görünmez)
 */

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Arama form handler
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Arama:', searchQuery);
    // TODO: Arama sayfasına yönlendir
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Hayalinizdeki Evi Bulun
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Binlerce ilan arasından size en uygun evi keşfedin
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 bg-white rounded-2xl p-2 shadow-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Şehir, semt veya mahalle ara..."
                className="flex-1 px-6 py-4 text-lg rounded-xl outline-none text-gray-800"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                🔍 Ara
              </button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {['Satılık', 'Kiralık', 'Daire', 'Villa', 'Arsa'].map((filter) => (
              <button
                key={filter}
                className="px-6 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors border border-white/30"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: '🏠', value: '10,000+', label: 'İlan' },
          { icon: '👥', value: '50,000+', label: 'Kullanıcı' },
          { icon: '🏙️', value: '81', label: 'Şehir' },
          { icon: '✅', value: '5,000+', label: 'Satış' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stat.value}
            </div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Featured Properties */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Öne Çıkan İlanlar</h2>
            <p className="text-gray-600 mt-2">En popüler gayrimenkul ilanları</p>
          </div>
          <Link
            href="/properties"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tümünü Gör
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                  Satılık
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Lüks 3+1 Daire
                </h3>
                <p className="text-gray-600 mb-4 flex items-center">
                  📍 Kadıköy, İstanbul
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">
                    ₺2,500,000
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>🛏️ 3</span>
                    <span>🚿 2</span>
                    <span>📐 150m²</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Neden Bizi Seçmelisiniz?
          </h2>
          <p className="text-gray-600 text-lg">
            Gayrimenkul arayışınızı kolaylaştıran özellikler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🔍',
              title: 'Gelişmiş Arama',
              description: 'Detaylı filtrelerle tam istediğiniz evi bulun',
            },
            {
              icon: '🔒',
              title: 'Güvenli İşlem',
              description: 'Doğrulanmış ilanlar ve güvenli ödeme sistemi',
            },
            {
              icon: '💬',
              title: '7/24 Destek',
              description: 'Uzman ekibimiz her zaman yanınızda',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Hemen Başlayın!
        </h2>
        <p className="text-xl mb-8 text-blue-100">
          Ücretsiz hesap oluşturun ve hayalinizdeki evi bulun
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg text-lg"
          >
            Ücretsiz Kayıt Ol
          </Link>
          <Link
            href="/properties"
            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
          >
            İlanları İncele
          </Link>
        </div>
      </section>
    </div>
  );
}

