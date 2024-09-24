import { uint8ArrayToBech32 } from '@/utils/encoding';
import { fetchTokenAsset } from '@/utils/token/tokenFetch';
import { Text, Avatar, HStack } from '@chakra-ui/react';

function showAmount(amount: bigint, decimals: number): string {
  const text = amount.toString();
  const end = Math.min(decimals, text.length);
  const start = text.length - end;
  let startText = text.substring(0, start);
  if (startText.length === 0) {
    startText = '0';
  }
  const endText = text.substring(start);
  return `${startText}.${endText}`;
}

export default function AssetView({ asset, amount }: { asset: Uint8Array; amount: bigint }) {
  const token = fetchTokenAsset(asset);
  if (!token) {
    throw new Error(`unknown asset ${uint8ArrayToBech32('passet', asset)}`);
  }

  return (
    <HStack>
      <Avatar name={token.display} src={token.imagePath} size='xs' borderRadius='50%' />
      <Text fontSize={'small'} fontFamily={'monospace'}>
        {showAmount(amount, token.decimals)} {token.symbol}
      </Text>
    </HStack>
  );
}
