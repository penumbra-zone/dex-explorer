import { Search } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { Text } from '@penumbra-zone/ui/Text';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Pair, StarButton, starStore } from '@/features/star-pair';

export interface DefaultResultsProps {
  onSelect: (pair: Pair) => void;
}

export const DefaultResults = observer(({ onSelect }: DefaultResultsProps) => {
  const { pairs: starred } = starStore;

  if (!starred.length) {
    return (
      <div className='grow flex flex-col items-center justify-center gap-2 py-4 text-text-secondary'>
        <Search className='size-8' />
        <Text small>No results</Text>
      </div>
    );
  }

  return (
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
                    <AssetIcon metadata={base} size='lg' />
                  </div>
                  <div className='-ml-4'>
                    <AssetIcon metadata={quote} size='lg' />
                  </div>
                </>
              }
              onSelect={() => onSelect({ base, quote })}
            />
          ))}
        </div>
      </Dialog.RadioGroup>
    </div>
  );
});
