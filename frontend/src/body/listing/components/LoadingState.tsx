'use client';

/**
 * Yükleme Durumu Bileşeni
 * 
 * İlanlar yüklenirken gösterilen loading ekranı.
 */

export default function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">İlanlar yükleniyor...</p>
    </div>
  );
}

