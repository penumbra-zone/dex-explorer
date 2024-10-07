import { observer } from 'mobx-react-lite';
import { ArrowLeftRight } from 'lucide-react';
import { AssetSelector, AssetSelectorValue } from '@penumbra-zone/ui/AssetSelector';
import { Button } from '@penumbra-zone/ui/Button';
import { assetsStore } from '@/shared/state/assets';
import { balancesStore } from '@/shared/state/balances';

export interface PairSelectorProps {
  /** The `Metadata` or `BalancesResponse`, from which the swap should be initiated */
  from?: AssetSelectorValue;
  onFromChange?: (value?: AssetSelectorValue) => void;

  /** The `Metadata` or `BalancesResponse`, to which the swap should be made */
  to?: AssetSelectorValue;
  onToChange?: (value?: AssetSelectorValue) => void;

  dialogTitle?: string;
  disabled?: boolean;
}

export const PairSelector = observer(({
  from,
  onFromChange,
  to,
  onToChange,
  disabled,
  dialogTitle,
}: PairSelectorProps) => {
  const { assets } = assetsStore;
  const { balances } = balancesStore;

  const onSwap = () => {
    onFromChange?.(to);
    onToChange?.(from);
  };

  return (
    <div className="flex gap-2">
      <AssetSelector
        value={from}
        assets={assets}
        balances={balances}
        disabled={disabled}
        dialogTitle={dialogTitle}
        onChange={onFromChange}
      />

      <Button
        priority='primary'
        iconOnly
        icon={ArrowLeftRight}
        disabled={disabled}
        onClick={onSwap}
      >
        Swap
      </Button>

      <AssetSelector
        value={to}
        assets={assets}
        balances={balances}
        disabled={disabled}
        dialogTitle={dialogTitle}
        onChange={onToChange}
      />
    </div>
  );
});
