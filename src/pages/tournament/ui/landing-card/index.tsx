import { observer } from 'mobx-react-lite';
import { GradientCard } from './gradient-card';
import { Explainer } from './explainer';
import { Stats } from './stats';
import { VotingFooter } from './voting-footer';

export const LandingCard = observer(() => {
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
    <GradientCard>
      <div className='flex gap-12 p-12'>
        <Explainer />
        <div className='w-[1px] bg-other-tonalStroke' />
        <div className='flex flex-col w-1/2 gap-8'>
          <Stats
            epoch={epoch}
            poolAmount={poolAmount}
            poolLPs={poolLPs}
            poolDelegators={poolDelegators}
            symbol={symbol}
            results={results}
          />
          <VotingFooter isBanned={isBanned} />
        </div>
      </div>
    </GradientCard>
  );
});
