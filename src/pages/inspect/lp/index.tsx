'use client';

import { useParams } from 'next/navigation';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';
import { useLpPosition } from './api/position';
import { JsonViewer } from '@textea/json-viewer';
import { Tooltip, TooltipProvider } from '@penumbra-zone/ui/Tooltip';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { useAssets } from '@/shared/api/assets';
import { getValueView } from '@/shared/api/server/book/helpers';
import { Value, AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { useRegistry } from '@/shared/api/registry';
import { ExecutionWithReserves, VolumeAndFees } from '@/shared/database';
import { DexExPositionReserves, DexExPositionState, DexExPositionWithdrawals } from '@/shared/database/schema';
import { Selectable } from 'kysely';
import { splitLoHi } from '@penumbra-zone/types/lo-hi';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Icon } from '@penumbra-zone/ui/Icon';
import { Density } from '@penumbra-zone/ui/Density';
import { Card } from '@penumbra-zone/ui/Card';
import { bech32m } from 'bech32';
import { PositionStateWithReserves } from '@/shared/database';
import { Table } from '@penumbra-zone/ui/Table';

const TimeDisplay = ({ datetime, height }: { datetime: Date, height: number }) => {
    const localDate = new Date(datetime);
    const utcDate = localDate.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
    });

    return (
        <div className="flex flex-col items-center justify-center">
            <Text small color="text.secondary">
                Block #{height}
            </Text>
            {/*<Tooltip message={utcDate}> -- error with tooltip provider?*/}
            <Text small color="text.secondary">
                {localDate.toLocaleString()}
            </Text>
        </div>
    );
};

interface ExecutionDetailsProps {
    ewr: ExecutionWithReserves;
    state: Selectable<DexExPositionState>;
}

