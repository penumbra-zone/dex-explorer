import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { connectionStore } from '@/shared/model/connection';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from '@/features/connect/connect-button';
import { InfoRowGasFee } from './info-row-gas-fee';
import { InfoRowTradingFee } from './info-row-trading-fee';
import { useOrderFormStore } from './store/OrderFormStore';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';

interface SliderProps {
  balance?: string;
  setBalanceFraction: (fraction: number) => void;
}
const Slider = observer(({ balance, setBalanceFraction }: SliderProps) => {
  return (
    <div className='mb-4'>
      <div className='mb-1'>
        <PenumbraSlider
          min={0}
          max={10}
          step={1}
          value={0}
          showValue={false}
          onChange={x => setBalanceFraction(x / 10)}
          showTrackGaps={true}
          trackGapBackground='base.black'
          showFill={true}
        />
      </div>
      <div className='flex flex-row items-center justify-between py-1'>
        <Text small color='text.secondary'>
          Available Balance
        </Text>
        <button type='button' className='text-primary' onClick={() => setBalanceFraction(1.0)}>
          <Text small color='text.primary'>
            {balance ?? '--'}
          </Text>
        </button>
      </div>
    </div>
  );
});

export const MarketOrderForm = observer(() => {
  const { connected } = connectionStore;
  const parentStore = useOrderFormStore();
  const store = parentStore.marketForm;

  const isBuy = store.buySell === 'buy';

  return (
    <div className='p-4'>
      <SegmentedControl direction={store.buySell} setDirection={x => (store.buySell = x)} />
      <div className='mb-4'>
        <OrderInput
          label={isBuy ? 'Buy' : 'Sell'}
          value={store.baseInput}
          onChange={x => (store.baseInput = x)}
          isEstimating={store.baseEstimating}
          isApproximately={isBuy}
          denominator={store.baseAsset?.symbol}
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label={isBuy ? 'Pay with' : 'Receive'}
          value={store.quoteInput}
          onChange={x => (store.quoteInput = x)}
          isEstimating={store.quoteEstimating}
          isApproximately={!isBuy}
          denominator={store.quoteAsset?.symbol}
        />
      </div>
      <Slider balance={store.balance} setBalanceFraction={x => store.setBalanceFraction(x)} />
      <div className='mb-4'>
        <InfoRowTradingFee />
        <InfoRowGasFee gasFee={0} symbol={'UM'} />
      </div>
      <div className='mb-4'>
        {connected ? (
          <Button
            actionType='accent'
            disabled={!connected || !parentStore.canSubmit}
            onClick={() => {}}
          >
            {isBuy ? 'Buy' : 'Sell'} {store.baseAsset?.symbol}
          </Button>
        ) : (
          <ConnectButton actionType='default' />
        )}
      </div>
      {parentStore.marketPrice && (
        <div className='flex justify-center p-1'>
          <Text small color='text.secondary'>
            1 {store.baseAsset?.symbol} ={' '}
            <Text small color='text.primary'>
              {store.quoteAsset?.formatDisplayAmount(parentStore.marketPrice)}
            </Text>
          </Text>
        </div>
      )}
    </div>
  );
});
