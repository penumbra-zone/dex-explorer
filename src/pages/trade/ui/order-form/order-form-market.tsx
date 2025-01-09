import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { connectionStore } from '@/shared/model/connection';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from '@/features/connect/connect-button';
import { InfoRowGasFee } from './info-row-gas-fee';
import { InfoRowTradingFee } from './info-row-trading-fee';
import { OrderFormStore } from './store/OrderFormStore';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { InfoRow } from '@/pages/trade/ui/order-form/info-row';

interface SliderProps {
  inputValue: string;
  balance?: number;
  balanceDisplay?: string;
  setBalanceFraction: (fraction: number) => void;
}
const Slider = observer(
  ({ inputValue, balance, balanceDisplay, setBalanceFraction }: SliderProps) => {
    const value =
      inputValue && balance ? Math.round((Number(inputValue) / Number(balance)) * 10) : 0;

    return (
      <div className='mb-4'>
        <div className='mb-1'>
          <PenumbraSlider
            min={0}
            max={10}
            step={1}
            value={value}
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
              {balanceDisplay ?? '--'}
            </Text>
          </button>
        </div>
      </div>
    );
  },
);

export const MarketOrderForm = observer(({ parentStore }: { parentStore: OrderFormStore }) => {
  const { connected } = connectionStore;
  const store = parentStore.marketForm;

  const isBuy = store.direction === 'buy';

  return (
    <div className='p-4'>
      <SegmentedControl direction={store.direction} setDirection={store.setDirection} />
      {isBuy ? (
        <>
          <div className='mb-4'>
            <OrderInput
              label={'Pay with'}
              value={store.quoteInput}
              onChange={store.setQuoteInput}
              isEstimating={store.quoteEstimating}
              isApproximately={false}
              denominator={store.quoteAsset?.symbol}
            />
          </div>
          <div className='mb-4'>
            <OrderInput
              disabled
              label={'Buy'}
              value={store.baseInput}
              onChange={store.setBaseInput}
              isEstimating={store.baseEstimating}
              isApproximately={store.baseInputAmount !== 0}
              denominator={store.baseAsset?.symbol}
            />
          </div>
        </>
      ) : (
        <>
          <div className='mb-4'>
            <OrderInput
              label={'Sell'}
              value={store.baseInput}
              onChange={store.setBaseInput}
              isEstimating={store.baseEstimating}
              isApproximately={false}
              denominator={store.baseAsset?.symbol}
            />
          </div>
          <div className='mb-4'>
            <OrderInput
              disabled
              label={'Receive'}
              value={store.quoteInput}
              onChange={store.setQuoteInput}
              isEstimating={store.quoteEstimating}
              isApproximately={store.quoteInputAmount !== 0}
              denominator={store.quoteAsset?.symbol}
            />
          </div>
        </>
      )}
      <Slider
        inputValue={store.quoteInput}
        balance={store.quoteBalance}
        balanceDisplay={store.balance}
        setBalanceFraction={x => store.setBalanceFraction(x)}
      />
      <div className='mb-4'>
        <InfoRowTradingFee />
        <InfoRowGasFee
          gasFee={parentStore.gasFee.display}
          symbol={parentStore.gasFee.symbol}
          isLoading={parentStore.gasFeeLoading}
        />
        {store.priceImpact && (
          <InfoRow
            label='Price impact'
            value={store.priceImpact}
            toolTip='This percentage represents the effect of your trade on the token’s price'
          />
        )}
        {store.unfilled && (
          <InfoRow
            label='Unfilled amount'
            value={store.unfilled}
            toolTip='The portion of your trade that cannot be completed due to insufficient liquidity'
          />
        )}
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
