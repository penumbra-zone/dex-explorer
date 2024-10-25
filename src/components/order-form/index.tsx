import { useState } from 'react';
import { Button } from '@penumbra-zone/ui/Button';
import { Slider } from '@penumbra-zone/ui/Slider';
import { Text } from '@penumbra-zone/ui/Text';
// import { theme } from '@penumbra-zone/ui/src/PenumbraUIProvider/theme';
import { OrderInput } from './order-input';
import SegmentedControl from './segmented-control';

export function OrderForm() {
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
      <Slider
        min={0}
        max={1000}
        step={100}
        defaultValue={sliderValue}
        showValue={false}
        onChange={setSliderValue}
        focusedOutlineColor='#BA4D14'
        showTrackGaps={true}
        trackGapBackground='#FAFAFA'
        showFill={true}
      />
      <div className='flex flex-row items-center justify-between'>
        <Text small>Available Balance</Text>
        <Text small>{sliderValue}</Text>
      </div>
      <Button>Submit</Button>
    </div>
  );
}
