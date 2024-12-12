import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { connectionStore } from '@/shared/model/connection';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from '@/features/connect/connect-button';
import { InfoRowTradingFee } from './info-row-trading-fee';
import { InfoRowGasFee } from './info-row-gas-fee';
import { SelectGroup } from './select-group';
import { useOrderFormStore } from './store/OrderFormStore';

const BUY_PRICE_OPTIONS: Record<string, (mp: number) => number> = {
  Market: (mp: number) => mp,
  '-2%': mp => 0.98 * mp,
  '-5%': mp => 0.95 * mp,
  '-10%': mp => 0.9 * mp,
  '-15%': mp => 0.85 * mp,
};

const SELL_PRICE_OPTIONS: Record<string, (mp: number) => number> = {
  Market: (mp: number) => mp,
  '+2%': mp => 1.02 * mp,
  '+5%': mp => 1.05 * mp,
  '+10%': mp => 1.1 * mp,
  '+15%': mp => 1.15 * mp,
};

export const LimitOrderForm = observer(() => {
  const { connected } = connectionStore;
  const parentStore = useOrderFormStore();
  const store = parentStore.limitForm;

  const isBuy = store.buySell === 'buy';
  const priceOptions = isBuy ? BUY_PRICE_OPTIONS : SELL_PRICE_OPTIONS;

  return (
    <div className='p-4'>
      <SegmentedControl direction={store.buySell} setDirection={x => (store.buySell = x)} />
      <div className='mb-4'>
        <div className='mb-2'>
          <OrderInput
            label={`When ${store.baseAsset?.symbol} is`}
            value={store.priceInput}
            onChange={x => (store.priceInput = x)}
            denominator={store.quoteAsset?.symbol}
          />
        </div>
        <SelectGroup
          options={Object.keys(priceOptions)}
          onChange={o =>
            (store.priceInput = (priceOptions[o] ?? (x => x))(store.marketPrice).toString())
          }
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label={isBuy ? 'Buy' : 'Sell'}
          value={store.baseInput}
          onChange={x => (store.baseInput = x)}
          denominator={store.baseAsset?.symbol}
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label={isBuy ? 'Pay with' : 'Receive'}
          value={store.quoteInput}
          onChange={x => (store.quoteInput = x)}
          denominator={store.quoteAsset?.symbol}
        />
      </div>
      <div className='mb-4'>
        <InfoRowTradingFee />
        <InfoRowGasFee
          gasFee={parentStore.gasFee.display}
          symbol={parentStore.gasFee.symbol}
          isLoading={parentStore.gasFeeLoading}
        />
      </div>
      <div className='mb-4'>
        {connected ? (
          <Button
            actionType='accent'
            disabled={!parentStore.canSubmit}
            onClick={() => void parentStore.submit()}
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
