import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const txHash = req.nextUrl.searchParams.get('txHash');
  if (!txHash) {
    return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
  }

  const response = await pindexer.getTransaction(txHash);

  return NextResponse.json(response);
}
