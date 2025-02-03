'use client';

import { useParams } from 'next/navigation';
import { useTransaction } from '../api/transaction';

export function InspectTx() {
  const params = useParams<{ hash: string }>();
  const { data: transaction } = useTransaction(params.hash);
  console.log('TCL: InspectTx -> transaction', transaction);

  return <div>InspectTx</div>;
}
