import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
// import { theme } from '@penumbra-zone/ui/src/PenumbraUIProvider/theme';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from './connect-button';
import { connectionStore } from '@/shared/state/connection';
import { Slider } from './slider';
import { InfoRow } from './info-row';

export const OrderForm = observer(() => {
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
        denominator='UM'
      />
      <OrderInput label='Pay with' value={sellAmount} onChange={setSellAmount} denominator='USDC' />
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
      {connected ? <Button actionType='accent'>Submit</Button> : <ConnectButton />}
    </div>
  );
});
