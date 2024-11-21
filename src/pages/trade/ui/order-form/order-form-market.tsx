import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { connectionStore } from '@/shared/model/connection';
import { OrderInput } from './order-input';
import { SegmentedControl } from './segmented-control';
import { ConnectButton } from '@/features/connect/connect-button';
import { Slider } from './slider';
import { InfoRow } from './info-row';
import { useOrderFormStore, Direction } from './order-form-store';

export const MarketOrderForm = observer(() => {
  const { connected } = connectionStore;
  const {
    baseAsset,
    quoteAsset,
    direction,
    setDirection,
    submitOrder,
    isLoading,
    gasFee,
    exchangeRate,
  } = useOrderFormStore();

  const isBuy = direction === Direction.Buy;

  return (
    <div className='p-4'>
      <SegmentedControl direction={direction} setDirection={setDirection} />
      <OrderInput
        label={direction}
        value={baseAsset.amount}
        onChange={baseAsset.setAmount as (amount: string, ...args: unknown[]) => void}
        min={0}
        max={1000}
        isEstimating={isBuy ? baseAsset.isEstimating : false}
        isApproximately={isBuy ? baseAsset.isApproximately : false}
        denominator={baseAsset.symbol}
      />
      <OrderInput
        label={isBuy ? 'Pay with' : 'Receive'}
        value={quoteAsset.amount}
        onChange={quoteAsset.setAmount as (amount: string, ...args: unknown[]) => void}
        isEstimating={isBuy ? false : quoteAsset.isEstimating}
        isApproximately={isBuy ? false : quoteAsset.isApproximately}
        denominator={quoteAsset.symbol}
      />
      <Slider steps={8} asset={isBuy ? quoteAsset : baseAsset} />
      <div className='mb-4'>
        <InfoRow
          label='Trading Fee'
          value='Free'
          valueColor='success'
          toolTip='On Penumbra, trading fees are completely free.'
        />
        <InfoRow
          label='Gas Fee'
          isLoading={gasFee === null}
          value={`${gasFee} ${baseAsset.symbol}`}
          valueColor='success'
          toolTip='Gas fees tooltip here.'
        />
      </div>
      <div className='mb-4'>
        {connected ? (
          <Button
            actionType='accent'
            disabled={isLoading || !baseAsset.amount || !quoteAsset.amount}
            onClick={submitOrder}
          >
            {direction} {baseAsset.symbol}
          </Button>
        ) : (
          <ConnectButton actionType='default' />
        )}
      </div>
      {exchangeRate !== null && (
        <div className='flex justify-center p-1'>
          <Text small color='text.secondary'>
            1 {baseAsset.symbol} ={' '}
            <Text small color='text.primary'>
              {exchangeRate} {quoteAsset.symbol}
            </Text>
          </Text>
        </div>
      )}
    </div>
  );
});
