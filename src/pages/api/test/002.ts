import { withCaughtErrors } from '@/backend/handlers';
import { BlockQuerier } from '@/backend/indexer';
import { NextApiRequest, NextApiResponse } from 'next';

async function test(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const blocks = BlockQuerier.fromEnv();
  res.status(200).json(await blocks.blocks({ last: 20 }));
}

export default withCaughtErrors('test/002', test);
