import { withCaughtErrors } from '@/backend/handlers';
import { LPQuerier } from '@/backend/indexer';
import { LPUpdate } from '@/penumbra/dex';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const zQuery = z.object({ start: z.coerce.number().optional(), end: z.coerce.number().optional() });

async function lpUpdatesHandler(req: NextApiRequest, res: NextApiResponse<LPUpdate[]>) {
  const querier = LPQuerier.fromEnv();
  const query = zQuery.parse(req.query);
  const updates = await querier.closeEvents(query.start, query.end);
  res.status(200).json(updates);
}

export default withCaughtErrors('lp/close', lpUpdatesHandler);
