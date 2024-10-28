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
import { orderFormStore } from './order-form-state';

const useOrderFormStore = () => {
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { setAssetIn, setAssetOut } = orderFormStore;

  useEffect(() => {
    if (baseAsset && quoteAsset) {
      setAssetIn(baseAsset);
      setAssetOut(quoteAsset);
    }
  }, [baseAsset, quoteAsset, setAssetIn, setAssetOut]);

  return orderFormStore;
};

export const OrderForm = observer(() => {
  const { connected } = connectionStore;
  const {
    assetIn,
    assetOut,
    assetInAmount,
    assetOutAmount,
    setAssetInAmount,
    setAssetOutAmount,
    direction,
    setDirection,
    submitOrder,
    isLoading,
  } = useOrderFormStore();

  return (
    <div>
      <SegmentedControl direction={direction} setDirection={setDirection} />
      <OrderInput
        label={direction}
        value={assetOutAmount}
        onChange={setAssetInAmount}
        min={0}
        max={1000}
        // isEstimating={true}
        isApproximately={true}
        denominator={assetOut?.symbol ?? ''}
      />
      <OrderInput
        label='Pay with'
        value={assetInAmount}
        onChange={setAssetOutAmount}
        denominator={assetIn?.symbol ?? ''}
      />
      <Slider />
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
          {direction} {assetOut?.symbol ?? ''}
        </Button>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
});
