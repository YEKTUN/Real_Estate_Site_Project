'use client';

/**
 * Boş Durum Bileşeni
 * 
 * İlan bulunamadığında gösterilen boş durum ekranı.
 */

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-2xl">
      <div className="text-6xl mb-4">🏠</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        İlan bulunamadı
      </h3>
      <p className="text-gray-600 mb-6">
        Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin.
      </p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
      >
        Filtreleri Temizle
      </button>
    </div>
  );
}

