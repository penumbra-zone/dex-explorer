import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from './connect-button';
import { connectionStore } from '@/shared/state/connection';
import { usePathToMetadata } from '@/shared/usePagePath';
import { Slider } from './slider';
import { InfoRow } from './info-row';

export const OrderForm = observer(() => {
  const { baseAsset, quoteAsset } = usePathToMetadata();
  console.log('TCL: OrderForm -> baseAsset', baseAsset);
  const { connected } = connectionStore;
  const [buyAmount, setBuyAmount] = useState(300);
  const [sellAmount, setSellAmount] = useState(400);
  const [sliderValue, setSliderValue] = useState(500);

  return (
    <div>
      <SegmentedControl />
      <OrderInput
        label='Buy'
        value={buyAmount}
        onChange={setBuyAmount}
        min={0}
        max={1000}
        // isEstimating={true}
        isApproximately={true}
        denominator={baseAsset?.symbol ?? ''}
      />
      <OrderInput
        label='Pay with'
        value={sellAmount}
        onChange={setSellAmount}
        denominator={quoteAsset?.symbol ?? ''}
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
        <Button actionType='accent'>Buy {baseAsset?.symbol ?? ''}</Button>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
});
