import { withCaughtErrors } from '@/backend/handlers';
import { LPQuerier } from '@/backend/indexer';
import { NextApiRequest, NextApiResponse } from 'next';

async function test(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const lps = LPQuerier.fromEnv();
  const rows = await lps.test();
  res.status(200).json(rows);
}

export default withCaughtErrors('test/000', test);
