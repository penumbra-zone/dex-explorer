import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from './connect-button';
import { connectionStore } from '@/shared/state/connection';
import { usePathToMetadata } from '@/shared/usePagePath';
import { Slider } from './slider';
import { InfoRow } from './info-row';
import { orderFormStore, Direction } from './order-form-state';
import { useBalances } from '@/shared/state/balances';

const useOrderFormStore = () => {
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { data: balances } = useBalances();
  const { setAssets, setBalances } = orderFormStore;

  useEffect(() => {
    if (baseAsset && quoteAsset) {
      setAssets(baseAsset, quoteAsset);
    }
  }, [baseAsset, quoteAsset, setAssets]);

  useEffect(() => {
    if (balances) {
      setBalances(balances);
    }
  }, [balances, setBalances]);

  return orderFormStore;
};

export const OrderForm = observer(() => {
  const { connected } = connectionStore;
  const { baseAsset, quoteAsset, direction, setDirection, submitOrder, isLoading } =
    useOrderFormStore();
  console.log('TCL: OrderForm -> baseAsset', baseAsset);
  console.log('TCL: OrderForm -> quoteAsset', quoteAsset);

  return (
    <div>
      <SegmentedControl direction={direction} setDirection={setDirection} />
      <OrderInput
        label={direction}
        value={baseAsset.amount}
        onChange={baseAsset.setAmount}
        min={0}
        max={1000}
        // isEstimating={true}
        // isApproximately={true}
        denominator={baseAsset.symbol}
      />
      <OrderInput
        label={direction === Direction.Buy ? 'Pay with' : 'Receive'}
        value={quoteAsset.amount}
        onChange={quoteAsset.setAmount}
        denominator={quoteAsset.symbol}
      />
      {/* <Slider /> */}
      <div className='mb-4'>
        <InfoRow
          label='Trading Fee'
          value='Free'
          valueColor='success'
          toolTip='On Penumbra, trading fees are completely free.'
        />
        <InfoRow
          label='Gas Fee'
          isLoading={true}
          value='Free'
          valueColor='success'
          toolTip='Gas fees tooltip here.'
        />
      </div>
      {connected ? (
        <Button actionType='accent' disabled={isLoading} onClick={submitOrder}>
          {direction} {baseAsset.symbol}
        </Button>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
});
