import { observer } from 'mobx-react-lite';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Text } from '@penumbra-zone/ui/Text';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Button } from '@penumbra-zone/ui/Button';
import { useAssets } from '@/shared/api/assets';
import { recentPairsStore } from './store';

export interface SearchResultsProps {
  onSelect: (asset: Metadata) => void;
  onClear: VoidFunction;
  search?: string;
}

const useFilteredAssets = (assets: Metadata[], search: string) => {
  const sortedAssets = assets.sort((a, b) => Number(b.priorityScore - a.priorityScore));
  return sortedAssets.filter(asset => {
    return (
      asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
      asset.description.toLowerCase().includes(search.toLowerCase())
    );
  });
};

export const SearchResults = observer(({ onSelect, onClear, search }: SearchResultsProps) => {
  const { recent, add } = recentPairsStore;
  const { data: assets } = useAssets();
  const filtered = useFilteredAssets(assets ?? [], search ?? '');

  const onClick = (asset: Metadata) => {
    add(asset);
    onSelect(asset);
  };

  return (
    <>
      {!search && !!recent.length && (
        <div className='flex flex-col gap-2 text-text-secondary'>
          <Text small>Recent</Text>
          <Dialog.RadioGroup>
            <div className='flex flex-col gap-1'>
              {recent.map(asset => (
                <Dialog.RadioItem
                  key={asset.symbol}
                  value={asset.symbol}
                  startAdornment={<AssetIcon metadata={asset} size='lg' />}
                  title={
                    <div className={asset.name ? '' : 'h-10 flex items-center'}>
                      <Text color='text.primary'>{asset.symbol}</Text>
                    </div>
                  }
                  description={
                    asset.name && (
                      <div className='-mt-2'>
                        <Text detail color='text.secondary'>
                          {asset.name}
                        </Text>
                      </div>
                    )
                  }
                  onSelect={() => onClick(asset)}
                />
              ))}
            </div>
          </Dialog.RadioGroup>
        </div>
      )}

      <div className='flex flex-col gap-2 text-text-secondary'>
        <Text small>Search results</Text>
        <Dialog.RadioGroup>
          <div className='flex flex-col gap-1'>
            {filtered.map(asset => (
              <Dialog.RadioItem
                key={asset.symbol}
                value={asset.symbol}
                startAdornment={<AssetIcon metadata={asset} size='lg' />}
                title={
                  <div className={asset.name ? '' : 'h-10 flex items-center'}>
                    <Text color='text.primary'>{asset.symbol}</Text>
                  </div>
                }
                description={
                  asset.name && (
                    <div className='-mt-2'>
                      <Text detail color='text.secondary'>
                        {asset.name}
                      </Text>
                    </div>
                  )
                }
                onSelect={() => onClick(asset)}
              />
            ))}
          </div>
        </Dialog.RadioGroup>
      </div>

      <div className='sticky bottom-0 w-full rounded-sm z-10 backdrop-blur-lg'>
        <Button onClick={onClear} priority='primary'>
          Clear
        </Button>
      </div>
    </>
  );
});
