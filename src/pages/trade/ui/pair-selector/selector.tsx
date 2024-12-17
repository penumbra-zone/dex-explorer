'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { usePathToMetadata } from '../../model/use-path.ts';
import { Skeleton } from '@/shared/ui/skeleton';
import { Density } from '@penumbra-zone/ui/Density';
import { Button } from '@penumbra-zone/ui/Button';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Text } from '@penumbra-zone/ui/Text';
import { TextInput } from '@penumbra-zone/ui/TextInput';
import { StarButton } from '@/features/star-pair';
import { handleRouting } from './handle-routing.ts';
import { useFocus } from './use-focus.ts';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Trigger } from './trigger';
import { SearchResults } from '@/pages/trade/ui/pair-selector/search-results';
import { DefaultResults } from '@/pages/trade/ui/pair-selector/default-results';

export const PairSelector = observer(() => {
  const router = useRouter();
  const { baseAsset, quoteAsset, error, isLoading } = usePathToMetadata();

  const [isOpen, setIsOpen] = useState(false);
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
            <div className='flex items-center gap-2 pt-[2px] [&>label]:grow'>
              {selectedBase ? (
                <div className='grow h-14 flex gap-2 items-center text-text-primary px-3 rounded-sm bg-other-tonalFill5'>
                  <div className='grow flex items-center gap-2'>
                    <AssetIcon metadata={selectedBase} />
                    <Text>{selectedBase.symbol}</Text>
                  </div>
                  <Button iconOnly='adornment' icon={X} onClick={() => setSelectedBase(undefined)}>
                    Deselect base asset
                  </Button>
                </div>
              ) : (
                <TextInput placeholder='Base asset' endAdornment={<Search />} ref={baseRef} />
              )}

              <Text body color='text.primary'>
                /
              </Text>

              <TextInput placeholder='Quote asset' endAdornment={<Search />} ref={quoteRef} />
            </div>
          </Density>

          {focusedType && (
            <SearchResults
              onClear={clearFocus}
              onSelect={asset => {
                if (focusedType === 'base') {
                  setSelectedBase(asset);
                  if (!selectedQuote) {
                    quoteRef.current?.focus();
                  }
                } else {
                  setSelectedQuote(asset);
                  if (!selectedBase) {
                    baseRef.current?.focus();
                  }
                }
              }}
            />
          )}

          <DefaultResults
            onSelect={pair =>
              handleRouting({ router, baseAsset: pair.base, quoteAsset: pair.quote })
            }
          />
        </Dialog.Content>
      </Dialog>
    </div>
  );
});
