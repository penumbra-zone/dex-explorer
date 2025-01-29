'use client';

import { penumbra } from '@/shared/const/penumbra';
import { ViewService } from '@penumbra-zone/protobuf';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export function InspectBlock() {
  const params = useParams<{ height: string }>();
  const blockheight = params.height;
  console.log('TCL: InspectBlock -> blockheight', blockheight);

  useEffect(() => {
    const fetchTransactions = async () => {
      const transactions = await Array.fromAsync(
        penumbra.service(ViewService).transactionInfo({
          startHeight: BigInt(blockheight - 999),
          endHeight: BigInt(blockheight),
        }),
      );

      return transactions;
    };

    fetchTransactions().then(console.log);
  }, [blockheight]);

  return <div>InspectBlock</div>;
}
