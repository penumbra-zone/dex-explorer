'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { usePathToMetadata } from '../../model/use-path.ts';
import { Skeleton } from '@/shared/ui/skeleton';
import { Density } from '@penumbra-zone/ui/Density';
import { Text } from '@penumbra-zone/ui/Text';
import { StarButton } from '@/features/star-pair';
import { handleRouting } from './handle-routing.ts';
import { useFocus } from './use-focus.ts';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Trigger } from './trigger';
import { SearchResults } from '@/pages/trade/ui/pair-selector/search-results';
import { DefaultResults } from '@/pages/trade/ui/pair-selector/default-results';
import { FilterInput } from '@/pages/trade/ui/pair-selector/filter-input';

export const PairSelector = observer(() => {
  const router = useRouter();
  const { baseAsset, quoteAsset, error, isLoading } = usePathToMetadata();

  const [isOpen, setIsOpen] = useState(false);
  const [baseFilter, setBaseFilter] = useState('');
  const [quoteFilter, setQuoteFilter] = useState('');
  const [selectedBase, setSelectedBase] = useState<Metadata>();
  const [selectedQuote, setSelectedQuote] = useState<Metadata>();

  const { baseRef, quoteRef, focusedType, clearFocus } = useFocus(isOpen);

  useEffect(() => {
    if (selectedBase && selectedQuote) {
      handleRouting({ router, baseAsset: selectedBase, quoteAsset: selectedQuote });
    }
  }, [selectedBase, selectedQuote, router]);

  if (error) {
    return <div>Error loading pair selector: ${String(error)}</div>;
  }

  if (isLoading || !baseAsset || !quoteAsset) {
    return (
      <div className='w-[200px]'>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className='relative flex items-center gap-2 text-text-primary'>
      <StarButton pair={{ base: baseAsset, quote: quoteAsset }} />

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Trigger onClick={() => setIsOpen(true)} pair={{ base: baseAsset, quote: quoteAsset }} />

        <Dialog.Content title='Select pair'>
          {/* Focus catcher. If this button wouldn't exist, the focus would go to the first input, which is undesirable */}
          <button type='button' className='w-full h-0 -mt-6 focus:outline-none' />

          <Density sparse>
            <div className='grid grid-cols-[1fr,16px,1fr] gap-2 pt-[2px] items-center'>
              <FilterInput
                ref={baseRef}
                value={baseFilter}
                asset={selectedBase}
                placeholder='Base asset'
                onChange={setBaseFilter}
                onClear={() => setSelectedBase(undefined)}
              />

              <Text body color='text.primary' align='center'>
                /
              </Text>

              <FilterInput
                ref={quoteRef}
                value={quoteFilter}
                asset={selectedQuote}
                placeholder='Quote asset'
                onChange={setQuoteFilter}
                onClear={() => setSelectedQuote(undefined)}
              />
            </div>
          </Density>

          {focusedType === 'base' && (
            <SearchResults
              search={baseFilter}
              onClear={clearFocus}
              onSelect={asset => {
                setSelectedBase(asset);
                if (!selectedQuote) {
                  quoteRef.current?.focus();
                }
              }}
            />
          )}

          {focusedType === 'quote' && (
            <SearchResults
              search={quoteFilter}
              onClear={clearFocus}
              onSelect={asset => {
                setSelectedQuote(asset);
                if (!selectedBase) {
                  baseRef.current?.focus();
                }
              }}
            />
          )}

          {!focusedType && (
            <DefaultResults
              onSelect={pair =>
                handleRouting({ router, baseAsset: pair.base, quoteAsset: pair.quote })
              }
            />
          )}
        </Dialog.Content>
      </Dialog>
    </div>
  );
});
