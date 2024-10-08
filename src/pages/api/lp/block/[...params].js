// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
// pages/api/lp/positionsByBlockHeight/[...params].js
import { IndexerQuerier } from '../../../../old/utils/indexer/connector';

const indexerEndpoint = process.env.PENUMBRA_INDEXER_ENDPOINT;
if (!indexerEndpoint) {
  throw new Error('PENUMBRA_INDEXER_ENDPOINT is not set');
}

export default async function liquidityPostionFetchHandler(req, res) {
  const indexerQuerier = new IndexerQuerier(indexerEndpoint);
  try {
    if (req.query.params.length === 1) {
      // Get all ExecutionEvents in the block for block detail page
      const blockHeight = req.query.params[0];
      const data = await indexerQuerier.fetchLiquidityPositionExecutionEventsOnBlockHeight(
        parseInt(blockHeight),
      );
      res.status(200).json(data);
    } else {
      // Get all PositionOpen/Close Events in the block range for block timeline and block detail pages
      const startHeight = req.query.params[0];
      const endHeight = req.query.params[1];
      const data = await indexerQuerier.fetchLiquidityPositionOpenCloseEventsOnBlockHeightRange(
        parseInt(startHeight),
        parseInt(endHeight),
      );
      res.status(200).json(data);
    }
  } catch (error) {
    console.error('Error fetching liquidity position events:', error);
    res.status(500).json([]);
  }
  indexerQuerier.close();
}
