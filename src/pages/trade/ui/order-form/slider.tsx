import { observer } from 'mobx-react-lite';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { Text } from '@penumbra-zone/ui/Text';
import { OrderFormAsset } from './order-form-store';

export const Slider = observer(({ asset, steps }: { asset: OrderFormAsset; steps: number }) => {
  console.log('TCL: Slider -> steps', steps);
  console.log('TCL: Slider -> asset', asset);
  console.log('TCL: Slider -> asset', asset.balance ?? 1);
  return (
    <div className='mb-4'>
      <div className='mb-1'>
        <PenumbraSlider
          min={0}
          max={asset.balance ?? 10}
          step={asset.balance ? asset.balance / steps : 1}
          defaultValue={asset.amount}
          showValue={false}
          onChange={asset.setAmount}
          focusedOutlineColor='primary.main'
          showTrackGaps={true}
          // trackGapBackground='base.black'
          showFill={true}
        />
      </div>
      <div className='flex flex-row items-center justify-between py-1'>
        <Text small color='text.secondary'>
          Available Balance
        </Text>
        <Text small color='text.primary'>
          {asset.balance} {asset.symbol}
        </Text>
      </div>
    </div>
  );
});
