import { observer } from 'mobx-react-lite';
import { Button, ButtonProps } from '@penumbra-zone/ui/Button';
import dynamic from 'next/dynamic';
import { useChains } from '@cosmos-kit/react';
import { Wallet2 } from 'lucide-react';
import { Density } from '@penumbra-zone/ui/Density';
import { chainsInPenumbraRegistry } from '@/features/cosmos/chain-provider.tsx';
import { useRegistry } from '@/shared/api/registry.ts';
import { useBalances } from '@/features/cosmos/use-augmented-balances.ts';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import {
  AssetId,
  Metadata,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { toValueView } from '@/shared/utils/value-view';
import { Balance } from '@/features/cosmos/types';
import { useQuery } from '@tanstack/react-query';
import { sha256HashStr } from '@penumbra-zone/crypto-web/sha256';
import { Chain } from '@penumbra-labs/registry';

// Generates penumbra token addresses on counterparty chains.
// IBC address derived from sha256 has of path: https://tutorials.cosmos.network/tutorials/6-ibc-dev/
const generatePenumbraIbcDenoms = async (chains: Chain[]): Promise<string[]> => {
  const ibcAddrs: string[] = [];
  for (const c of chains) {
    const ibcStr = `transfer/${c.counterpartyChannelId}/upenumbra`;
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(ibcStr);

    const hash = await sha256HashStr(encodedString);
    ibcAddrs.push(`ibc/${hash.toUpperCase()}`);
  }
  return ibcAddrs;
};

const usePenumbraIbcDenoms = (chains: Chain[]) => {
  return useQuery({
    queryKey: ['penumbraIbcDenoms', chains],
    queryFn: async () => generatePenumbraIbcDenoms(chains),
    enabled: chains.length > 0,
  });
};

interface CosmosConnectButtonProps {
  actionType?: ButtonProps['actionType'];
  variant?: 'default' | 'minimal';
}

const CosmosConnectButtonInner = observer(
  ({ actionType = 'accent', variant = 'default' }: CosmosConnectButtonProps) => {
    const { data: registry } = useRegistry();
    const penumbraIbcChains = chainsInPenumbraRegistry(registry?.ibcConnections ?? []).map(
      c => c.chain_name,
    );
    const chains = useChains(penumbraIbcChains);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Osmosis is always available
    const { address, disconnect, openView, isWalletConnected } = chains['osmosis']!;

    // Get Penumbra IBC denoms
    const { data: penumbraIbcDenoms = [] } = usePenumbraIbcDenoms(registry?.ibcConnections ?? []);

    const handleConnect = () => {
      openView();
    };

    const { balances } = useBalances();

    // Helper function to convert Cosmos balance to ValueView
    const balanceToValueView = (balance: Balance): ValueView => {
      try {
        // Find matching asset in registry
        if (!registry) {
          throw new Error('Registry not available');
        }

        // Try to match by IBC denom or symbol
        let metadata: Metadata | undefined;

        // For IBC denoms - check if it's a Penumbra asset
        if (balance.denom.startsWith('ibc/')) {
          const isPenumbraAsset = penumbraIbcDenoms.includes(balance.denom);

          if (isPenumbraAsset) {
            // If it's a Penumbra asset, get the Penumbra token metadata
            const allAssets = registry.getAllAssets();
            // Find staking token (Penumbra) metadata
            const penumbraMetadata = allAssets.find(
              asset =>
                asset.symbol.toUpperCase() === 'UM' || asset.symbol.toUpperCase() === 'PENUMBRA',
            );

            if (penumbraMetadata) {
              metadata = penumbraMetadata;
            }
          } else {
            // Try to find other IBC assets
            const allAssets = registry.getAllAssets();
            // Since we can't directly access properties of asset, we need to check symbol
            // against what we expect from the balance
            if (balance.symbol) {
              const matchingAsset = allAssets.find(
                asset => asset.symbol.toLowerCase() === balance.symbol?.toLowerCase(),
              );

              if (matchingAsset) {
                metadata = matchingAsset;
              }
            }
          }
        }
        // For native denoms
        else if (balance.symbol) {
          // Get all assets and find one with matching symbol
          const allAssets = registry.getAllAssets();
          const matchingAsset = allAssets.find(
            asset => asset.symbol.toLowerCase() === balance.symbol?.toLowerCase(),
          );

          if (matchingAsset) {
            metadata = matchingAsset;
          }
        }

        if (metadata) {
          // Use the toValueView utility to create a KnownAssetId ValueView
          const amountInBaseUnits = parseInt(balance.amount);

          return toValueView({
            amount: amountInBaseUnits,
            metadata,
          });
        }

        // If no metadata found, create a basic ValueView with an UnknownAssetId
        // Create a placeholder assetId
        const assetId = new AssetId({ inner: new Uint8Array() });

        return toValueView({
          amount: parseInt(balance.amount),
          assetId,
        });
      } catch (error) {
        console.error('Error creating ValueView:', error);
        // Create a fallback ValueView with UnknownAssetId
        const assetId = new AssetId({ inner: new Uint8Array() });
        return toValueView({
          amount: parseInt(balance.amount) || 0,
          assetId,
        });
      }
    };

    return (
      <Density variant={variant === 'default' ? 'sparse' : 'compact'}>
        {isWalletConnected && address ? (
          <>
            <Button actionType={actionType} onClick={() => void disconnect()}>
              {`${address.slice(0, 8)}...${address.slice(-4)}`}
            </Button>
            {balances.map((balance, index) => (
              <ValueViewComponent
                key={`${balance.chain}-${balance.denom}-${index}`}
                valueView={balanceToValueView(balance)}
              />
            ))}
          </>
        ) : (
          <Button icon={Wallet2} actionType={actionType} onClick={handleConnect}>
            Connect Cosmos Wallet
          </Button>
        )}
      </Density>
    );
  },
);

// Export a dynamic component to prevent SSR issues with window object
export const CosmosConnectButton = dynamic(() => Promise.resolve(CosmosConnectButtonInner), {
  ssr: false,
});
