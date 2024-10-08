// pages/api/arbs/[...params].ts

import { DexQueryServiceClient } from '@/old/utils/protos/services/dex/dex-query-service-client';
import { NextApiRequest, NextApiResponse } from 'next';

const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'];
if (!grpcEndpoint) {
  throw new Error('PENUMBRA_GRPC_ENDPOINT is not set');
}

export default async function arbsByBlockRange(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query['params'] as string[];

  const startHeight = params[0] ?? null;
  const endHeight = params[1] ?? null;

  try {
    if (!startHeight || !endHeight) {
      res.status(400).json({ error: 'Invalid query parameters' });
      return;
    }
    // TODO: validate StartHeight/EndHeight are numbers
    const dex_querier = new DexQueryServiceClient({
      grpcEndpoint: grpcEndpoint ?? '',
    });

    const data = await dex_querier.arbExecutions(parseInt(startHeight), parseInt(endHeight));

    res.status(200).json(data ?? null);
  } catch (error) {
    console.error('Error getting liquidty positions by price grpc data:', error);
    res.status(500).json({
      error: `Error getting liquidty positions by price grpc data: ${error as string}`,
    });
  }
}
