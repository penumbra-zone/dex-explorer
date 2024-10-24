import { useState } from 'react';
import { Button } from '@penumbra-zone/ui/Button';
import { OrderInput } from './order-input';
import SegmentedControl from './segmented-control';

export function OrderForm() {
  const [buyAmount, setBuyAmount] = useState(300);
  const [sellAmount, setSellAmount] = useState(400);

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
      <Button>Submit</Button>
    </div>
  );
}
