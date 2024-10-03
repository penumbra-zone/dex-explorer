// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
import Layout from "@/components/layout";
import { useRouter } from "next/router";
import {
  Box,
  Text,
  VStack,
  IconButton,
  HStack,
  Avatar,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BlockInfo } from "@/penumbra/block";
import { SwapExecutionWithBlockHeight } from "@/utils/protos/types/DexQueryServiceClientInterface";
import { LoadingSpinner } from "@/components/util/loadingSpinner";
import { Constants } from "@/utils/configConstants.ts";
import { formatTimestampShort } from "@/components/blockTimestamp";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { innerToBech32Address } from "@/utils/math/bech32";
import {
  SwapExecution,
  SwapExecution_Trace,
} from "@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb";
import BigNumber from "bignumber.js";
import { fetchAllTokenAssets } from "@/utils/token/tokenFetch";
import { Token } from "@/utils/types/token";
import { fromBaseUnit } from "@/utils/math/hiLo";
import { LPUpdate } from "@/penumbra/dex";

export interface BlockDetailedSummaryData {
  openEvents: LPUpdate[];
  closeEvents: LPUpdate[];
  swapExecutions: SwapExecution[];
  arbExecutions: SwapExecution[];
  createdAt: string;
}

export const Price = ({
  trace,
  metadataByAssetId,
}: {
  trace: SwapExecution_Trace;
  metadataByAssetId: Record<string, Token>;
}) => {
  const inputValue = trace.value[0];
  const outputValue = trace.value[trace.value.length - 1];
  let price: string | undefined;

  if (
    inputValue?.amount &&
    outputValue?.amount &&
    inputValue.assetId &&
    outputValue.assetId
  ) {
    const firstValueMetadata =
      metadataByAssetId[inputValue.assetId.inner as unknown as string];
    const lastValueMetadata =
      metadataByAssetId[outputValue.assetId.inner as unknown as string];

    if (firstValueMetadata?.symbol && lastValueMetadata?.symbol) {
      const inputDisplayDenomExponent = firstValueMetadata.decimals ?? 0;
      const outputDisplayDenomExponent = lastValueMetadata.decimals ?? 0;
      const formattedInputAmount = fromBaseUnit(
        BigInt(inputValue.amount.lo ?? 0),
        BigInt(inputValue.amount.hi ?? 0),
        inputDisplayDenomExponent
      ).toFixed(6);
      const formattedOutputAmount = fromBaseUnit(
        BigInt(outputValue.amount.lo ?? 0),
        BigInt(outputValue.amount.hi ?? 0),
        outputDisplayDenomExponent
      ).toFixed(6);
      const outputToInputRatio = new BigNumber(formattedOutputAmount)
        .dividedBy(formattedInputAmount)
        .toFormat(outputDisplayDenomExponent);

      // Remove trailing zeros
      const outputToInputFormatted = outputToInputRatio.replace(/\.?0+$/, "");

      price = `1 ${firstValueMetadata.symbol} = ${outputToInputFormatted} ${lastValueMetadata.symbol}`;
    }
  }

  if (!price) { return null; }
  return <span className="text-xs text-muted-foreground">{price}</span>;
};

// Enum for the different types of data boxes
enum DataBoxType {
  OPEN_POSITIONS = "open_positions",
  CLOSE_POSITIONS = "close_positions",
  ARBS = "arbs",
  SWAPS = "swaps",
}

