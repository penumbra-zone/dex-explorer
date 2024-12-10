import { useEffect } from 'react';
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
import { useOrderFormStore, FormType, Direction } from './store';
import { BuyLimitOrderOptions, SellLimitOrderOptions } from './store/limit-order';
import { useSummary } from '../../model/useSummary';

export const LimitOrderForm = observer(() => {
  const { connected } = connectionStore;
  const {
    baseAsset,
    quoteAsset,
    direction,
    setDirection,
    submitOrder,
    limitOrder,
    isLoading,
    gasFee,
    exchangeRate,
  } = useOrderFormStore(FormType.Limit);
  const { data } = useSummary('1d');
  const price = data && 'price' in data ? data.price : undefined;

  const isBuy = direction === Direction.Buy;

  useEffect(() => {
    if (price) {
      limitOrder.setMarketPrice(price);
    }
  }, [price, limitOrder]);

  useEffect(() => {
    if (quoteAsset.exponent && baseAsset.exponent) {
      limitOrder.setExponent(quoteAsset.exponent - baseAsset.exponent);
    }
  }, [baseAsset.exponent, quoteAsset.exponent, limitOrder]);

  return (
    <div className='p-4'>
      <SegmentedControl direction={direction} setDirection={setDirection} />
      <div className='mb-4'>
        <div className='mb-2'>
          <OrderInput
            label={`When ${baseAsset.symbol} is`}
            value={limitOrder.price}
            onChange={limitOrder.setPrice}
            denominator={quoteAsset.symbol}
          />
        </div>
        <SelectGroup
          options={Object.values(isBuy ? BuyLimitOrderOptions : SellLimitOrderOptions)}
          onChange={option =>
            isBuy
              ? limitOrder.setBuyLimitPriceOption(option as BuyLimitOrderOptions)
              : limitOrder.setSellLimitPriceOption(option as SellLimitOrderOptions)
          }
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label={direction}
          value={baseAsset.amount}
          onChange={amount => baseAsset.setAmount(amount)}
          min={0}
          max={1000}
          isEstimating={isBuy ? baseAsset.isEstimating : false}
          isApproximately={isBuy}
          denominator={baseAsset.symbol}
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label={isBuy ? 'Pay with' : 'Receive'}
          value={quoteAsset.amount}
          onChange={amount => quoteAsset.setAmount(amount)}
          isEstimating={isBuy ? false : quoteAsset.isEstimating}
          isApproximately={!isBuy}
          denominator={quoteAsset.symbol}
        />
      </div>
      <div className='mb-4'>
        <InfoRowTradingFee />
        <InfoRowGasFee gasFee={gasFee} symbol={baseAsset.symbol} />
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
