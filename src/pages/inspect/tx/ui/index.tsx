'use client';

import { useParams } from 'next/navigation';
import { useTransaction } from '../api/transaction';
import { TransactionViewComponent } from './tx-view-component';
import { Card } from '@penumbra-zone/ui/Card';

export function InspectTx() {
  const params = useParams<{ hash: string }>();
  const { data: transaction } = useTransaction(params.hash);
  console.log('TCL: InspectTx -> transaction', transaction);

  return (
    <div className='flex flex-col items-center justify-center'>
      {transaction && (
        <Card title={`Transaction ${params.hash}`}>
          <div className='text-white'>
            <TransactionViewComponent
              txv={transaction.txInfo.view}
              metadataFetcher={() => {
                return Promise.resolve();
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