const ExecutionDetails = ({ ewr, state }: ExecutionDetailsProps) => {
    const { data: registryData } = useRegistry();

    if (!registryData) {
        return <div>Loading...</div>;
    }

    // Create Value objects for deltas, lambdas, and fees
    const valueDelta1 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.delta_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });

    const valueDelta2 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.delta_2)),
        assetId: new AssetId({ inner: new Uint8Array(state.asset_2.data) }),
    });

    const valueLambda1 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.lambda_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });

    const valueLambda2 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.lambda_2)),
        assetId: new AssetId({ inner: new Uint8Array(state.asset_2.data) }),
    });

    const valueFee1 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.fee_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });

    const valueFee2 = new Value({
        amount: splitLoHi(BigInt(ewr.execution.fee_2)),
        assetId: new AssetId({ inner: new Uint8Array(state.asset_2.data) }),
    });

    // Get ValueViews
    const valueViewDelta1 = getValueView(registryData, valueDelta1);
    const valueViewDelta2 = getValueView(registryData, valueDelta2);
    const valueViewLambda1 = getValueView(registryData, valueLambda1);
    const valueViewLambda2 = getValueView(registryData, valueLambda2);
    const valueViewFee1 = getValueView(registryData, valueFee1);
    const valueViewFee2 = getValueView(registryData, valueFee2);

    // Determine trade direction and values
    const isAsset1Input = BigInt(ewr.execution.delta_1) !== 0n;
    const input = isAsset1Input ? valueViewDelta1 : valueViewDelta2;
    const output = isAsset1Input ? valueViewLambda2 : valueViewLambda1;
    const fee = isAsset1Input ? valueViewFee1 : valueViewFee2;

    // Create Value objects for reserves
    const valueReserves1 = new Value({
        amount: splitLoHi(BigInt(ewr.reserves.reserves_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });
    const valueReserves2 = new Value({
        amount: splitLoHi(BigInt(ewr.reserves.reserves_2)),
        assetId: new AssetId({ inner: new Uint8Array(state.asset_2.data) }),
    });
    const stubValueContextStart = new Value({
        amount: splitLoHi(BigInt(0)),
        assetId: new AssetId({ inner: Uint8Array.from(ewr.execution.context_asset_start.data) }),
    });
    const stubValueContextEnd = new Value({
        amount: splitLoHi(BigInt(0)),
        assetId: new AssetId({ inner: Uint8Array.from(ewr.execution.context_asset_end.data) }),
    });

    const valueViewReserves1 = getValueView(registryData, valueReserves1);
    const valueViewReserves2 = getValueView(registryData, valueReserves2);
    const valueViewContextStart = getValueView(registryData, stubValueContextStart);
    const valueViewContextEnd = getValueView(registryData, stubValueContextEnd);


    return (
        <Card>
            <Density compact>
                <div className="flex flex-col gap-2">
                    <div className="flex items-end gap-2">
                        <div className="flex flex-col items-start gap-1">
                            <ValueViewComponent valueView={input} abbreviate={false} />
                            <Text color="text.secondary" xxs>Trade Input</Text>
                        </div>
                        <div className="flex items-center pb-5">
                            <Icon IconComponent={ArrowRight} color="text.primary" size='sm' />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <ValueViewComponent valueView={output} abbreviate={false} />
                            <Text color="text.secondary" xxs>Trade Output</Text>
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <ValueViewComponent valueView={fee} priority="secondary" abbreviate={false} />
                            <Text color="text.secondary" xxs>LP Fee</Text>
                        </div>
                    </div>
                    <div className="flex justify-between items-end gap-2">
                        <div className="flex items-center gap-2">
                            <Text color="text.secondary" small>Routing</Text>
                            <ValueViewComponent valueView={valueViewContextStart} context="table" showValue={false} />
                            <Icon IconComponent={ArrowRight} color="text.primary" size='sm' />
                            <ValueViewComponent valueView={valueViewContextEnd} context="table" showValue={false} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Text color="text.secondary" xxs>New Reserves</Text>
                            <div className="flex items-center gap-2">
                                <ValueViewComponent valueView={valueViewReserves1} context="table" abbreviate={false} />
                                <ValueViewComponent valueView={valueViewReserves2} context="table" abbreviate={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </Density>
        </Card>
    );
};

interface PositionDetailsProps {
    position: PositionStateWithReserves;
    volumeAndFees: VolumeAndFees[];
}

const PositionDetails = ({ position, volumeAndFees }: PositionDetailsProps) => {
    const { data: registryData } = useRegistry();

    if (!registryData) {
        return <div>Loading...</div>;
    }

    // Calculate the bech32m encoded position ID
    const positionId = (() => {
        const words = bech32m.toWords(position.state.position_id.data);
        return bech32m.encode('plpid', words);
    })();

    // Create value views for reserves 1 and 2
    const valueReserves1 = new Value({
        amount: splitLoHi(BigInt(position.latest_reserves.reserves_1)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_1.data) }),
    });
    const valueReserves2 = new Value({
        amount: splitLoHi(BigInt(position.latest_reserves.reserves_2)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_2.data) }),
    });

    const valueViewReserves1 = getValueView(registryData, valueReserves1);
    const valueViewReserves2 = getValueView(registryData, valueReserves2);

    const offer2Amount = (1 / position.state.effective_price_1_to_2) * Number(position.latest_reserves.reserves_1);
    const offer1Amount = (1 / position.state.effective_price_2_to_1) * Number(position.latest_reserves.reserves_2);
    //const offer2Amount = (1 / position.state.effective_price_1_to_2) * 1202702
    //const offer1Amount = (1 / position.state.effective_price_2_to_1) * 1599401

    const valueOffer1 = new Value({
        amount: splitLoHi(BigInt(Math.floor(offer1Amount))),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_1.data) }),
    });
    const valueOffer2 = new Value({
        amount: splitLoHi(BigInt(Math.floor(offer2Amount))),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_2.data) }),
    });
    const valueViewOffer1 = getValueView(registryData, valueOffer1);
    const valueViewOffer2 = getValueView(registryData, valueOffer2);

    const unit1Amount = 1000000; // TODO: set based on metadata instead of assuming 1e6
    const unit2Amount = 1000000; // TODO: set based on metadata instead of assuming 1e6
    const priceRef1Amount = Math.floor((1 / position.state.effective_price_2_to_1) * unit2Amount);
    const priceRef1AmountInv = Math.floor(position.state.effective_price_2_to_1 * unit1Amount);
    const priceRef2Amount = Math.floor((1 / position.state.effective_price_1_to_2) * unit1Amount);
    const priceRef2AmountInv = Math.floor(position.state.effective_price_1_to_2 * unit2Amount);

    const valueViewUnit1 = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(unit1Amount)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_1.data) }),
    }));
    const valueViewUnit2 = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(unit2Amount)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_2.data) }),
    }));
    const valueViewPriceRef1 = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(priceRef1Amount)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_1.data) }),
    }));
    const valueViewPriceRef1Inv = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(priceRef1AmountInv)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_2.data) }),
    }));
    const valueViewPriceRef2 = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(priceRef2Amount)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_2.data) }),
    }));
    const valueViewPriceRef2Inv = getValueView(registryData, new Value({
        amount: splitLoHi(BigInt(priceRef2AmountInv)),
        assetId: new AssetId({ inner: Uint8Array.from(position.state.asset_1.data) }),
    }));

    return (
        <Card title="Liquidity Position">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-2">
                    <Text color="text.secondary">Fee Tier</Text>
                    <Text color="text.primary">{position.state.fee_bps / 100}%</Text>
                </div>
                <div className="font-mono overflow-x-auto">
                    <Text color="text.secondary">
                        {positionId}
                    </Text>
                </div>
            </div>


            <div className="flex justify-between items-start gap-8">
                {/* Column 1: Current Reserves */}
                <div className="flex flex-col gap-2">
                    <Text color="text.secondary">Current Reserves</Text>
                    <div className="flex flex-col gap-6">
                        <ValueViewComponent valueView={valueViewReserves1} abbreviate={false} />
                        <ValueViewComponent valueView={valueViewReserves2} abbreviate={false} />
                    </div>
                </div>

                {/* Column 2: Sell Offers */}
                <div className="flex flex-col gap-2">
                    <Text color="text.secondary">Sell Offer</Text>
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <Icon IconComponent={ArrowLeftRight} color="text.primary" size='lg' />
                            <ValueViewComponent valueView={valueViewOffer2} abbreviate={false} priority='secondary' />
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon IconComponent={ArrowLeftRight} color="text.primary" size='lg' />
                            <ValueViewComponent valueView={valueViewOffer1} abbreviate={false} priority='secondary' />
                        </div>
                    </div>
                </div>

                {/* Column 3: Prices */}
                <div className="flex flex-col gap-2">
                    <Text color="text.secondary">Prices</Text>
                    <Density compact>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    <ValueViewComponent valueView={valueViewUnit1} context="table" />
                                    <Text color="text.secondary">=</Text>
                                    <ValueViewComponent valueView={valueViewPriceRef1Inv} context="table" />
                                </div>
                                <div className="flex items-center">
                                    <ValueViewComponent valueView={valueViewUnit2} context="table" />
                                    <Text color="text.secondary">=</Text>
                                    <ValueViewComponent valueView={valueViewPriceRef1} context="table" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    <ValueViewComponent valueView={valueViewUnit1} context="table" />
                                    <Text color="text.secondary">=</Text>
                                    <ValueViewComponent valueView={valueViewPriceRef2} context="table" />
                                </div>
                                <div className="flex items-center">
                                    <ValueViewComponent valueView={valueViewUnit2} context="table" />
                                    <Text color="text.secondary">=</Text>
                                    <ValueViewComponent valueView={valueViewPriceRef2Inv} context="table" />
                                </div>
                            </div>
                        </div>
                    </Density>
                </div>
            </div>

            {/* Add fee summary table here */}
            <VolumeAndFeesTable volumeAndFees={volumeAndFees} state={position.state} />
        </Card>
    );
};

