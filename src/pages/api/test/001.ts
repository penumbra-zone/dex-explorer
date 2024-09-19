import { withCaughtErrors } from '@/backend/handlers';
import { LPQuerier } from '@/backend/indexer';
import { NextApiRequest, NextApiResponse } from 'next';

const ID = 'plpid1gy5kfyg94ad4yj3wq899h6tu40f47t0t08g9fkcmjq59lv9lu20qdq2vep';

async function test(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const lps = LPQuerier.fromEnv();
  res.status(200).json(await lps.updates(ID));
}

export default withCaughtErrors('test/001', test);
