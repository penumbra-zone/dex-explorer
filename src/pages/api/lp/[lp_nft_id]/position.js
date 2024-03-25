// pages/api/lp/[lp_nft_id]/position.js
import { testnetConstants } from "../../../../constants/configConstants";
import { LiquidityPositionQuerier } from "../../../../utils/protos/services/dex/liquidity-positions";
import {
  PositionId,
} from "@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb";

export default async function liquidityPositionDataHandler(req, res) {
  const { lp_nft_id } = req.query;

  const lp_querier = new LiquidityPositionQuerier({
    grpcEndpoint: testnetConstants.grpcEndpoint,
  });

  const positionId = new PositionId({
    altBech32m: lp_nft_id,
  });

  try {
    const data = await lp_querier.liquidityPositionById(positionId);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching liquidity position grpc data:", error);
    res.status(500).json([]);
  }
}
