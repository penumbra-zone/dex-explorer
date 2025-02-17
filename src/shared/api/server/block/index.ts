import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { BlockSummaryApiResponse } from '@/shared/api/server/block/types.ts';

export async function GET(req: NextRequest): Promise<NextResponse<BlockSummaryApiResponse>> {
  const height = req.nextUrl.searchParams.get('height');
  if (!height) {
    return NextResponse.json({ error: 'height is required' }, { status: 400 });
  }

  const blockSummary = await pindexer.getBlockSummary(Number(height));

  if (!blockSummary) {
    return NextResponse.json({ error: 'Block summary not found' }, { status: 404 });
  }

  return NextResponse.json(blockSummary);
}