// Trace Type enum
export enum TraceType {
  SWAP = DataBoxType.SWAPS,
  ARB = DataBoxType.ARBS,
}
export const Trace = ({
  trace,
  metadataByAssetId,
  type,
  hidePrice,
}: {
  trace: SwapExecution_Trace;
  metadataByAssetId: Record<string, Token>;
  type: TraceType;
  hidePrice?: boolean;
}) => {
  const isMobile = window.innerWidth < 768;

  return (
    <Box width="100%" paddingLeft="0%" overflow="hidden" height="44px">
      <Flex
        flexDirection={["column", "row"]}
        alignItems="flex-start"
        justifyContent="space-between"
        padding="2px"
        width="100%"
        height="70px"
        position="relative"
        overflow="scroll"
      >
        {/* Background line for trace connections */}
        <Box
          position="absolute"
          top={["0", "22px"]}
          left="0"
          right="0"
          height={["100%", "2px"]}
          width={["2px", "100%"]}
          backgroundColor="var(--charcoal-tertiary-bright)"
          zIndex="0"
        />
        {trace.value.map((value, index) => {
          const metadata =
            metadataByAssetId[value.assetId?.inner as unknown as string];
          const displayDenomExponent = metadata?.decimals ?? 0;
          const formattedAmount = fromBaseUnit(
            BigInt(value.amount?.lo ?? 0),
            BigInt(value.amount?.hi ?? 0),
            displayDenomExponent
          ).toFixed(6);
          return (
            <Flex key={index} align="center" zIndex={1} mb={[2, 0]} mr={2}>
              <Box>
                <Flex
                  outline={"2px solid var(--charcoal-tertiary-blended)"}
                  padding="8px"
                  borderRadius={"30px"}
                  backgroundColor="var(--charcoal-tertiary)"
                  alignItems="center"
                  flexWrap="nowrap"
                >
                  {metadata?.imagePath ? (
                    <Avatar src={metadata.imagePath} size={"xs"} mr={2} />
                  ) : (
                    <Avatar size={"xs"} mr={2} />
                  )}
                  <Text
                    fontSize={["xs", "small"]}
                    fontFamily={"monospace"}
                    whiteSpace="nowrap"
                  >
                    {formattedAmount} {metadata?.symbol}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          );
        })}
      </Flex>
      {type !== TraceType.ARB && !hidePrice && (
        <Box pt={2} pb={3}>
          <Price trace={trace} metadataByAssetId={metadataByAssetId} />
        </Box>
      )}
    </Box>
  );
};
export const formatTimestampOrDefault = (timestamp: any) => {
  if (timestamp === undefined || timestamp === "") {
    return "Missing data in indexer to display timestamp";
  }
  return formatTimestampShort(timestamp);
};

