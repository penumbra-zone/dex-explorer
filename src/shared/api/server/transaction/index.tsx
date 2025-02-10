import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { Transaction } from '@penumbra-zone/protobuf/penumbra/core/transaction/v1/transaction_pb';

export async function GET(req: NextRequest): Promise<
  NextResponse<{
    tx: Transaction;
    height: number;
  }>
> {
  const { searchParams } = new URL(req.url);
  const txHash = searchParams.get('txHash');
  if (!txHash) {
    return NextResponse.json({ error: 'Missing required txHash' }, { status: 400 });
  }

  const { tx, height } = await pindexer.transaction(txHash);

  return NextResponse.json({ tx, height });
}
