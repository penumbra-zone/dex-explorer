import { withCaughtErrors } from '@/backend/handlers';
import { LPQuerier } from '@/backend/indexer';
import { NextApiRequest, NextApiResponse } from 'next';

async function test(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const lps = LPQuerier.fromEnv();
  res.status(200).json(await lps.firstLPUpdate());
}

export default withCaughtErrors('test/001', test);
