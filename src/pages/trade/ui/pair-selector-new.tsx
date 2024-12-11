'use client';

import { observer } from 'mobx-react-lite';
import { ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getMetadataFromBalancesResponse } from '@penumbra-zone/getters/balances-response';
import {
  AssetSelector,
  AssetSelectorValue,
  isBalancesResponse,
  isMetadata,
} from '@penumbra-zone/ui/AssetSelector';
import { Dialog } from '@penumbra-zone/ui/Dialog';
import { Button } from '@penumbra-zone/ui/Button';
import { useAssets } from '@/shared/api/assets';
import { useBalances } from '@/shared/api/balances';
import { PagePath } from '@/shared/const/pages.ts';
import { usePathToMetadata } from '../model/use-path.ts';
import { Skeleton } from '@/shared/ui/skeleton';
import { Density } from '@penumbra-zone/ui/Density';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Text } from '@penumbra-zone/ui/Text';
import { TextInput } from '@penumbra-zone/ui/TextInput';
import { StarButton } from '@/features/star-pair';

const handleRouting = ({
  router,
  baseAsset,
  quoteAsset,
}: {
  router: ReturnType<typeof useRouter>;
  baseAsset: AssetSelectorValue | undefined;
  quoteAsset: AssetSelectorValue | undefined;
}) => {
  if (!baseAsset || !quoteAsset) {
    throw new Error('Url malformed');
  }

  let primarySymbol: string;
  let numeraireSymbol: string;

  // TODO: Create new getter in /web repo
  if (isMetadata(baseAsset)) {
    primarySymbol = baseAsset.symbol;
  } else if (isBalancesResponse(baseAsset)) {
    primarySymbol = getMetadataFromBalancesResponse(baseAsset).symbol;
  } else {
    throw new Error('unrecognized metadata for primary asset');
  }

  if (isMetadata(quoteAsset)) {
    numeraireSymbol = quoteAsset.symbol;
  } else if (isBalancesResponse(quoteAsset)) {
    numeraireSymbol = getMetadataFromBalancesResponse(quoteAsset).symbol;
  } else {
    throw new Error('unrecognized metadata for numeraireSymbol asset');
  }

  router.push(`${PagePath.Trade}/${primarySymbol}/${numeraireSymbol}`);
};

export interface PairSelectorProps {
  disabled?: boolean;
}

export const PairSelector = observer(({ disabled }: PairSelectorProps) => {
  const router = useRouter();
  const { data: assets } = useAssets();
  const { data: balances } = useBalances();
  const { baseAsset, quoteAsset, error, isLoading } = usePathToMetadata();

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

      <Dialog>
        <Dialog.Trigger asChild>
          <button type='button' className='flex items-center gap-1 cursor-pointer'>
            <div className='z-10'>
              <AssetIcon metadata={baseAsset} size='lg'/>
            </div>
            <div className='-ml-4'>
              <AssetIcon metadata={quoteAsset} size='lg'/>
            </div>

            <Text body>
              {baseAsset.symbol}/{quoteAsset.symbol}
            </Text>

            <i className='flex size-6 items-center justify-center p-1'>
              <ChevronDown/>
            </i>
          </button>
        </Dialog.Trigger>

        <Dialog.Content title='Select pair'>
          <Density sparse>
            <div className='flex items-center gap-2 pt-[2px] [&>label]:grow'>
              <TextInput placeholder="Base asset" endAdornment={<Search/>}/>
              <Text body color='text.primary'>/</Text>
              <TextInput placeholder="Quote asset" endAdornment={<Search/>}/>
            </div>
          </Density>
        </Dialog.Content>
      </Dialog>
    </div>
  );
});
