import Image from 'next/image';
import { Text } from '@penumbra-zone/ui/Text';

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className='relative p-[1px]'>
    <div className='absolute z-10 top-0 left-0 bottom-0 right-0 rounded-xl [background:linear-gradient(110deg,rgba(186,77,20,1),rgba(186,77,20,0),rgba(34,99,98,0),rgba(34,99,98,1))]' />
    <div className='absolute z-20 top-1 left-1 bottom-1 right-1 rounded-xl bg-base-blackAlt' />
    <div className='relative z-30 flex flex-col gap-4 rounded-xl p-3 backdrop-blur-lg [background:linear-gradient(110deg,rgba(186,77,20,0.2)_0%,rgba(34,99,98,0.1)_75%)]'>
      {children}
    </div>
  </div>
);

export const LandingCard = () => {
  const epoch = 123;

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
            <div className='rounded-full bg-black-alt p-2'>
              <Text variant='body' color='text.primary'>
                #{epoch}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
