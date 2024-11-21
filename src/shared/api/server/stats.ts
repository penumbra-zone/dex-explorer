import { NextRequest, NextResponse } from 'next/server';
import { DexExAggregateSummary } from '@/shared/database/schema';
import { pindexer } from '@/shared/database';
import { durationWindows, isDurationWindow } from '@/shared/utils/duration';

export type StatsData = DexExAggregateSummary;
export type StatsResponse = StatsData | { error: string };

export async function GET(req: NextRequest): Promise<NextResponse<StatsResponse>> {
  const { searchParams } = new URL(req.url);

  const durationWindow = searchParams.get('durationWindow');
  if (!durationWindow || !isDurationWindow(durationWindow)) {
    return NextResponse.json(
      { error: `durationWindow missing or invalid window. Options: ${durationWindows.join(', ')}` },
      { status: 400 },
    );
  }

  const results = await pindexer.stats(durationWindow);

  const stats = results[0];
  if (!stats) {
    return NextResponse.json(
      { error: `No stats found` },
      { status: 400 },
    );
  }

  return NextResponse.json(stats);
}
