'use client';

import { useParams } from 'next/navigation';
import { useTransactionInfo } from '../api/transaction';
import { TxViewer } from './tx-viewer';
import { Card } from '@penumbra-zone/ui/Card';
import { Skeleton } from '@/shared/ui/skeleton';

export function InspectTx() {
  const params = useParams<{ hash: string }>();
  const { data: txInfo, isLoading, isError } = useTransactionInfo(params?.hash ?? '');
  console.log('TCL: InspectTx -> txInfo', txInfo);

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='mb-4'>
        {isError ? (
          <Card title={`Couldn’t fetch transaction.`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              Something went wrong while fetching the transaction.
            </div>
          </Card>
        ) : (
          <Card title={`Transaction ${isLoading ? 'Loading...' : params?.hash}`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              {isLoading ? (
                <div>
                  <div className='w-[822px] h-8 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[722px] h-6 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[422px] h-4'>
                    <Skeleton />
                  </div>
                </div>
              ) : (
                <TxViewer txInfo={txInfo} />
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
