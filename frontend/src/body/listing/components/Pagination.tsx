'use client';

import { PaginationDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * Sayfalama Bileşeni
 * 
 * İlan listesi için sayfalama kontrollerini gösterir.
 */

interface PaginationProps {
  pagination: PaginationDto | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, currentPage, onPageChange }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!pagination.hasPrevious}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Önceki
      </button>
      
      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        );
      })}
      
      {pagination.totalPages > 5 && (
        <>
          <span className="px-2 text-gray-500">...</span>
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              pagination.totalPages === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {pagination.totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!pagination.hasNext}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sonraki →
      </button>
    </div>
  );
}

