import { BlockQuerier, BlockQuery } from '@/backend/indexer';
import { BlockInfo } from '@/penumbra/block';
import { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';

const zQuery: z.ZodType<BlockQuery> = z
  .object({ last: z.coerce.number() })
  .or(z.object({ start: z.coerce.number(), end: z.coerce.number().optional() }))
  .or(z.object({ start: z.coerce.number().optional(), end: z.coerce.number() }));

export default async function blockInfoFetchHandler(
  req: NextApiRequest,
  res: NextApiResponse<BlockInfo[] | { error: string }>,
) {
  let query: BlockQuery;
  try {
    query = zQuery.parse(req.query);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.toString() });
    } else {
      res.status(500);
    }
    return;
  }
  const out = await BlockQuerier.fromEnv().blocks(query);
  res.status(200).json(out);
}
