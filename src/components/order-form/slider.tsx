import { observer } from 'mobx-react-lite';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { Text } from '@penumbra-zone/ui/Text';
import { OrderFormAsset } from './order-form-state';

export const Slider = observer(({ asset, steps }: { asset: OrderFormAsset; steps: number }) => {
  return (
    <div className='mb-4'>
      <div className='mb-4'>
        <PenumbraSlider
          min={0}
          max={asset.balance}
          step={asset.balance / steps}
          defaultValue={asset.amount}
          showValue={false}
          onChange={asset.setAmount}
          focusedOutlineColor='#BA4D14'
          showTrackGaps={true}
          trackGapBackground='#0D0D0D'
          showFill={true}
        />
      </div>
      <div className='flex flex-row items-center justify-between'>
        <Text small color={color => color.text.secondary}>
          Available Balance
        </Text>
        <Text small color={color => color.text.primary}>
          {asset.balance} {asset.symbol}
        </Text>
      </div>
    </div>
  );
});