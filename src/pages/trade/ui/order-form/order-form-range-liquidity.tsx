import { observer } from 'mobx-react-lite';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { Slider as PenumbraSlider } from '@penumbra-zone/ui/Slider';
import { connectionStore } from '@/shared/model/connection';
import { OrderInput } from './order-input';
// import { SegmentedControl } from './segmented-control';
import { ConnectButton } from '@/features/connect/connect-button';
import { Slider } from './slider';
import { SelectGroup } from './select-group';
import { InfoRow } from './info-row';
import { useOrderFormStore, Direction } from './order-form-store';

export const RangeLiquidityOrderForm = observer(() => {
  const { connected } = connectionStore;
  const {
    baseAsset,
    quoteAsset,
    // rangeLiquidity,
    direction,
    setDirection,
    submitOrder,
    isLoading,
    gasFee,
    exchangeRate,
  } = useOrderFormStore();

  const rangeLiquidity = {
    setUpperBound: (amount: string) => {
      console.log('setUpperBound', amount);
    },
    setLowerBound: (amount: string) => {
      console.log('setUpperBound', amount);
    },
    setFeeTier: (feeTier: string) => {
      console.log('setFeeTier', feeTier);
    },
    setPositions: (positions: string) => {
      console.log('setPositions', positions);
    },
  };

  return (
    <div className='p-4'>
      <div className='mb-4'>
        <OrderInput
          label='Liquidity Amount'
          value={quoteAsset.amount}
          onChange={quoteAsset.setAmount as (amount: string, ...args: unknown[]) => void}
          denominator={quoteAsset.symbol}
        />
        <div className='flex flex-row items-center justify-between py-1'>
          <Text small color='text.secondary'>
            Available Balance
          </Text>
          <Text small color='text.primary'>
            {quoteAsset.balance} {quoteAsset.symbol}
          </Text>
        </div>
      </div>
      <OrderInput
        label='Upper bound'
        value={rangeLiquidity.upperBound}
        onChange={rangeLiquidity.setUpperBound}
        denominator={quoteAsset.symbol}
      />
      <SelectGroup
        value='+2%'
        options={['Market', '+2%', '+5%', '+10%', '+15%']}
        onChange={rangeLiquidity.setFeeTier}
      />
      <OrderInput
        label='Lower bound'
        value={rangeLiquidity.lowerBound}
        onChange={rangeLiquidity.setLowerBound}
        denominator={quoteAsset.symbol}
      />
      <SelectGroup
        value='-5%'
        options={['Market', '-2%', '-5%', '-10%', '-15%']}
        onChange={rangeLiquidity.setFeeTier}
      />
      <OrderInput
        label='Fee tier'
        value={rangeLiquidity.feeTier}
        onChange={rangeLiquidity.setFeeTier}
        denominator='%'
      />
      <SelectGroup
        value='-5%'
        options={['0.1%', '0.25%', '0.5%', '1.00%']}
        onChange={rangeLiquidity.setFeeTier}
      />
      <OrderInput
        label='Number of positions'
        value={rangeLiquidity.positions}
        onChange={rangeLiquidity.setPositions}
      />
      <PenumbraSlider
        min={2}
        max={20}
        step={2}
        defaultValue={rangeLiquidity.positions}
        showValue={false}
        onChange={rangeLiquidity.setPositions}
        showTrackGaps={true}
        trackGapBackground='base.black'
        showFill={true}
      />
      <div className='mb-4'>
        <InfoRow label='Number of positions' value={rangeLiquidity.positions} toolTip='' />
        <InfoRow label='Base asset amount' value={baseAsset.amount} toolTip='' />
        <InfoRow label='Quote asset amount' value={quoteAsset.amount} toolTip='' />
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
