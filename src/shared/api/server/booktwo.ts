import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { SimulationQuerier } from '@/shared/utils/protos/services/dex/simulated-trades.ts';
import {
  SimulateTradeRequest,
  SwapExecution_Trace,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import {
  Value,
  ValueView,
  Metadata,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { formatAmount, removeTrailingZeros } from '@penumbra-zone/types/amount';
import BigNumber from 'bignumber.js';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';

interface Trace {
  price: number;
  amount: Amount;
  hops: ValueView[];
}

export interface SimulationResponse {
  singleHops: ValueView[];
  multiHops: ValueView[];
}

const VERY_HIGH_AMOUNT = new Amount({ hi: 10000n });

export const getPriceForTrace = ({
  trace,
  metadataByAssetId,
}: {
  trace: SwapExecution_Trace;
  metadataByAssetId: Record<string, Metadata>;
}) => {
  const inputValue = trace.value[0];
  const outputValue = trace.value[trace.value.length - 1];

  if (!inputValue?.amount || !outputValue?.amount || !inputValue.assetId || !outputValue.assetId) {
    throw new Error('');
  }

  const firstValueMetadata = metadataByAssetId[bech32mAssetId(inputValue.assetId)];
  const lastValueMetadata = metadataByAssetId[bech32mAssetId(outputValue.assetId)];

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

  return removeTrailingZeros(outputToInputRatio);
};

export async function GET(req: NextRequest) {
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
  const amount = searchParams.get('amount');
  const quoteAssetSymbol = searchParams.get('quoteAsset');
  if (!baseAssetSymbol || !amount || !quoteAssetSymbol) {
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        required: ['baseAsset', 'amount', 'quoteAsset'],
        received: {
          baseAsset: baseAssetSymbol,
          amount,
          quoteAsset: quoteAssetSymbol,
        },
      },
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
    routing: {
      // setting: singleHop ? { case: 'singleHop', value: {} } : { case: 'default', value: {} },
    },
  });

  const sellSideRequest = new SimulateTradeRequest({
    input: new Value({
      assetId: quoteAssetMetadata.penumbraAssetId,
      amount: VERY_HIGH_AMOUNT,
    }),
    output: baseAssetMetadata.penumbraAssetId,
    routing: {
      // setting: singleHop ? { case: 'singleHop', value: {} } : { case: 'default', value: {} },
    },
  });

  try {
    const simQuerier = new SimulationQuerier({ grpcEndpoint });
    const buyRes = await simQuerier.simulateTrade(buySideRequest);
    const mapped = buyRes.output?.traces.map(trace => getPriceForTrace({ trace }));
    const baseDisplayDenomExponent = getDisplayDenomExponent.optional(baseAssetMetadata) ?? 0;
    const quoteDisplayDenomExponent = getDisplayDenomExponent.optional(quoteAssetMetadata) ?? 0;
    const formattedInputAmount = formatAmount({
      amount: inputValue.amount,
      exponent: inputDisplayDenomExponent,
    });
    const formattedOutputAmount = formatAmount({
      amount: quoteValue.amount,
      exponent: quoteDisplayDenomExponent,
    });

    const quoteToInputRatio = new BigNumber(formattedOutputAmount)
      .dividedBy(formattedInputAmount)
      .toFormat(quoteDisplayDenomExponent);

    const quoteToInputFormatted = removeTrailingZeros(quoteToInputRatio);

    const sellRes = await simQuerier.simulateTrade(sellSideRequest);

    return NextResponse.json(res.toJson());
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
