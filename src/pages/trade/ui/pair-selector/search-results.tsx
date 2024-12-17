import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Text } from '@penumbra-zone/ui/Text';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Button } from '@penumbra-zone/ui/Button';
import { useAssets } from '@/shared/api/assets';

export interface SearchResultsProps {
  onSelect: (asset: Metadata) => void;
  onClear: VoidFunction;
}

export const SearchResults = ({ onSelect, onClear }: SearchResultsProps) => {
  const { data: assets } = useAssets();

  return (
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
                onSelect={() => onSelect(asset)}
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
};
