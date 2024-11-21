import { TradePageLayout } from './page-layout';
import { usePrefetchSummary } from '../model/use-prefetch-summary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { setServerParams } from '@/shared/utils/server-params';

interface TradePageParams {
  baseSymbol: string;
  quoteSymbol: string;
}

export const TradePage = async (props: { params: Promise<TradePageParams> }) => {
  setServerParams(await props.params);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- in server components it is fine to use async hooks
  const { prefetch, queryClient } = usePrefetchSummary('1d');
  await prefetch();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TradePageLayout />
    </HydrationBoundary>
  );
};
