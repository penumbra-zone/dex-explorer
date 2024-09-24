import { withCaughtErrors } from '@/backend/handlers';
import { LPQuerier } from '@/backend/indexer';
import { LPID, LPUpdate } from '@/penumbra/dex';
import { zBech32 } from '@/utils/encoding';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

interface Query {
  lp_nft_id: LPID;
}

const zQuery: z.ZodType<Query> = z.object({ lp_nft_id: zBech32('plpid') });

async function lpUpdatesHandler(req: NextApiRequest, res: NextApiResponse<LPUpdate[]>) {
  const querier = LPQuerier.fromEnv();
  const query: Query = zQuery.parse(req.query);
  const updates = await querier.updates(query.lp_nft_id);
  res.status(200).json(updates);
}

export default withCaughtErrors('lp/[lp_nft_id]/updates', lpUpdatesHandler);
