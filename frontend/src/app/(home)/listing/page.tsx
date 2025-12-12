'use client';

import Listings from '@/body/listing/Listings';

/**
 * İlanlar Sayfası
 * 
 * Tüm gayrimenkul ilanlarını listeler. Home layout'unu kullanır.
 * URL: /properties
 * 
 * Ana bileşen: @/body/listing/Listings
 * - İlan arama ve filtreleme
 * - Sayfalama
 * - Favori ekleme/çıkarma
 */

export default function ListingPage() {
  return <Listings />;
}
