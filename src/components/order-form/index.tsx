import { OrderInput } from './order-input';

export function OrderForm() {
  return (
    <div>
      <OrderInput
        label='Buy'
        value={0}
        min={0}
        max={1000}
        isEstimating={true}
        isApproximately={true}
        onChange={() => {}}
        denominator='UM'
      />
      <OrderInput label='Pay with' value={400} denominator='USDC' />
    </div>
  );
}
