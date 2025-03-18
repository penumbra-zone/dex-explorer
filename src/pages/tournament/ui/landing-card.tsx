import Image from 'next/image';
import { Text } from '@penumbra-zone/ui/Text';
import { pnum } from '@penumbra-zone/types/pnum';
import { round } from '@penumbra-zone/types/round';
import { observer } from 'mobx-react-lite';
import { connectionStore } from '@/shared/model/connection';
import { Button } from '@penumbra-zone/ui/Button';
import { WalletMinimal, Coins, Wallet2, ExternalLink, Ban } from 'lucide-react';

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className='relative p-[1px]'>
    <div className='absolute z-10 top-0 left-0 bottom-0 right-0 rounded-xl [background:linear-gradient(110deg,rgba(186,77,20,1),rgba(186,77,20,0),rgba(34,99,98,0),rgba(34,99,98,1))]' />
    <div className='absolute z-20 top-1 left-1 bottom-1 right-1 rounded-xl bg-base-blackAlt' />
    <div className='relative z-30 flex flex-col gap-4 rounded-xl p-3 backdrop-blur-lg [background:linear-gradient(110deg,rgba(186,77,20,0.2)_0%,rgba(34,99,98,0.1)_75%)]'>
      {children}
    </div>
  </div>
);

export const LandingCard = observer(() => {
  const { connected } = connectionStore;
  const epoch = 123;
  const poolDelegators = 2000;
  const poolLPs = 8000;
  const poolAmount = poolLPs + poolDelegators;
  const symbol = 'UM';

  const isBanned = false;

  const results = [
    {
      symbol: 'USDC',
      amount: 5000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
    },
    {
      symbol: 'OSMO',
      amount: 4000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
    },
    {
      symbol: 'BTC',
      amount: 3000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
    },
    {
      symbol: 'ATOM',
      amount: 2000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
    },
    {
      symbol: 'XRP',
      amount: 1000,
      imgUrl:
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
    },
  ];

  return (
    <Card>
      <div className='flex gap-12 p-12'>
        <div className='flex flex-col w-1/2 gap-12'>
          <Text variant='h1' color='text.primary'>
            Liquidity Tournament
          </Text>
          <div className='flex flex-col gap-10'>
            <div className='flex gap-2 items-start'>
              <Image
                src='/assets/lqt-delegators.svg'
                alt='Delegators'
                width={64}
                height={64}
                className='mr-6'
              />
              <div className='flex flex-col gap-2'>
                <Text variant='large' color='text.primary'>
                  Delegators
                </Text>
                <Text variant='small' color='text.secondary'>
                  Stake UM to vote on which assets should receive incentives. Earn rewards for
                  participating, regardless of their vote choice.
                </Text>
              </div>
            </div>
            <div className='flex gap-2 items-start'>
              <Image
                src='/assets/lqt-lps.svg'
                alt='Liquidity Providers'
                width={64}
                height={64}
                className='mr-6'
              />
              <div className='flex flex-col gap-2'>
                <Text variant='large' color='text.primary'>
                  Liquidity Providers
                </Text>
                <Text variant='small' color='text.secondary'>
                  Provide liquidity on Penumbra Veil to facilitate trading. Earn rewards from trade
                  volume in LPs that hold voted assets.
                </Text>
              </div>
            </div>
            <div className='flex gap-2 items-start'>
              <Image
                src='/assets/lqt-rewards.svg'
                alt='Automatic Rewards Distribution'
                width={64}
                height={64}
                className='mr-6'
              />
              <div className='flex flex-col gap-2'>
                <Text variant='large' color='text.primary'>
                  Automatic Rewards Distribution
                </Text>
                <Text variant='small' color='text.secondary'>
                  Delegators receive rewards directly to the balance, and Liquidity Providers get
                  rewards in LP reserves and withdraw when managing positions.
                </Text>
              </div>
            </div>
          </div>
        </div>
        <div className='w-[1px] bg-other-tonalStroke' />
        <div className='flex flex-col w-1/2 gap-8'>
          <div className='flex justify-between'>
            <Text variant='h3' color='text.primary'>
              Current Epoch
            </Text>
            <div className='rounded-sm bg-base-blackAlt px-2'>
              <div className='font-default text-text2xl font-medium leading-text2xl text-transparent bg-clip-text [background-image:linear-gradient(90deg,rgb(244,156,67),rgb(83,174,168))]'>
                #{epoch}
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex justify-between'>
              <Text strong color='text.primary'>
                Incentive Pool
              </Text>
              <Text technical color='text.primary'>
                {pnum(poolAmount).toFormattedString()} {symbol}
              </Text>
            </div>
            <div className='flex w-full h-[6px] bg-base-blackAlt rounded-full justify-between'>
              <div
                className='h-[6px] bg-primary-light rounded-l-full'
                style={{ width: `calc(${(poolLPs / poolAmount) * 100}% - 1px)` }}
              />
              <div
                className='h-[6px] bg-secondary-light rounded-r-full'
                style={{ width: `${(poolDelegators / poolAmount) * 100}%` }}
              />
            </div>
            <div className='flex justify-between'>
              <div className='flex gap-2'>
                <Text technical color='text.primary'>
                  LPs
                </Text>
                <Text technical color='primary.light'>
                  {pnum(poolLPs).toFormattedString()} {symbol}
                </Text>
                <Text technical color='text.secondary'>
                  {round({ value: (poolLPs / poolAmount) * 100, decimals: 0 })}%
                </Text>
              </div>
              <div className='flex gap-2'>
                <Text technical color='text.primary'>
                  Delegators
                </Text>
                <Text technical color='secondary.light'>
                  {pnum(poolDelegators).toFormattedString()} {symbol}
                </Text>
                <Text technical color='text.secondary'>
                  {round({ value: (poolDelegators / poolAmount) * 100, decimals: 0 })}%
                </Text>
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-4'>
            <Text strong color='text.primary'>
              Current Results
            </Text>
            {results.map(asset => (
              <div key={asset.symbol} className='flex gap-3'>
                <img src={asset.imgUrl} alt={asset.symbol} width={32} height={32} />
                <div className='flex w-full flex-col gap-2'>
                  <div className='flex justify-between w-full'>
                    <Text technical color='text.primary'>
                      {asset.symbol}
                    </Text>
                    <Text technical color='text.secondary'>
                      {round({ value: (asset.amount / poolAmount) * 100, decimals: 0 })}%
                    </Text>
                  </div>
                  <div className='flex w-full h-[6px] bg-other-tonalFill5 rounded-full'>
                    <div
                      className='h-[6px] bg-secondary-light rounded-full'
                      style={{ width: `calc(${(asset.amount / poolAmount) * 100}% - 1px)` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {isBanned ? (
            <div className='flex flex-col gap-8'>
              <div className='flex gap-4 color-text-secondary items-center'>
                <div className='size-14 text-destructive-light'>
                  <Ban className='w-full h-full' />
                </div>
                <Text variant='small' color='text.secondary'>
                  You can&apos;t vote in this epoch because you delegated UM after the epoch
                  started. You&apos;ll be able to vote next epoch.
                </Text>
              </div>
              <div className='flex gap-2'>
                <Button actionType='accent' disabled>
                  Vote Now
                </Button>
                <Button actionType='default'>Details</Button>
              </div>
            </div>
          ) : (
            <>
              {!connected ? (
                <div className='flex flex-col gap-8'>
                  <div className='flex gap-4 color-text-secondary items-center'>
                    <div className='size-10 text-text-secondary'>
                      <Coins className='w-full h-full' />
                    </div>
                    <Text variant='small' color='text.secondary'>
                      Delegate UM to vote and influence how incentives are distributed in this
                      epoch.
                    </Text>
                  </div>
                  <div className='flex gap-2'>
                    <Button actionType='accent' icon={ExternalLink}>
                      Delegate
                    </Button>
                    <Button actionType='default'>Details</Button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-8'>
                  <div className='flex gap-4 color-text-secondary items-center'>
                    <div className='size-8 text-text-secondary'>
                      <Wallet2 className='w-full h-full' />
                    </div>
                    <Text variant='small' color='text.secondary'>
                      Connect Prax Wallet to vote in this epoch.
                    </Text>
                  </div>
                  <div className='flex gap-2'>
                    <Button actionType='accent' icon={WalletMinimal}>
                      Connect Prax Wallet
                    </Button>
                    <Button actionType='default'>Details</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
});
