import Link from 'next/link';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FileSearch } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TransactionId } from '@penumbra-zone/protobuf/penumbra/core/txhash/v1/txhash_pb';
import { TransactionSummary } from '@penumbra-zone/ui/TransactionSummary';
import { Button } from '@penumbra-zone/ui/Button';
import { Skeleton } from '@penumbra-zone/ui/Skeleton';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';
import { connectionStore } from '@/shared/model/connection';
import { useGetMetadataByAssetId } from '@/shared/api/assets';
import { useTransactions } from '../api/use-transactions';

const getTransactionLink = (id?: TransactionId) => {
  const hash = id?.inner ? uint8ArrayToHex(id.inner) : '';

  return ({ children, ...rest }: { children?: ReactNode }) => (
    <Link href={`/inspect/tx/${hash}`} {...rest}>
      {children}
    </Link>
  );
};

export const PortfolioTransactions = observer(() => {
  const [parent] = useAutoAnimate();
  const router = useRouter();

  const { subaccount } = connectionStore;
  const getMetadataByAssetId = useGetMetadataByAssetId();
  const { data: transactions, isLoading } = useTransactions(subaccount);

  return (
    <div ref={parent} className='flex flex-col gap-1'>
      {isLoading &&
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-[72px]'>
            <Skeleton />
          </div>
        ))}

      {transactions?.map((tx, index) => (
        <TransactionSummary
          key={index}
          info={tx}
          as={getTransactionLink(tx.id)}
          getMetadataByAssetId={getMetadataByAssetId}
          onClick={() => tx.id?.inner && router.push(`/inspect/tx/${uint8ArrayToHex(tx.id.inner)}`)}
          endAdornment={
            <Button actionType='accent' density='compact' iconOnly icon={FileSearch}>
              Go to transaction details
            </Button>
          }
        />
      ))}
    </div>
  );
});
