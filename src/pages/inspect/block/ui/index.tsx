'use client';

import { useParams } from 'next/navigation';
import { useBlockSummary } from '../api/block';
import { Card } from '@penumbra-zone/ui/Card';
import { Skeleton } from '@/shared/ui/skeleton';
import { BlockSummary } from './block-summary';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';

export function InspectBlock() {
  const params = useParams<{ height: string }>();
  const blockheight = params.height;
  // const { data: blockSummary, isLoading, isError } = useBlockSummary(blockheight);
  const isError = false;
  const isLoading = false;
  const blockSummary = {
    rowid: 1,
    height: blockheight,
    time: new Date(),
    batchSwaps: [
      {
        startAsset: new Metadata({
          display: 'penumbra',
          base: 'upenumbra',
          denomUnits: [
            { denom: 'penumbra', exponent: 6 },
            { denom: 'upenumbra', exponent: 0 },
          ],
        }),
        endAsset: new Metadata({
          display: 'penumbra',
          base: 'upenumbra',
          denomUnits: [
            { denom: 'penumbra', exponent: 6 },
            { denom: 'upenumbra', exponent: 0 },
          ],
        }),
        startPrice: 1.0,
        endPrice: 2.0,
        startAmount: '11.11',
        endAmount: '22.22',
        startValueView: new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: new Amount({ lo: 100n, hi: 0n }),
              metadata: new Metadata({
                display: 'penumbra',
                base: 'upenumbra',
                denomUnits: [
                  { denom: 'penumbra', exponent: 6 },
                  { denom: 'upenumbra', exponent: 0 },
                ],
              }),
            },
          },
        }),
        endValueView: new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: new Amount({ lo: 100n, hi: 0n }),
              metadata: new Metadata({
                display: 'penumbra',
                base: 'upenumbra',
                denomUnits: [
                  { denom: 'penumbra', exponent: 6 },
                  { denom: 'upenumbra', exponent: 0 },
                ],
              }),
            },
          },
        }),
        numSwaps: 3,
      },
      {
        startAsset: new Metadata({
          display: 'penumbra',
          base: 'upenumbra',
          denomUnits: [
            { denom: 'penumbra', exponent: 6 },
            { denom: 'upenumbra', exponent: 0 },
          ],
        }),
        endAsset: new Metadata({
          display: 'penumbra',
          base: 'upenumbra',
          denomUnits: [
            { denom: 'penumbra', exponent: 6 },
            { denom: 'upenumbra', exponent: 0 },
          ],
        }),
        startPrice: 1.0,
        endPrice: 2.0,
        startAmount: '11.11',
        endAmount: '22.22',
        startValueView: new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: new Amount({ lo: 100n, hi: 0n }),
              metadata: new Metadata({
                display: 'penumbra',
                base: 'upenumbra',
                denomUnits: [
                  { denom: 'penumbra', exponent: 6 },
                  { denom: 'upenumbra', exponent: 0 },
                ],
              }),
            },
          },
        }),
        endValueView: new ValueView({
          valueView: {
            case: 'knownAssetId',
            value: {
              amount: new Amount({ lo: 100n, hi: 0n }),
              metadata: new Metadata({
                display: 'penumbra',
                base: 'upenumbra',
                denomUnits: [
                  { denom: 'penumbra', exponent: 6 },
                  { denom: 'upenumbra', exponent: 0 },
                ],
              }),
            },
          },
        }),
        numSwaps: 2,
      },
    ],
    numOpenLps: 0,
    numClosedLps: 0,
    numWithdrawnLps: 0,
    numSwaps: 0,
    numSwapClaims: 0,
    numTxs: 0,
  };

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='mb-4'>
        {isError ? (
          <Card title={`Couldn’t fetch transaction.`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              Something went wrong while fetching the transaction.
            </div>
          </Card>
        ) : (
          <Card title={`Block #${blockheight}`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              {isLoading ? (
                <div>
                  <div className='w-[822px] h-8 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[722px] h-6 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[422px] h-4'>
                    <Skeleton />
                  </div>
                </div>
              ) : (
                <BlockSummary blockSummary={blockSummary} />
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
