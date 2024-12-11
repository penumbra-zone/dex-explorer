'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ChevronDown, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { useAssets } from '@/shared/api/assets';
import { usePathToMetadata } from '../../model/use-path.ts';
import { Skeleton } from '@/shared/ui/skeleton';
import { Density } from '@penumbra-zone/ui/Density';
import { Button } from '@penumbra-zone/ui/Button';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Text } from '@penumbra-zone/ui/Text';
import { TextInput } from '@penumbra-zone/ui/TextInput';
import { StarButton, starStore } from '@/features/star-pair';
import { handleRouting } from './handle-routing.ts';
import { useFocus } from './use-focus.ts';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export const PairSelector = observer(() => {
  const router = useRouter();
  const { data: assets } = useAssets();
  // const { data: balances } = useBalances();
  const { baseAsset, quoteAsset, error, isLoading } = usePathToMetadata();

  const { pairs: starred } = starStore;

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
        <Dialog.Trigger asChild>
          <button
            type='button'
            className='flex items-center gap-1 cursor-pointer'
            onClick={() => setIsOpen(true)}
          >
            <div className='z-10'>
              <AssetIcon metadata={baseAsset} size='lg' />
            </div>
            <div className='-ml-4'>
              <AssetIcon metadata={quoteAsset} size='lg' />
            </div>

            <Text body>
              {baseAsset.symbol}/{quoteAsset.symbol}
            </Text>

            <i className='flex size-6 items-center justify-center p-1'>
              <ChevronDown />
            </i>
          </button>
        </Dialog.Trigger>

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
            <>
              <div className='flex flex-col gap-2 text-text-secondary'>
                <Text small>Recent</Text>
                <Dialog.RadioGroup>
                  <div className='flex flex-col gap-1'>
                    {assets?.map(asset => (
                      <Dialog.RadioItem
                        key={asset.symbol}
                        value={asset.symbol}
                        title={<Text color='text.primary'>{asset.symbol}</Text>}
                        startAdornment={<AssetIcon metadata={asset} size='lg' />}
                        onSelect={() => {
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
                    ))}
                  </div>
                </Dialog.RadioGroup>
              </div>

              <Button onClick={clearFocus} priority='primary'>
                Clear
              </Button>
            </>
          )}

          {starred.length ? (
            <div className='mt-4 flex flex-col gap-2 text-text-secondary'>
              <Text small>Starred</Text>

              <Dialog.RadioGroup>
                <div className='flex flex-col gap-1'>
                  {starred.map(({ base, quote }) => (
                    <Dialog.RadioItem
                      key={`${base.symbol}/${quote.symbol}`}
                      value={`${base.symbol}/${quote.symbol}`}
                      title={
                        <Text color='text.primary'>
                          {base.symbol}/{quote.symbol}
                        </Text>
                      }
                      endAdornment={<StarButton adornment pair={{ base, quote }} />}
                      startAdornment={
                        <>
                          <div className='z-10'>
                            <AssetIcon metadata={baseAsset} size='lg' />
                          </div>
                          <div className='-ml-4'>
                            <AssetIcon metadata={quoteAsset} size='lg' />
                          </div>
                        </>
                      }
                      onSelect={() => handleRouting({ router, baseAsset: base, quoteAsset: quote })}
                    />
                  ))}
                </div>
              </Dialog.RadioGroup>
            </div>
          ) : (
            <div className='grow flex flex-col items-center justify-center gap-2 py-4 text-text-secondary'>
              <Search className='size-8' />
              <Text small>No results</Text>
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </div>
  );
});
