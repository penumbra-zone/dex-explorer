import Image from 'next/image';
import cn from 'clsx';
import { Dialog } from '@penumbra-zone/ui/dialog';
import { Icon } from '@penumbra-zone/ui/Icon';
import { TextInput } from '@penumbra-zone/ui/TextInput';
import { Text } from '@penumbra-zone/ui/Text';
import { Check, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@penumbra-zone/ui/Button';

interface Asset {
  symbol: string;
  amount: number;
  imgUrl: string;
  percentage: number;
}
const Asset = ({
  asset,
  isSelected,
  onClick,
}: {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={cn('flex w-full gap-3 p-3 rounded-md', {
        'bg-action-hoverOverlay': isSelected,
        'hover:bg-action-hoverOverlay': !isSelected,
      })}
      onClick={onClick}
    >
      <Image src={asset.imgUrl} alt={asset.symbol} width={32} height={32} />
      <div className='flex w-full flex-col gap-1'>
        <div className='flex w-full justify-between'>
          <Text technical color='text.primary'>
            {asset.symbol}
          </Text>
          <Text technical color='text.secondary'>
            {asset.percentage ? `${asset.percentage}%` : ''}
          </Text>
        </div>
        <div className='flex w-full h-[6px] bg-other-tonalStroke rounded-full relative'>
          <div
            className='h-full bg-neutral-light rounded-full absolute left-0 top-0'
            style={{ width: `${asset.percentage}%` }}
          />
        </div>
      </div>
    </button>
  );
};

export const VotingDialog = ({
  isOpen,
  onClose,
  epoch,
}: {
  isOpen: boolean;
  onClose: () => void;
  epoch: number;
}) => {
  const [value, setValue] = useState('');
  const handleChange = (newValue: string) => setValue(newValue);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [reveal, setReveal] = useState(false);

  const assets = [
    {
      symbol: 'USDC',
      amount: 5000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
      percentage: 50,
    },
    {
      symbol: 'OSMO',
      amount: 4000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
      percentage: 3,
    },
    {
      symbol: 'BTC',
      amount: 3000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
      percentage: 2,
    },
    {
      symbol: 'ATOM',
      amount: 2000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
      percentage: 1,
    },
    {
      symbol: 'XRP',
      amount: 1000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
      percentage: 0,
    },
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <Dialog.Content title={`Vote in Epoch ${epoch}`}>
        <div className='pt-1'>
          <TextInput
            startAdornment={<Icon size='sm' IconComponent={Search} color='text.primary' />}
            value={value}
            onChange={handleChange}
            placeholder='Search...'
          />
        </div>
        <Text small color='text.secondary'>
          Select Asset
        </Text>
        <div className='flex flex-col gap-1'>
          {assets.map(asset => (
            <Asset
              key={asset.symbol}
              asset={asset}
              isSelected={selectedAsset?.symbol === asset.symbol}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
        <div className='flex-shrink-0'>
          <Button actionType='accent' disabled={!selectedAsset}>
            {selectedAsset ? 'Vote' : 'Select asset to vote'}
          </Button>
        </div>
        <button className='flex justify-center gap-3' onClick={() => setReveal(!reveal)}>
          <div
            className={cn('flex w-5 h-5 rounded-xs justify-center items-center', {
              'bg-primary-main': reveal,
              'bg-neutral-main': !reveal,
            })}
          >
            <Icon
              IconComponent={Check}
              color={reveal ? 'text.primary' : 'neutral.main'}
              size='md'
            />
          </div>
          <Text small color={reveal ? 'text.primary' : 'text.secondary'}>
            Reveal my vote to the leaderboard
          </Text>
        </button>
      </Dialog.Content>
    </Dialog>
  );
};