interface PositionWithdrawProps {
    withdrawal: Selectable<DexExPositionWithdrawals>;
    state: Selectable<DexExPositionState>;
}

const PositionWithdraw = ({ withdrawal, state }: PositionWithdrawProps) => {
    const { data: registryData } = useRegistry();

    if (!registryData) {
        return <div>Loading...</div>;
    }

    // Create Value objects for reserves
    const valueReserves1 = new Value({
        amount: splitLoHi(BigInt(withdrawal.reserves_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });
    const valueReserves2 = new Value({
        amount: splitLoHi(BigInt(withdrawal.reserves_2)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
    });

    // Get ValueViews
    const valueViewReserves1 = getValueView(registryData, valueReserves1);
    const valueViewReserves2 = getValueView(registryData, valueReserves2);

    return (
        <div className="grid grid-cols-6 items-center mb-4">
            <div className="col-span-4">
                <Card title="Position Withdraw">
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <ValueViewComponent valueView={valueViewReserves1} abbreviate={false} />
                            <ValueViewComponent valueView={valueViewReserves2} abbreviate={false} />
                        </div>
                    </div>
                    <Text color="text.secondary">
                        Transaction hash goes here
                    </Text>
                </Card>
            </div>
            <div className="col-span-2">
                <TimeDisplay
                    datetime={withdrawal.time}
                    height={withdrawal.height}
                />
            </div>
        </div>
    );
};

interface PositionOpenProps {
    state: Selectable<DexExPositionState>;
    opening_reserves: Selectable<DexExPositionReserves>;
}

const PositionOpen = ({ state, opening_reserves }: PositionOpenProps) => {
    const { data: registryData } = useRegistry();

    if (!registryData) {
        return <div>Loading...</div>;
    }

    // Create Value objects for opening reserves
    const valueReserves1 = new Value({
        amount: splitLoHi(BigInt(opening_reserves.reserves_1)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });
    const valueReserves2 = new Value({
        amount: splitLoHi(BigInt(opening_reserves.reserves_2)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
    });

    // Get ValueViews
    const valueViewReserves1 = getValueView(registryData, valueReserves1);
    const valueViewReserves2 = getValueView(registryData, valueReserves2);

    return (
        <div className="grid grid-cols-6 items-center mb-4">
            <div className="col-span-4">
                <Card title="Position Open">
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <ValueViewComponent valueView={valueViewReserves1} abbreviate={false} />
                            <ValueViewComponent valueView={valueViewReserves2} abbreviate={false} />
                        </div>
                    </div>
                    <Text color="text.secondary">
                        Transaction hash goes here
                    </Text>
                </Card>
            </div>
            <div className="col-span-2">
                <TimeDisplay
                    datetime={state.opening_time}
                    height={state.opening_height}
                />
            </div>
        </div>
    );
};

interface VolumeAndFeesTableProps {
    volumeAndFees: VolumeAndFees[];
    state: Selectable<DexExPositionState>;
}

const VolumeAndFeesTable = ({ volumeAndFees, state }: VolumeAndFeesTableProps) => {
    const { data: registryData } = useRegistry();

    if (!registryData) return null;

    // Create stub values for column headers
    const stubValue1 = new Value({
        amount: splitLoHi(BigInt(0)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
    });
    const stubValue2 = new Value({
        amount: splitLoHi(BigInt(0)),
        assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
    });
    const valueView1 = getValueView(registryData, stubValue1);
    const valueView2 = getValueView(registryData, stubValue2);

    // Calculate totals
    const totals = volumeAndFees.reduce((acc, row) => ({
        volume1: acc.volume1 + BigInt(row.volume1),
        volume2: acc.volume2 + BigInt(row.volume2),
        fees1: acc.fees1 + BigInt(row.fees1),
        fees2: acc.fees2 + BigInt(row.fees2),
        executionCount: acc.executionCount + row.executionCount,
    }), {
        volume1: 0n,
        volume2: 0n,
        fees1: 0n,
        fees2: 0n,
        executionCount: 0,
    });

    return (
        <Density compact>
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>
                            <Text color="text.secondary">Volume By Route</Text>
                        </Table.Th>
                        <Table.Th>
                            <Text color="text.secondary">Execs</Text>
                        </Table.Th>
                        <Table.Th>
                            <div className="flex items-center gap-1">
                                <Text color="text.secondary">Vol.</Text>
                                <ValueViewComponent valueView={valueView1} context="table" showValue={false} />
                            </div>
                        </Table.Th>
                        <Table.Th>
                            <div className="flex items-center gap-1">
                                <Text color="text.secondary">Vol.</Text>
                                <ValueViewComponent valueView={valueView2} context="table" showValue={false} />
                            </div>
                        </Table.Th>
                        <Table.Th>
                            <div className="flex items-center gap-1">
                                <Text color="text.secondary">Fees</Text>
                                <ValueViewComponent valueView={valueView1} context="table" showValue={false} />
                            </div>
                        </Table.Th>
                        <Table.Th>
                            <div className="flex items-center gap-1">
                                <Text color="text.secondary">Fees</Text>
                                <ValueViewComponent valueView={valueView2} context="table" showValue={false} />
                            </div>
                        </Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    <Table.Tr>
                        <Table.Td hAlign="center">
                            <Text color="text.secondary">Total</Text>
                        </Table.Td>
                        <Table.Td hAlign="center">
                            <Text color="text.secondary">{totals.executionCount}</Text>
                        </Table.Td>
                        <Table.Td>
                            <ValueViewComponent
                                valueView={getValueView(registryData, new Value({
                                    amount: splitLoHi(BigInt(totals.volume1)),
                                    assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
                                }))}
                                abbreviate={true}
                            />
                        </Table.Td>
                        <Table.Td>
                            <ValueViewComponent
                                valueView={getValueView(registryData, new Value({
                                    amount: splitLoHi(BigInt(totals.volume2)),
                                    assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
                                }))}
                                abbreviate={true}
                            />
                        </Table.Td>
                        <Table.Td>
                            <ValueViewComponent
                                valueView={getValueView(registryData, new Value({
                                    amount: splitLoHi(BigInt(totals.fees1)),
                                    assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
                                }))}
                                abbreviate={true}
                            />
                        </Table.Td>
                        <Table.Td>
                            <ValueViewComponent
                                valueView={getValueView(registryData, new Value({
                                    amount: splitLoHi(BigInt(totals.fees2)),
                                    assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
                                }))}
                                abbreviate={true}
                            />
                        </Table.Td>
                    </Table.Tr>
                    {volumeAndFees.map((row, i) => {
                        const contextStartValue = new Value({
                            amount: splitLoHi(BigInt(0)),
                            assetId: new AssetId({ inner: Uint8Array.from(row.context_asset_start.data) }),
                        });
                        const contextEndValue = new Value({
                            amount: splitLoHi(BigInt(0)),
                            assetId: new AssetId({ inner: Uint8Array.from(row.context_asset_end.data) }),
                        });
                        return (
                            <Table.Tr key={i}>
                                <Table.Td>
                                    <div className="flex items-center gap-2">
                                        <ValueViewComponent valueView={getValueView(registryData, contextStartValue)} context="table" showValue={false} />
                                        <Icon IconComponent={ArrowRight} color="text.primary" size='sm' />
                                        <ValueViewComponent valueView={getValueView(registryData, contextEndValue)} context="table" showValue={false} />
                                    </div>
                                </Table.Td>
                                <Table.Td hAlign="center">
                                    <Text color="text.secondary">{row.executionCount}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <ValueViewComponent
                                        valueView={getValueView(registryData, new Value({
                                            amount: splitLoHi(BigInt(row.volume1)),
                                            assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
                                        }))}
                                        abbreviate={true}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <ValueViewComponent
                                        valueView={getValueView(registryData, new Value({
                                            amount: splitLoHi(BigInt(row.volume2)),
                                            assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
                                        }))}
                                        abbreviate={true}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <ValueViewComponent
                                        valueView={getValueView(registryData, new Value({
                                            amount: splitLoHi(BigInt(row.fees1)),
                                            assetId: new AssetId({ inner: Uint8Array.from(state.asset_1.data) }),
                                        }))}
                                        abbreviate={true}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <ValueViewComponent
                                        valueView={getValueView(registryData, new Value({
                                            amount: splitLoHi(BigInt(row.fees2)),
                                            assetId: new AssetId({ inner: Uint8Array.from(state.asset_2.data) }),
                                        }))}
                                        abbreviate={true}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Density>
    );
};

export const LpInspectPage = () => {
    const { data: registryData } = useRegistry();
    const params = useParams();
    const id = params?.['id'] as string;
    const { data: position, isLoading, error } = useLpPosition(id);

    const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();

    if (error || assetsError) {
        return (
            <section className="p-4">
                <Text color="destructive.main">
                    Error loading LP position: {String(error || assetsError)}
                </Text>
            </section>
        );
    }

    if (isLoading || assetsLoading || !assets || !position || !registryData) {
        return (
            <section className="p-4">
                <div className="h-[400px]">
                    <Skeleton />
                </div>
            </section>
        );
    }

    return (
        <section className="p-4">
            <div className="max-w-[800px] mx-auto">
                <PositionDetails
                    position={position.state}
                    volumeAndFees={position.volumeAndFees}
                />

                <div className="mt-4">
                    {position?.withdrawals.map(withdrawal => (
                        <PositionWithdraw
                            key={withdrawal.height}
                            withdrawal={withdrawal}
                            state={position.state.state}
                        />
                    ))}

                    {position?.state.state.closing_height && position?.state.state.closing_time && (
                        <div className="grid grid-cols-6 items-center mb-4">
                            <div className="col-span-4 ">
                                <Card title="Position Closed">
                                    <Text color="text.secondary">
                                        Transaction Hash goes here
                                    </Text>
                                </Card>
                            </div>
                            <div className="col-span-2">
                                <TimeDisplay
                                    datetime={position.state.state.closing_time}
                                    height={position.state.state.closing_height}
                                />
                            </div>
                        </div>
                    )}

                    {position?.executions.map(execution => (
                        <div key={execution.execution.height} className="grid grid-cols-6 items-center mb-4">
                            <div className="col-span-2">
                                <TimeDisplay
                                    datetime={execution.execution.time}
                                    height={execution.execution.height}
                                />
                            </div>
                            <div className="col-span-4">
                                <ExecutionDetails ewr={execution} state={position.state.state} />
                            </div>
                        </div>
                    ))}

                    {position.skippedExecutions > 0 && (
                        <div className="grid grid-cols-6 items-center mb-4">
                            <div className="col-span-2">
                            </div>
                            <div className="col-span-4">
                                <Card>
                                    <div className="text-center">
                                        <Text color="text.secondary">
                                            {position.skippedExecutions} more executions skipped
                                        </Text>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    <PositionOpen
                        state={position.state.state}
                        opening_reserves={position.state.opening_reserves}
                    />
                </div>

                <Card title="Debug View">
                    <JsonViewer
                        value={position}
                        defaultInspectDepth={0}
                        theme="dark"
                        displayDataTypes={false}
                        enableClipboard
                        rootName={false}
                    />
                </Card>
            </div>
        </section>
    );
}; 