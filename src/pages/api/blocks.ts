import { withCaughtErrors } from '@/backend/handlers';
import { BlockQuerier, BlockQuery } from '@/backend/indexer';
import { BlockInfo } from '@/penumbra/block';
import { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';

const zQuery: z.ZodType<BlockQuery> = z
  .object({ last: z.coerce.number() })
  .or(z.object({ start: z.coerce.number(), end: z.coerce.number().optional() }))
  .or(z.object({ start: z.coerce.number().optional(), end: z.coerce.number() }));

async function blockInfoFetchHandler(
  req: NextApiRequest,
  res: NextApiResponse<BlockInfo[] | { error: string }>,
) {
  const query = zQuery.parse(req.query);
  const out = await BlockQuerier.fromEnv().blocks(query);
  res.status(200).json(out);
}

export default withCaughtErrors('blocks', blockInfoFetchHandler);
