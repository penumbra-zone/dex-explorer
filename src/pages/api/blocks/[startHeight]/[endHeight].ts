import { NextApiRequest, NextApiResponse } from 'next';
import { IndexerQuerier } from '../../../../utils/indexer/connector';

const indexerEndpoint = process.env['PENUMBRA_INDEXER_ENDPOINT'] ?? '';
if (!indexerEndpoint) {
  throw new Error('PENUMBRA_INDEXER_ENDPOINT is not set');
}

interface QueryParams {
  startHeight?: string;
  endHeight?: string;
}

export default async function blockInfoFetchHandler(req: NextApiRequest, res: NextApiResponse) {
  const { startHeight, endHeight } = req.query as QueryParams;

  const indexerQuerier = new IndexerQuerier(indexerEndpoint);

  const data = endHeight
    ? await indexerQuerier.fetchBlocksWithinRange(Number(startHeight), Number(endHeight))
    : await indexerQuerier.fetchMostRecentNBlocks(Number(startHeight));

  await indexerQuerier.close();

  res.status(200).json(data);
  return;
}
