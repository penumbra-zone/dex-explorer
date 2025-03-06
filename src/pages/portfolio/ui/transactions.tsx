import Link from 'next/link';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FileSearch } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TransactionId } from '@penumbra-zone/protobuf/penumbra/core/txhash/v1/txhash_pb';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { TransactionSummary } from '@penumbra-zone/ui/TransactionSummary';
import { Button } from '@penumbra-zone/ui/Button';
import { Skeleton } from '@penumbra-zone/ui/Skeleton';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';
import { connectionStore } from '@/shared/model/connection';
import { useGetMetadataByAssetId } from '@/shared/api/assets';
import { useTransactions } from '../api/use-transactions';
import { NoData } from '@/pages/portfolio/ui/no-data';
import { BlockchainError } from '@/shared/ui/blockchain-error';

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
  const { data: transactions, isLoading, error } = useTransactions(subaccount);

  const getTxId = (tx: TransactionInfo): string => {
    return tx.id?.inner ? uint8ArrayToHex(tx.id.inner) : '';
  };

  return (
    <div ref={parent} className='flex flex-col gap-1'>
      {isLoading &&
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-[72px]'>
            <Skeleton />
          </div>
        ))}

      {!isLoading && !!error && (
        <div className='min-h-[250px] flex items-center'>
          <BlockchainError direction='column' message={String(error)} hideDetails />
        </div>
      )}

      {!isLoading && !error && !transactions?.length && <NoData label='You have no transactions' />}

      {/* TODO: implement pagination */}
      {transactions?.slice(0, 15).map((tx, index) => (
        <TransactionSummary
          info={tx}
          key={getTxId(tx) || index}
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
