import { InfoRow } from './info-row';

export const InfoRowGasFee = ({ gasFee, symbol }: { gasFee: number | null; symbol: string }) => {
  return (
    <InfoRow
      label='Gas Fee'
      isLoading={gasFee === null}
      value={`${gasFee} ${symbol}`}
      toolTip='The gas cost of the transaction. Gas fees are burned as part of transaction processing.'
    />
  );
};
