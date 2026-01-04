'use client';

import { PaginationDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * Sayfalama Bileşeni
 * 
 * İlan listesi için sayfalama kontrollerini gösterir.
 */

import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/body/components/ui/pagination';

interface PaginationProps {
  pagination: PaginationDto | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, currentPage, onPageChange }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { totalPages, hasPrevious, hasNext } = pagination;

  return (
    <div className="flex flex-col items-center gap-4 mt-12 pb-8">
      <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
        SAYFA {currentPage} / {totalPages}
      </p>

      <ShadcnPagination>
        <PaginationContent className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => hasPrevious && onPageChange(currentPage - 1)}
              disabled={!hasPrevious}
              className={`h-10 w-10 sm:w-auto sm:px-4 rounded-xl cursor-pointer ${!hasPrevious ? 'pointer-events-none opacity-20' : 'hover:bg-slate-50'}`}
            />
          </PaginationItem>

          {(() => {
            const pages = [];
            const maxVisible = 3;
            let start = Math.max(1, currentPage - 1);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end - start < maxVisible - 1) {
              start = Math.max(1, end - maxVisible + 1);
            }

            if (start > 1) {
              pages.push(
                <PaginationItem key={1}>
                  <PaginationLink onClick={() => onPageChange(1)} className="h-10 w-10 rounded-xl cursor-pointer hover:bg-slate-50 font-bold text-xs">1</PaginationLink>
                </PaginationItem>
              );
              if (start > 2) pages.push(<PaginationItem key="start-dots"><PaginationEllipsis /></PaginationItem>);
            }

            for (let page = start; page <= end; page++) {
              pages.push(
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === currentPage}
                    className={`h-10 w-10 rounded-xl cursor-pointer font-black text-xs ${page === currentPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50'}`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            if (end < totalPages) {
              if (end < totalPages - 1) pages.push(<PaginationItem key="end-dots"><PaginationEllipsis /></PaginationItem>);
              pages.push(
                <PaginationItem key={totalPages}>
                  <PaginationLink onClick={() => onPageChange(totalPages)} className="h-10 w-10 rounded-xl cursor-pointer hover:bg-slate-50 font-bold text-xs">{totalPages}</PaginationLink>
                </PaginationItem>
              );
            }

            return pages;
          })()}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasNext && onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className={`h-10 w-10 sm:w-auto sm:px-4 rounded-xl cursor-pointer ${!hasNext ? 'pointer-events-none opacity-20' : 'hover:bg-slate-50'}`}
            />
          </PaginationItem>
        </PaginationContent>
      </ShadcnPagination>
    </div>
  );
}