export const ArbSummary = ({
  swapExecution,
  metadataByAssetId,
  index,
  isExpanded,
  toggleArbExpand,
}: {
  swapExecution: SwapExecution;
  metadataByAssetId: Record<string, Token>;
  index: number;
  isExpanded: boolean;
  toggleArbExpand: (index: number) => void;
}) => {
  const arbPerAsset: Record<string, number> = {};
  const tracesPerAsset: Record<string, number> = {};

  swapExecution.traces.forEach((trace: SwapExecution_Trace) => {
    const firstTrace = trace.value[0];
    const lastTrace = trace.value[trace.value.length - 1];
    if (!firstTrace.assetId?.inner != !lastTrace.assetId?.inner) {
      console.error("First and last trace asset id must be equal");
      return;
    }

    const assetId = firstTrace.assetId?.inner as unknown as string;
    const displayDenomExponent = metadataByAssetId[assetId]?.decimals ?? 0;

    const formattedInputAmount = fromBaseUnit(
      BigInt(firstTrace.amount?.lo ?? 0),
      BigInt(firstTrace.amount?.hi ?? 0),
      displayDenomExponent
    ).toNumber();

    const formattedOutputAmount = fromBaseUnit(
      BigInt(lastTrace.amount?.lo ?? 0),
      BigInt(lastTrace.amount?.hi ?? 0),
      displayDenomExponent
    ).toNumber();

    if (tracesPerAsset[assetId]) {
      tracesPerAsset[assetId] += 1;
    } else {
      tracesPerAsset[assetId] = 1;
    }

    const arbedAmount = formattedOutputAmount - formattedInputAmount;

    if (arbPerAsset[assetId]) {
      arbPerAsset[assetId] += arbedAmount;
    } else {
      arbPerAsset[assetId] = arbedAmount;
    }
  });

  return (
    <Box overflowX="auto" width="100%" textAlign={"left"}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {Object.entries(arbPerAsset).map(([assetId, amount]) => {
          const metadata = metadataByAssetId[assetId];
          return (
            <HStack key={assetId} align="left">
              <Box>
                <HStack padding="8px" borderRadius={"30px"}>
                  {metadata?.imagePath ? (
                    <Avatar src={metadata.imagePath} size={"xs"} />
                  ) : (
                    <Avatar size={"xs"} />
                  )}
                  <Text fontSize={"md"} fontFamily={"monospace"}>
                    {amount.toFixed(6)} {metadata?.symbol} in{" "}
                    {tracesPerAsset[assetId]} routes
                  </Text>
                </HStack>
              </Box>
            </HStack>
          );
        })}
        <IconButton
          onClick={() => toggleArbExpand(index)}
          icon={isExpanded ? <MinusIcon /> : <AddIcon />}
          size="xs"
          aria-label="Expand/Collapse"
          colorScheme="purple"
        />
      </Box>
      {isExpanded && (
        <Box overflowX="auto" width="100%">
          <VStack
            spacing={2}
            align="left"
            justifyContent="left"
            paddingTop="10px"
            width={"100%"}
          >
            {swapExecution.traces.map(
              (trace: SwapExecution_Trace, traceIndex: number) => (
                <Trace
                  key={traceIndex}
                  trace={trace}
                  metadataByAssetId={metadataByAssetId}
                  type={TraceType.ARB}
                />
              )
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default function Block() {
  const router = useRouter();
  const { block_height } = router.query as { block_height: string };
  console.log(router);
  console.log(router.query);

  const [isLoading, setIsLoading] = useState(true);
  const [blockHeight, setBlockHeight] = useState(-1);
  const [blockData, setBlockData] = useState<BlockDetailedSummaryData>();
  const [error, setError] = useState<string | undefined>(undefined);

  // Get detailed block data
  useEffect(() => {
    setIsLoading(true);
    if (block_height && blockHeight <= 0) {
      console.log("Fetching data for block...", block_height);
      const height: number = parseInt(block_height);
      const blockInfoPromise: Promise<BlockInfo[]> = fetch(
        `/api/blocks?start=${height}&end=${height}`
      ).then(async (res) => {
        if (res.status !== 200) {
          throw new Error((await res.json()).toString());
        }
        return BlockInfo.JSON_SCHEMA.array().parse(await res.json());
      });
      const lpOpenPromise: Promise<LPUpdate[]> =
        fetch(`/api/lp/open?start=${height}&end=${height}`).then(async (res) =>
          LPUpdate.JSON_SCHEMA.array().parse(await res.json())
        );
      const lpClosePromise: Promise<LPUpdate[]> =
        fetch(`/api/lp/close?start=${height}&end=${height}`).then(async (res) =>
          LPUpdate.JSON_SCHEMA.array().parse(await res.json())
        );
      const arbsPromise: Promise<SwapExecutionWithBlockHeight[]> = fetch(
        `/api/arbs/${height}/${height + 1}`
      ).then((res) => res.json());
      const swapsPromise: Promise<SwapExecutionWithBlockHeight[]> = fetch(
        `/api/swaps/${height}/${height + 1}`
      ).then((res) => res.json());

      Promise.all([
        blockInfoPromise,
        lpOpenPromise,
        lpClosePromise,
        arbsPromise,
        swapsPromise,
      ])
        .then(
          ([
            blockInfoResponse,
            lpOpenResponse,
            lpCloseResponse,
            arbsResponse,
            swapsResponse,
          ]) => {
            const blockInfoList: BlockInfo[] = blockInfoResponse;
            const arbData: SwapExecutionWithBlockHeight[] =
              arbsResponse;
            const swapData: SwapExecutionWithBlockHeight[] =
              swapsResponse;

            if (blockInfoList.length === 0) {
              setError(`No data for block ${block_height} found`);
              setIsLoading(false);
            }
            console.log("Fetching data for block...");
            const blockInfo = blockInfoList[0]!;

            const detailedBlockSummaryData: BlockDetailedSummaryData = {
              openEvents: lpOpenResponse,
              closeEvents: lpCloseResponse,
              swapExecutions: [],
              arbExecutions: [],
              createdAt: blockInfo.created.toString(),
            };
            arbData.forEach((arb: SwapExecutionWithBlockHeight) => {
              detailedBlockSummaryData.arbExecutions.push(arb.swapExecution);
            });
            swapData.forEach((swap: SwapExecutionWithBlockHeight) => {
              detailedBlockSummaryData.swapExecutions.push(
                swap.swapExecution
              );
            });
            setBlockData(detailedBlockSummaryData);
            setBlockHeight(height);
          }
        )
        .catch((error) => {
          console.error("Error fetching block summary data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      if (block_height === undefined) {
        // The router query is not yet available
        setIsLoading(true);
      }
    }
  }, [block_height, blockHeight]);

  const DataBox = ({
    title,
    dataLength,
    type,
  }: {
    title: string;
    dataLength: number;
    type: DataBoxType;
  }) => {
    // ! Expand default
    const [isExpanded, setIsExpanded] = useState(false); // EXPAND
    const tokenAssets = fetchAllTokenAssets();
    const metadataByAssetId: Record<string, Token> = {};
    tokenAssets.forEach((asset) => {
      metadataByAssetId[asset.inner] = {
        symbol: asset.symbol,
        display: asset.display,
        decimals: asset.decimals,
        inner: asset.inner,
        imagePath: asset.imagePath,
      };
    });

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const [expandedArbs, setExpandedArbs] = useState<Record<number, boolean>>(
      {}
    );

    const toggleArbExpand = (index: number) => {
      setExpandedArbs((prevState) => ({
        ...prevState,
        [index]: !prevState[index],
      }));
    };

    return (
      <Box
        className="box-card"
        position="relative"
        padding="2%"
        paddingTop="2%"
        paddingBottom="2%"
        paddingLeft="5%"
        paddingRight="5%"
        width="50%"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text>
            {title}: {dataLength}
          </Text>
        </Box>
        {dataLength > 0 && (
          <IconButton
            onClick={toggleExpand}
            icon={isExpanded ? <MinusIcon /> : <AddIcon />}
            size="xs"
            aria-label="Expand/Collapse"
            position="absolute"
            top="10px"
            right="10px"
            colorScheme="purple"
          />
        )}
        {isExpanded && dataLength > 0 && (
          <Box marginTop="10px" width={"100%"}>
            {type === DataBoxType.OPEN_POSITIONS ? (
              <VStack
                fontSize={"small"}
                fontFamily={"monospace"}
                spacing={"10px"}
                paddingTop={"10px"}
              >
                {blockData!.openEvents.map((update) => (
                  <a
                    key={update.id}
                    href={`/lp/${update.positionId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Text>
                      {update.positionId}
                    </Text>
                  </a>
                ))}
              </VStack>
            ) : type === DataBoxType.CLOSE_POSITIONS ? (
              <VStack
                fontSize={"small"}
                fontFamily={"monospace"}
                spacing={"10px"}
                paddingTop={"10px"}
                width={"100%"}
              >
                {blockData!.closeEvents.map((update) => (
                  <a
                    key={update.id}
                    href={`/lp/${update.positionId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Text>
                      {update.positionId}
                    </Text>
                  </a>
                ))}
              </VStack>
            ) : type === DataBoxType.ARBS ? (
              <VStack
                fontSize={"small"}
                fontFamily={"monospace"}
                spacing={"10px"}
                paddingTop={"10px"}
                width={"100%"}
              >
                {blockData!.arbExecutions.map(
                  (swapExecution: SwapExecution, index: number) => (
                    <ArbSummary
                      key={index}
                      swapExecution={swapExecution}
                      metadataByAssetId={metadataByAssetId}
                      index={index}
                      isExpanded={!!expandedArbs[index]}
                      toggleArbExpand={toggleArbExpand}
                    />
                  )
                )}
              </VStack>
            ) : type === DataBoxType.SWAPS ? (
              <VStack
                fontSize={"small"}
                fontFamily={"monospace"}
                spacing={"10px"}
                paddingTop={"10px"}
                width={"100%"}
              >
                {blockData!.swapExecutions.map(
                  (swapExecution: SwapExecution) => (
                    <Box overflowX="auto" width="100%">
                      <VStack
                        spacing={2}
                        align="left"
                        justifyContent="left"
                        paddingTop="10px"
                        width={"100%"}
                      >
                        {swapExecution.traces.map(
                          (trace: SwapExecution_Trace, index: number) => (
                            <>
                              <Trace
                                key={index}
                                trace={trace}
                                metadataByAssetId={metadataByAssetId}
                                type={TraceType.SWAP}
                              />
                              <Box paddingTop="3px" />
                            </>
                          )
                        )}
                      </VStack>
                    </Box>
                  )
                )}
              </VStack>
            ) : (
              <Text>Unimplemented type: {type}</Text>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Layout pageTitle={`Block - ${blockHeight}`}>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          width="100%"
          height="100%"
          paddingBottom="5px"
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Text>{error}</Text>
        </Box>
      ) : (
        <>
          <VStack paddingTop={"5em"}>
            <Text
              fontWeight={"bold"}
              width={"100%"}
              fontSize={"1.5em"}
              textAlign={"center"}
            >
              {"Block " + blockHeight}
            </Text>
            <Text
              fontWeight={"bold"}
              width={"100%"}
              fontSize={"xs"}
              textAlign={"center"}
              textColor="var(--charcoal-tertiary-bright)"
            >
              {formatTimestampOrDefault(blockData?.createdAt)}
            </Text>
            <Text>
              <a
                href={Constants.cuiloaUrl + "/block/" + blockHeight}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "underline",
                  color: "var(--charcoal-tertiary-bright)",
                  display: "flex",
                  fontSize: "small",
                  fontFamily: "monospace",
                }}
              >
                See more block specific details in Cuiloa
              </a>
            </Text>
          </VStack>
          <VStack
            paddingTop="40px"
            width={"100%"}
            spacing={"60px"}
            fontSize={"large"}
            fontFamily={"monospace"}
            alignContent={"center"}
            textAlign={"center"}
            paddingBottom={"40px"}
          >
            <DataBox
              title="Positions Opened"
              dataLength={blockData!.openEvents.length}
              type={DataBoxType.OPEN_POSITIONS}
            />
            <DataBox
              title="Arbs"
              dataLength={blockData!.arbExecutions.length}
              type={DataBoxType.ARBS}
            />
            <DataBox
              title="Batch Swaps"
              dataLength={blockData!.swapExecutions.length}
              type={DataBoxType.SWAPS}
            />
            <DataBox
              title="Positions Closed"
              dataLength={blockData!.closeEvents.length}
              type={DataBoxType.CLOSE_POSITIONS}
            />
          </VStack>
        </>
      )}
    </Layout>
  );
}
