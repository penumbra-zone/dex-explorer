import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { connectionStore } from '@/shared/model/connection';
import { ConnectButton } from '@/features/connect/connect-button';
import { useSummary } from '../../model/useSummary';
import { OrderInput } from './order-input';
import { SelectGroup } from './select-group';
import { InfoRow } from './info-row';
import { InfoRowGasFee } from './info-row-gas-fee';
import { useOrderFormStore, FormType } from './store';
import {
  UpperBoundOptions,
  LowerBoundOptions,
  FeeTierOptions,
  MIN_POSITIONS,
  MAX_POSITIONS,
} from './store/range-liquidity';

export const RangeLiquidityOrderForm = observer(() => {
  const { connected } = connectionStore;
  const { baseAsset, quoteAsset, rangeLiquidity, submitOrder, isLoading, gasFee, exchangeRate } =
    useOrderFormStore(FormType.RangeLiquidity);
  const { data } = useSummary('1d');
  // const price = data && 'price' in data ? data.price : undefined;
  const price = 1;

  useEffect(() => {
    if (price) {
      rangeLiquidity.setMarketPrice(price);
    }
  }, [price, rangeLiquidity]);

  useEffect(() => {
    if (baseAsset && quoteAsset) {
      rangeLiquidity.setAssets(baseAsset, quoteAsset);
    }
  }, [baseAsset, quoteAsset, rangeLiquidity]);

  return (
    <div className='p-4'>
      <div className='mb-4'>
        <div className='mb-1'>
          <OrderInput
            label='Liquidity Target'
            value={rangeLiquidity.target}
            onChange={target => rangeLiquidity.setTarget(target)}
            denominator={quoteAsset.symbol}
          />
        </div>
        <div className='w-full flex flex-row flex-wrap items-center justify-between py-1'>
          <div className='leading-6'>
            <Text small color='text.secondary'>
              Available Balances
            </Text>
          </div>
          <div className='flex flex-wrap flex-col items-end'>
            <div>
              <Text small color='text.primary' whitespace='nowrap'>
                {baseAsset.balance} {baseAsset.symbol}
              </Text>
            </div>
            <button
              type='button'
              className='text-primary'
              onClick={
                connected ? () => rangeLiquidity.setTarget(quoteAsset.balance ?? 0) : undefined
              }
            >
              <Text small color='text.primary' whitespace='nowrap'>
                {quoteAsset.balance} {quoteAsset.symbol}
              </Text>
            </button>
          </div>
        </div>
      </div>
      <div className='mb-4'>
        <div className='mb-2'>
          <OrderInput
            label='Upper Price Bound'
            value={rangeLiquidity.upperBound}
            onChange={rangeLiquidity.setUpperBound}
            denominator={quoteAsset.symbol}
          />
        </div>
        <SelectGroup
          options={Object.values(UpperBoundOptions)}
          onChange={option => rangeLiquidity.setUpperBoundOption(option as UpperBoundOptions)}
        />
      </div>
      <div className='mb-4'>
        <div className='mb-2'>
          <OrderInput
            label='Lower Price Bound'
            value={rangeLiquidity.lowerBound}
            onChange={rangeLiquidity.setLowerBound}
            denominator={quoteAsset.symbol}
          />
        </div>
        <SelectGroup
          options={Object.values(LowerBoundOptions)}
          onChange={option => rangeLiquidity.setLowerBoundOption(option as LowerBoundOptions)}
        />
      </div>
      <div className='mb-4'>
        <div className='mb-2'>
          <OrderInput
            label='Fee tier'
            value={rangeLiquidity.feeTier}
            onChange={rangeLiquidity.setFeeTier}
            denominator='%'
          />
        </div>
        <SelectGroup
          value={rangeLiquidity.feeTier}
          options={Object.values(FeeTierOptions)}
          onChange={rangeLiquidity.setFeeTierOption as (option: string) => void}
        />
      </div>
      <div className='mb-4'>
        <OrderInput
          label='Number of positions'
          value={rangeLiquidity.positions === 0 ? '' : rangeLiquidity.positions}
          onChange={rangeLiquidity.setPositions}
        />
        <PenumbraSlider
          min={MIN_POSITIONS}
          max={MAX_POSITIONS}
          step={1}
          value={rangeLiquidity.positions}
          showValue={false}
          onChange={rangeLiquidity.setPositions}
          showTrackGaps={true}
          trackGapBackground='base.black'
          showFill={true}
        />
      </div>
      <div className='mb-4'>
        <InfoRow label='Number of positions' value={rangeLiquidity.positions} toolTip='' />
        <InfoRow
          label='Base asset amount'
          value={`${rangeLiquidity.baseAsset?.amount ?? 0} ${rangeLiquidity.baseAsset?.symbol}`}
          toolTip=''
        />
        <InfoRow
          label='Quote asset amount'
          value={`${rangeLiquidity.quoteAsset?.amount ?? 0} ${rangeLiquidity.quoteAsset?.symbol}`}
          toolTip=''
        />
        <InfoRowGasFee
          gasFee={rangeLiquidity.gasFee ?? 0}
          symbol={rangeLiquidity.baseAsset?.symbol}
        />
      </div>
      <div className='mb-4'>
        {connected ? (
          <Button actionType='accent' disabled={isLoading} onClick={submitOrder}>
            Open {rangeLiquidity.positions} Positions
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
