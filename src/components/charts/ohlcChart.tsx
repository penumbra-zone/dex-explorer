// src/components/charts/ohlcChart.tsx

import React, { useEffect, useState } from "react";
import { VStack } from "@chakra-ui/react";
import { Token } from "@/utils/types/token";
import { LoadingSpinner } from "../util/loadingSpinner";
import { set } from "lodash";

interface OHLCChartProps {
  asset1Token: Token;
  asset2Token: Token;
}

const OHLCChart = ({ asset1Token, asset2Token }: OHLCChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOHLCDataLoading, setIsOHLCDataLoading] = useState(true);
  const [isTimestampsLoading, setIsTimestampsLoading] = useState(true);
  const [ohlcData, setOHLCData] = useState([]); // [{open, high, low, close, directVolume, swapVolume, height}]
  const [blockToTimestamp, setBlockToTimestamp] = useState({}); // {height: timestamp}
  const [error, setError] = useState<string | undefined>(undefined); // [error message]

  // TODO: Decide how to set the start block and limit
  const startBlock = 0;
  const limit = 10000;

  useEffect(() => {
    if (!asset1Token || !asset2Token) {
      return;
    }

    // Get data from the API

    // 1. First fetch ohlc data
    const ohlcData = fetch(
      `/api/ohlc/${asset1Token.display}/${asset2Token.display}/${startBlock}/${limit}`
    ).then((res) => res.json());

    Promise.all([ohlcData])
      .then(([ohlcDataResponse]) => {
        if (!ohlcDataResponse || ohlcDataResponse.error) {
          throw new Error("Error fetching data");
        }
        console.log("ohlcData", ohlcDataResponse);
        setOHLCData(ohlcDataResponse);
        setIsOHLCDataLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data", error);
        setError("Error fetching OHLC data");
        setIsLoading(false);
        setIsOHLCDataLoading(false);
      });

    // 2. Then fetch timestamp data
  }, [asset1Token, asset2Token]);

  useEffect(() => {
    if (!ohlcData || ohlcData.length === 0 || isOHLCDataLoading) {
      return;
    }

    // Process the data and make a list of OHLC heights
    // format needed is '/api/blockTimestamps/{height1}/{height2}/{height3}'
    const timestampsForHeights = fetch(
      `/api/blockTimestamps/${ohlcData.map((ohlc) => ohlc['height']).join("/")}`
    ).then((res) => res.json());

    Promise.all([timestampsForHeights])
      .then(([timestampsForHeightsResponse]) => {
        if (
          !timestampsForHeightsResponse ||
          timestampsForHeightsResponse.error
        ) {
          throw new Error(
            `Error fetching data: ${timestampsForHeightsResponse}`
          );
        }
        console.log("Timestamps: ", timestampsForHeightsResponse);
        setBlockToTimestamp(timestampsForHeightsResponse);

        setIsTimestampsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data", error);
        setError("Error fetching timestamps for heights");
        setIsLoading(false);
        setIsTimestampsLoading(false);
      });
  }, [ohlcData, isOHLCDataLoading]);


  // Create an ohlc chart using the data once it is loaded
   


  return (
    // ! Width should be the same as that of the DepthChart isLoading ? (

    <VStack height="600px" width={"60em"}>
      {isLoading && error === undefined ? (
        <LoadingSpinner />
      ) : error !== undefined ? (
        <div>
          <h1>Error: {error}</h1>
        </div>
      ) : (
        <div>
          <h1>OHLC Chart</h1>
        </div>
      )}
    </VStack>
  );
};

export default OHLCChart;
