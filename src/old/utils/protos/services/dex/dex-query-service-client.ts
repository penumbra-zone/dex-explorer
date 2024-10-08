// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
import { PromiseClient } from '@connectrpc/connect';
import { createClient } from '../utils';
import { DexService } from '@penumbra-zone/protobuf';
import {
  PositionId,
  Position,
  DirectedTradingPair,
  SwapExecution,
  CandlestickData,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import {
  DexQueryServiceClientInterface,
  SwapExecutionWithBlockHeight,
} from '../../types/DexQueryServiceClientInterface';
import { Readable } from 'stream';

export class DexQueryServiceClient implements DexQueryServiceClientInterface {
  private readonly client: PromiseClient<typeof DexService>;

  constructor({ grpcEndpoint }: { grpcEndpoint: string }) {
    this.client = createClient(grpcEndpoint, DexService);
  }

  async liquidityPositionById(positionId: PositionId): Promise<Position | undefined> {
    // console.log('liquidityPositionById', positionId)
    const res = await this.client.liquidityPositionById({ positionId });
    return res.data;
  }

  async liquidityPositionsByPrice(
    tradingPair: DirectedTradingPair,
    limit: number,
  ): Promise<Position[] | undefined> {
    const res = await this.client.liquidityPositionsByPrice({
      tradingPair,
      limit: BigInt(limit),
    });

    if (!res[Symbol.asyncIterator]) {
      console.error('Received:', res);
      throw new Error(
        'Received an unexpected response type from the server, expected an async iterable.',
      );
    }

    const positions: Position[] = [];
    // Res is Symbol(Symbol.asyncIterator)]: [Function: [Symbol.asyncIterator]]
    for await (const position of res as Readable) {
      positions.push(position.data);
    }
    return positions;
  }

  async arbExecutions(
    startHeight: number,
    endHeight: number,
  ): Promise<SwapExecutionWithBlockHeight[] | undefined> {
    const res = await this.client.arbExecutions({
      startHeight: BigInt(startHeight),
      endHeight: BigInt(endHeight),
    });

    if (!res[Symbol.asyncIterator]) {
      console.error('Received:', res);
      throw new Error(
        'Received an unexpected response type from the server, expected an async iterable.',
      );
    }

    const arbs: SwapExecutionWithBlockHeight[] = [];
    for await (const arb of res as Readable) {
      const swapExecution: SwapExecution = arb.swapExecution;
      const blockHeight = Number(arb.height);
      arbs.push({ swapExecution, blockHeight });
    }
    return arbs;
  }

  async swapExecutions(
    startHeight: number,
    endHeight: number,
  ): Promise<SwapExecutionWithBlockHeight[] | undefined> {
    const res = await this.client.swapExecutions({
      startHeight: BigInt(startHeight),
      endHeight: BigInt(endHeight),
    });

    if (!res[Symbol.asyncIterator]) {
      console.error('Received:', res);
      throw new Error(
        'Received an unexpected response type from the server, expected an async iterable.',
      );
    }

    const swaps: SwapExecutionWithBlockHeight[] = [];
    for await (const swap of res as Readable) {
      const swapExecution: SwapExecution = swap.swapExecution;
      const blockHeight = Number(swap.height);
      swaps.push({ swapExecution, blockHeight });
    }
    return swaps;
  }

  async candlestickData(
    pair: DirectedTradingPair,
    startHeight: number,
    limit: number,
  ): Promise<CandlestickData[] | undefined> {
    const res = await this.client.candlestickData({
      pair,
      startHeight: BigInt(startHeight),
      limit: BigInt(limit),
    });

    return res.data;
  }
}
