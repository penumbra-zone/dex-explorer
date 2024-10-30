import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';
import { SimulationQuerier } from '@/shared/utils/protos/services/dex/simulated-trades.ts';
import {
  SimulateTradeRequest,
  SimulateTradeResponse,
  SwapExecution_Trace,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Value, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { formatAmount, removeTrailingZeros } from '@penumbra-zone/types/amount';
import BigNumber from 'bignumber.js';
import { JsonValue } from '@bufbuild/protobuf';

interface Trace {
  price: string;
  amount: string;
  total: string;
  hops: ValueView[];
}

interface BuySellTraces {
  buy: Trace[];
  sell: Trace[];
}

export interface RouteBookResponse {
  singleHops: BuySellTraces;
  multiHops: BuySellTraces;
}

interface TraceJson {
  price: string;
  amount: string;
  total: string;
  hops: JsonValue[];
}

interface BuySellTracesJson {
  buy: TraceJson[];
  sell: TraceJson[];
}

export interface RouteBookResponseJson {
  singleHops: BuySellTracesJson;
  multiHops: BuySellTracesJson;
}

export const deserializeRouteBookResponseJson = ({
  singleHops,
  multiHops,
}: RouteBookResponseJson): RouteBookResponse => {
  return {
    singleHops: deserializeBuySellTraces(singleHops),
    multiHops: deserializeBuySellTraces(multiHops),
  };
};

const serializeTrace = (trace: Trace): TraceJson => {
  return {
    price: trace.price,
    amount: trace.amount,
    total: trace.total,
    hops: trace.hops.map(v => v.toJson()),
  };
};

const deserializeTrace = (trace: TraceJson): Trace => {
  return {
    price: trace.price,
    amount: trace.amount,
    total: trace.total,
    hops: trace.hops.map(v => ValueView.fromJson(v)),
  };
};

const serializeBuySellTraces = (traces: BuySellTraces): BuySellTracesJson => {
  return {
    buy: traces.buy.map(serializeTrace),
    sell: traces.sell.map(serializeTrace),
  };
};

const deserializeBuySellTraces = (traces: BuySellTracesJson): BuySellTraces => {
  return {
    buy: traces.buy.map(deserializeTrace),
    sell: traces.sell.map(deserializeTrace),
  };
};

const serializeResponse = ({
  singleHops,
  multiHops,
}: {
  singleHops: BuySellTraces;
  multiHops: BuySellTraces;
}): RouteBookResponseJson => {
  return {
    singleHops: serializeBuySellTraces(singleHops),
    multiHops: serializeBuySellTraces(multiHops),
  };
};

const VERY_HIGH_AMOUNT = new Amount({ hi: 10000n });
const TRACE_LIMIT_DEFAULT = 8;

const getValueView = (registry: Registry, { amount, assetId }: Value) => {
  const metadata = assetId ? registry.tryGetMetadata(assetId) : undefined;
  return new ValueView({
    valueView: metadata
      ? {
          case: 'knownAssetId',
          value: { amount, metadata },
        }
      : {
          case: 'unknownAssetId',
          value: {
            amount,
            assetId,
          },
        },
  });
};

const processSimulation = (
  res: SimulateTradeResponse,
  registry: Registry,
  limit: number,
): Trace[] => {
  let cumulativeTotal = new BigNumber(0);
  const traces: Trace[] = [];
  for (const t of res.output?.traces.slice(0, limit) ?? []) {
    const res = getPriceForTrace(t, registry, cumulativeTotal);
    traces.push(res);
    cumulativeTotal = new BigNumber(res.total);
  }
  return traces;
};

export const getPriceForTrace = (
  trace: SwapExecution_Trace,
  registry: Registry,
  cumulativeTotal: BigNumber,
): Trace => {
  const inputValue = trace.value[0];
  const outputValue = trace.value[trace.value.length - 1];

  if (!inputValue?.amount || !outputValue?.amount || !inputValue.assetId || !outputValue.assetId) {
    throw new Error('');
  }

  const firstValueMetadata = registry.getMetadata(inputValue.assetId);
  const lastValueMetadata = registry.getMetadata(outputValue.assetId);

  const inputDisplayDenomExponent = getDisplayDenomExponent.optional(firstValueMetadata) ?? 0;
  const outputDisplayDenomExponent = getDisplayDenomExponent.optional(lastValueMetadata) ?? 0;
  const formattedInputAmount = formatAmount({
    amount: inputValue.amount,
    exponent: inputDisplayDenomExponent,
  });
  const formattedOutputAmount = formatAmount({
    amount: outputValue.amount,
    exponent: outputDisplayDenomExponent,
  });

  const outputToInputRatio = new BigNumber(formattedOutputAmount)
    .dividedBy(formattedInputAmount)
    .toFormat(outputDisplayDenomExponent);

  return {
    price: removeTrailingZeros(outputToInputRatio),
    amount: formattedInputAmount,
    total: removeTrailingZeros(
      cumulativeTotal.plus(formattedInputAmount).toFormat(outputDisplayDenomExponent),
    ),
    hops: trace.value.map(v => getValueView(registry, v)),
  };
};

type AllResponses = RouteBookResponseJson | { error: string };

export async function GET(req: NextRequest): Promise<NextResponse<AllResponses>> {
  const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'];
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!grpcEndpoint || !chainId) {
    return NextResponse.json(
      { error: 'PENUMBRA_GRPC_ENDPOINT or PENUMBRA_CHAIN_ID is not set' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const baseAssetSymbol = searchParams.get('baseAsset');
  const quoteAssetSymbol = searchParams.get('quoteAsset');
  const traceParam = searchParams.get('traceLimit');
  const traceLimit = traceParam ? Number(traceParam) : TRACE_LIMIT_DEFAULT;
  if (!baseAssetSymbol || !quoteAssetSymbol) {
    return NextResponse.json(
      { error: 'Missing required baseAsset or quoteAsset' },
      { status: 400 },
    );
  }

  const registryClient = new ChainRegistryClient();
  const registry = await registryClient.remote.get(chainId);

  // TODO: Add getMetadataBySymbol() helper to registry npm package
  const allAssets = registry.getAllAssets();
  const baseAssetMetadata = allAssets.find(
    a => a.symbol.toLowerCase() === baseAssetSymbol.toLowerCase(),
  );
  const quoteAssetMetadata = allAssets.find(
    a => a.symbol.toLowerCase() === quoteAssetSymbol.toLowerCase(),
  );
  if (!baseAssetMetadata || !quoteAssetMetadata) {
    return NextResponse.json(
      { error: `Base asset or quoteAsset metadata not found in registry` },
      { status: 400 },
    );
  }

  const buySideRequest = new SimulateTradeRequest({
    input: new Value({
      assetId: baseAssetMetadata.penumbraAssetId,
      amount: VERY_HIGH_AMOUNT,
    }),
    output: quoteAssetMetadata.penumbraAssetId,
  });

  const sellSideRequest = new SimulateTradeRequest({
    input: new Value({
      assetId: quoteAssetMetadata.penumbraAssetId,
      amount: VERY_HIGH_AMOUNT,
    }),
    output: baseAssetMetadata.penumbraAssetId,
  });

  // TODO: Move try to only wrap simulate trade
  try {
    const simQuerier = new SimulationQuerier({ grpcEndpoint });
    const buyRes = await simQuerier.simulateTrade(buySideRequest);
    const buyMulti = processSimulation(buyRes, registry, traceLimit);
    const sellRes = await simQuerier.simulateTrade(sellSideRequest);
    const sellMulti = processSimulation(sellRes, registry, traceLimit);

    return NextResponse.json(
      serializeResponse({
        singleHops: {
          buy: buyMulti.filter(t => t.hops.length === 2),
          sell: sellMulti.filter(t => t.hops.length === 2),
        },
        multiHops: { buy: buyMulti, sell: sellMulti },
      }),
    );
  } catch (error) {
    // If the error contains 'there are no orders to fulfill this swap', there are no orders to fulfill the trade, so just return an empty array
    if (
      error instanceof Error &&
      error.message.includes('there are no orders to fulfill this swap')
    ) {
      // return NextResponse.json(new SimulateTradeResponse().toJson());
    }

    return NextResponse.json(
      { error: `Error retrieving route book: ${String(error)}` },
      { status: 500 },
    );
  }
}
