'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@penumbra-zone/ui/TextInput';
import { Icon } from '@penumbra-zone/ui/Icon';
import { Ban, LoaderCircle, Search } from 'lucide-react';
import { isPositionId } from '@penumbra-zone/bech32m/plpid';
import { Button, ButtonProps } from '@penumbra-zone/ui/Button';
import { Density } from '@penumbra-zone/ui/Density';
import { Text } from '@penumbra-zone/ui/Text';

const getActionType = (searchQuery: string, isValid: boolean): ButtonProps['actionType'] => {
  if (!searchQuery) {
    return 'default';
  }
  if (isValid) {
    return 'accent';
  }
  return 'destructive';
};

const isValidBlockHeight = (query: string): boolean => {
  const num = Number(query);
  return !isNaN(num) && num >= 0 && Number.isInteger(num);
};

interface SearchFormProps {
  title: string;
  placeholder: string;
  searchQuery: string;
  isValid: boolean;
  onSubmit: (e: FormEvent) => void;
  onSearchChange: (value: string) => void;
  loading?: boolean;
}

const SearchForm = ({
  title,
  placeholder,
  searchQuery,
  isValid,
  onSubmit,
  onSearchChange,
  loading,
}: SearchFormProps) => {
  return (
    <div className='flex flex-col gap-2'>
      <Text color='text.primary'>{title}</Text>
      <form onSubmit={onSubmit} className='flex gap-2 items-center'>
        <div className='w-full'>
          <TextInput
            type='text'
            value={searchQuery}
            actionType='accent'
            placeholder={placeholder}
            onChange={onSearchChange}
          />
        </div>
        <div className='max-w-[200px]'>
          <Button type='submit' actionType={getActionType(searchQuery, isValid)}>
            {!!searchQuery && !isValid ? (
              <Icon size='md' IconComponent={Ban} color='base.white' />
            ) : (
              <Icon size='md' IconComponent={Search} color='base.white' />
            )}
          </Button>
        </div>
      </form>
      {loading && <LoaderCircle className='animate-spin text-white self-center' />}
    </div>
  );
};

export const InspectSearch = () => {
  const router = useRouter();
  const [lpQuery, setLpQuery] = useState('');
  const [blockQuery, setBlockQuery] = useState('');
  const [lpLoading, setLpLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const isValidLp = isPositionId(lpQuery);
  const isValidBlock = isValidBlockHeight(blockQuery);

  const handleLpSearch = (e: FormEvent) => {
    e.preventDefault();
    if (isValidLp) {
      setLpLoading(true);
      router.push(`/inspect/lp/${lpQuery}`);
    }
  };

  const handleBlockSearch = (e: FormEvent) => {
    e.preventDefault();
    if (isValidBlock) {
      setBlockLoading(true);
      router.push(`/inspect/block/${blockQuery}`);
    }
  };

  return (
    <Density compact>
      <div className='flex justify-center mt-4'>
        <div className='max-w-[600px] w-full mx-4 flex gap-6 flex-col'>
          <Text xxl color='base.white'>
            Explore for Nerds
          </Text>
          <SearchForm
            title='Search LP Position'
            placeholder='Enter LP position ID'
            searchQuery={lpQuery}
            isValid={isValidLp}
            onSubmit={handleLpSearch}
            onSearchChange={setLpQuery}
            loading={lpLoading}
          />
          <SearchForm
            title='Search Block'
            placeholder='Enter block height'
            searchQuery={blockQuery}
            isValid={isValidBlock}
            onSubmit={handleBlockSearch}
            onSearchChange={setBlockQuery}
            loading={blockLoading}
          />
        </div>
      </div>
    </Density>
  );
};
