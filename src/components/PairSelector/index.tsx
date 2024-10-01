import { observer } from 'mobx-react-lite';
import { ArrowLeftRight } from 'lucide-react';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AssetSelector, AssetSelectorValue } from '@penumbra-zone/ui/AssetSelector';
import { Button } from '@penumbra-zone/ui/Button';
import { sharedStore } from '@/state/shared';

export interface PairSelectorProps {
  /** The `Metadata` or `BalancesResponse`, from which the swap should be initiated */
  from?: AssetSelectorValue;
  onFromChange?: (value?: AssetSelectorValue) => void;

  /** The `Metadata` or `BalancesResponse`, to which the swap should be made */
  to?: AssetSelectorValue;
  onToChange?: (value?: AssetSelectorValue) => void;

  /**
   * An array of `BalancesResponse` – protobuf message types describing the balance of an asset:
   * the account containing the asset, the value of this asset and its description (has `Metadata` inside it)
   */
  balances?: BalancesResponse[];
  dialogTitle?: string;
  disabled?: boolean;
}

export const PairSelector = observer(({
  balances,
  from,
  onFromChange,
  to,
  onToChange,
  disabled,
  dialogTitle,
}: PairSelectorProps) => {
  const { assets } = sharedStore;

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
