import { tokenConfigMapOnInner, Token } from "../../constants/tokenConstants";
import { uint8ArrayToBase64, base64ToUint8Array } from "../../utils/math/base64";
import { ShieldedPoolQuerier } from "../protos/services/app/shielded-pool";
import { testnetConstants } from "../../constants/configConstants";
import { AssetId } from "@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/asset/v1/asset_pb";

// TODO: Eventually this should read from a penumbra asset registry/repo
export const fetchToken = async (
  tokenInner: Uint8Array | string
): Promise<Token | undefined> => {
  if (typeof tokenInner !== "string") {
    tokenInner = uint8ArrayToBase64(tokenInner);
  }

  let token: Token | undefined =
    tokenConfigMapOnInner[tokenInner];

  if (!token) {
    console.error(
      "Token not found in tokenConfigMapOnInner, querying chain",
      tokenInner,
    );

    const pool_querier = new ShieldedPoolQuerier({
      grpcEndpoint: testnetConstants.grpcEndpoint,
    });

    const positionId = new AssetId({
      inner: base64ToUint8Array(tokenInner),
    });

    try {
      const res = await pool_querier.assetMetadata(positionId);

      if (!res) {
        console.error("Error fetching token metadata: no response");
        return undefined; // Explicitly return undefined if no response
      }

      // Search denomUnits for highest exponent
      let decimals = 0;
      let symbol = "";

      res.denomUnits.forEach((unit) => {
        if (unit.exponent >= decimals) {
          decimals = unit.exponent;
          symbol = unit.denom;
        }
      });

      // Assign fetched token data
      token = {
        symbol: symbol,
        decimals: decimals,
        inner: tokenInner,
      };
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return undefined; // Return undefined in case of error
    }
  }

  return token;
};
