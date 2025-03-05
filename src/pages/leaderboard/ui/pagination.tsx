'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import cn from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={cn(
            'rounded-full px-3 py-1.5 mx-0.5 text-sm',
            currentPage === i ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80',
          )}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className='flex items-center justify-center py-2'>
      <button
        className={cn(
          'rounded-full p-1.5 mx-0.5 bg-secondary',
          currentPage > 1
            ? 'hover:bg-secondary/80 cursor-pointer'
            : 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className='w-5 h-5' />
      </button>

      {renderPageNumbers()}

      <button
        className={cn(
          'rounded-full p-1.5 mx-0.5 bg-secondary',
          currentPage < totalPages
            ? 'hover:bg-secondary/80 cursor-pointer'
            : 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className='w-5 h-5' />
      </button>
    </div>
  );
}
