import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { connectionStore } from '@/shared/model/connection';
import { useBalances } from '@/shared/api/balances';
import { usePathToMetadata } from '../../model/use-path-to-metadata';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from './connect-button';
import { Slider } from './slider';
import { InfoRow } from './info-row';
import { orderFormStore, Direction } from './order-form-store';

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

  return (
    <div>
      <SegmentedControl direction={direction} setDirection={setDirection} />
      <OrderInput
        label={direction}
        value={baseAsset.amount}
        onChange={baseAsset.setAmount}
        min={0}
        max={1000}
        isEstimating={baseAsset.isEstimating}
        isApproximately={baseAsset.isApproximately}
        denominator={baseAsset.symbol}
      />
      <OrderInput
        label={direction === Direction.Buy ? 'Pay with' : 'Receive'}
        value={quoteAsset.amount}
        onChange={quoteAsset.setAmount}
        isEstimating={quoteAsset.isEstimating}
        isApproximately={quoteAsset.isApproximately}
        denominator={quoteAsset.symbol}
      />
      <Slider steps={8} asset={quoteAsset} />
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
