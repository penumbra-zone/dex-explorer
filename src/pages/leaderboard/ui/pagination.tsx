'use client';

import { Text } from '@penumbra-zone/ui/Text';
import { DropdownMenu } from '@penumbra-zone/ui/DropdownMenu';
import cn from 'clsx';
import { Button } from '@penumbra-zone/ui/Button';
import { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [value, setValue] = useState('10');

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
            'flex items-center justify-center rounded-full w-10 h-10 mx-3 text-sm',
            currentPage === i ? 'bg-other-tonalFill10 text-text-primary' : 'text-text-secondary',
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
    <div className='flex justify-between items-center'>
      <Text color='text.secondary'>
        {currentPage} out of {totalPages}
      </Text>
      <div className='flex items-center justify-center py-2'>
        <button
          className={cn(
            'rounded-full py-2.5 px-4 mx-3 bg-other-tonalFill5',
            currentPage > 1
              ? 'cursor-pointer text-text-secondary'
              : 'cursor-not-allowed text-text-muted',
          )}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Prev
        </button>

        {renderPageNumbers()}

        <button
          className={cn(
            'rounded-full py-2.5 px-4 mx-3 bg-other-tonalFill5',
            currentPage < totalPages
              ? 'cursor-pointer text-text-secondary'
              : 'cursor-not-allowed text-text-muted',
          )}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
      <DropdownMenu>
        <DropdownMenu.Trigger>
          <Text color='text.secondary'>Show 10</Text>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.RadioGroup value={value} onChange={setValue}>
            <div className='flex flex-col gap-2'>
              <DropdownMenu.RadioItem value='10'>10</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value='20'>20</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value='50'>50</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value='100'>100</DropdownMenu.RadioItem>
            </div>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}
