// pages/api/blockTimestamps/[...params].js

import { IndexerQuerier } from "../../../utils/indexer/connector";

const indexerEndpoint = process.env.PENUMBRA_INDEXER_ENDPOINT
if (!indexerEndpoint) {
    throw new Error("PENUMBRA_INDEXER_ENDPOINT is not set")
}

export default async function blockTimestampsFetchHandler(req, res) {
  const indexerQuerier = new IndexerQuerier(indexerEndpoint);
  
  // Params will be an arbitrarily long list of block heights
  const params = req.query.params;
  let blocks = [];

  for (const param of params) {
    if (isNaN(param)) {
      res.status(400).json({ error: "Invalid block height" });
      return;
    }
    blocks.push(parseInt(param));
  }

  try {
    const data = await indexerQuerier.fetchBlocksByHeight(blocks);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching block timestamps for heights:", error);
    res.status(500).json([]);
  }
  indexerQuerier.close();
}
