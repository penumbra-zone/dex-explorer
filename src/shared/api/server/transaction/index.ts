import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { TransactionApiResponse } from './types';

export async function GET(req: NextRequest): Promise<NextResponse<TransactionApiResponse>> {
  const txHash = req.nextUrl.searchParams.get('txHash');
  if (!txHash) {
    return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
  }

  const response = await pindexer.getTransaction(txHash);

  if (!response) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  return NextResponse.json({
    tx: response.transaction,
    height: response.height,
  });
}
