import { useRegistry } from "./registry";
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { decimalsFromDenomUnits, imagePathFromAssetImages } from '@/utils/token/tokenFetch'
import { uint8ArrayToBase64, base64ToUint8Array } from '@/utils/math/base64';
import { Token } from '@/utils/types/token';

export const useTokenAssets = (): Token[] => {
  const { data: registry } = useRegistry();
  if (!registry) {
    return [];
  }

  const assets = registry.getAllAssets();

  return assets
    .filter(asset => asset.penumbraAssetId && !asset.display.startsWith('delegation_'))
    .map(asset => {
      const displayParts = asset.display.split('/');
      return {
        decimals: decimalsFromDenomUnits(asset.denomUnits),
        display: displayParts[displayParts.length - 1] ?? '',
        symbol: asset.symbol,
        inner: asset.penumbraAssetId?.inner && uint8ArrayToBase64(asset.penumbraAssetId.inner),
        imagePath: imagePathFromAssetImages(asset.images),
      };
    }) as Token[];
};

export const useTokenAsset = (tokenId: Uint8Array | string): null | Token => {
  const { data: registry } = useRegistry();

  if (!registry) {
    return null;
  }

  const assetId: AssetId = new AssetId();
  assetId.inner = typeof tokenId !== 'string' ? tokenId : base64ToUint8Array(tokenId);

  const tokenMetadata = registry.getMetadata(assetId);
  const displayParts = tokenMetadata.display.split('/');
  return {
    decimals: decimalsFromDenomUnits(tokenMetadata.denomUnits),
    display: displayParts[displayParts.length - 1] ?? '',
    symbol: tokenMetadata.symbol,
    inner: typeof tokenId !== 'string' ? uint8ArrayToBase64(tokenId) : tokenId,
    imagePath: imagePathFromAssetImages(tokenMetadata.images),
  };
}