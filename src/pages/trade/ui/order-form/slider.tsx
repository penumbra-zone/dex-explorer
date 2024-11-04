import { observer } from 'mobx-react-lite';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { Text } from '@penumbra-zone/ui/Text';
import { OrderFormAsset } from './order-form-store';
import { theme } from '@penumbra-zone/ui/PenumbraUIProvider';

export const Slider = observer(({ asset, steps }: { asset: OrderFormAsset; steps: number }) => {
  return (
    <div className='mb-4'>
      <div className='mb-4'>
        <PenumbraSlider
          min={0}
          max={asset.balance}
          step={asset.balance ?? 1 / steps}
          defaultValue={asset.amount}
          showValue={false}
          onChange={asset.setAmount}
          focusedOutlineColor={theme.color.primary.main}
          showTrackGaps={true}
          trackGapBackground={theme.color.base.black}
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
