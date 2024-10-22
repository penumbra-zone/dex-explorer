'use client';

import { observer } from 'mobx-react-lite';
import { ArrowLeftRight } from 'lucide-react';
import { AssetSelector, AssetSelectorValue } from '@penumbra-zone/ui/AssetSelector';
import { Button } from '@penumbra-zone/ui/Button';
import { useAssets } from '@/shared/state/assets';
import { useBalances } from '@/shared/state/balances';
import { useRouter } from 'next/navigation';
import { PagePath } from '@/shared/pages.ts';
import { getMetadataFromBalancesResponse } from '@penumbra-zone/getters/balances-response';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const isMetadata = (val: AssetSelectorValue): val is Metadata => {
  return val.getType().typeName === 'penumbra.core.asset.v1.Metadata';
};

const isBalResponse = (val: AssetSelectorValue): val is BalancesResponse => {
  return val.getType().typeName === 'penumbra.view.v1.BalancesResponse';
};

const handleRouting = ({
  router,
  primary,
  numeraire,
}: {
  router: AppRouterInstance;
  primary: AssetSelectorValue | undefined;
  numeraire: AssetSelectorValue | undefined;
}) => {
  if (!primary || !numeraire) {
    throw new Error('Url malformed');
  }

  let primarySymbol: string;
  let numeraireSymbol: string;

  // TODO: Create new getter in /web repo
  if (isMetadata(primary)) {
    primarySymbol = primary.symbol;
  } else if (isBalResponse(primary)) {
    primarySymbol = getMetadataFromBalancesResponse(primary).symbol;
  } else {
    throw new Error('unrecognized metadata for primary asset');
  }

  if (isMetadata(numeraire)) {
    numeraireSymbol = numeraire.symbol;
  } else if (isBalResponse(numeraire)) {
    numeraireSymbol = getMetadataFromBalancesResponse(numeraire).symbol;
  } else {
    throw new Error('unrecognized metadata for numeraireSymbol asset');
  }

  router.push(`${PagePath.Trade}/${primarySymbol}/${numeraireSymbol}`);
};

export interface PairSelectorProps {
  primary: AssetSelectorValue;
  numeraire: AssetSelectorValue;
  dialogTitle?: string;
  disabled?: boolean;
}

export const PairSelector = observer(
  ({ primary, numeraire, disabled, dialogTitle }: PairSelectorProps) => {
    const router = useRouter();

    const { data: assets } = useAssets();
    const { data: balances } = useBalances();

    return (
      <div className='flex gap-2'>
        <AssetSelector
          value={primary}
          assets={assets}
          balances={balances}
          disabled={disabled}
          dialogTitle={dialogTitle}
          onChange={val => handleRouting({ router, primary: val, numeraire })}
        />

        <Button
          priority='primary'
          iconOnly
          icon={ArrowLeftRight}
          disabled={disabled}
          onClick={() => handleRouting({ router, primary: numeraire, numeraire: primary })}
        >
          Swap
        </Button>

        <AssetSelector
          value={numeraire}
          assets={assets}
          balances={balances}
          disabled={disabled}
          dialogTitle={dialogTitle}
          onChange={val => handleRouting({ router, primary, numeraire: val })}
        />
      </div>
    );
  },
);
