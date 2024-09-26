// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
// pages/api/lp/[lp_nft_id].js
import { IndexerQuerier } from "../../../utils/indexer/connector";
import { Constants } from "../../../constants/configConstants";

export default async function liquidityPostionFetchHandler(req, res) {
  const { lp_nft_id } = req.query;
  const indexerQuerier = new IndexerQuerier(Constants.indexerEndpoint);

  try {
    const data = await indexerQuerier.fetchLiquidityPositionEventsOnBech32(
      lp_nft_id
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching liquidity position events:", error);
    res.status(500).json([]);
  }
  indexerQuerier.close();
}
