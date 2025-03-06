# Portfolio Page Analysis

## Current Implementation

### Architecture & Components

The Portfolio page is structured with the following components:

1. **Main Component (`src/pages/portfolio/index.tsx`)**

   - Switches between mobile and desktop views
   - Mobile view shows a message that the page requires a desktop device
   - Desktop view renders the `WalletConnect` and `AssetsTable` components

2. **Wallet Connection (`src/pages/portfolio/ui/wallet-connect.tsx`)**

   - Displays two cards:
     - **Shielded Assets**: For connecting Prax Wallet (Penumbra's wallet)
     - **Public Assets**: For connecting Cosmos wallet
   - Uses separate components for each wallet type:
     - `ConnectButton` for Penumbra wallet
     - `CosmosConnectButton` for Cosmos wallet (now without displaying public assets)

3. **Assets Table (`src/pages/portfolio/ui/assets-table.tsx`)**

   - Shows a single table with Penumbra assets
   - Displays an asset distribution bar
   - Columns: Asset, Balance, Price, Value, Actions
   - Has loading and not-connected states

4. **Cosmos Integration**
   - Uses `chain-provider.tsx` to set up Cosmos wallet integration
   - Has a hook `use-augmented-balances.ts` to fetch balances from Cosmos chains
   - Maps Cosmos balances to Penumbra's `ValueView` format for display consistency

### Current Limitations

1. The assets table only shows Penumbra (shielded) assets, not Cosmos (public) assets
2. There's no unified view of assets across both shielded and public balances
3. No implementation for deposits/withdrawals between Penumbra and Cosmos chains
4. The mobile experience is blocked completely rather than adapted
5. No expandable rows to show where assets are located
6. No clear visualization of the proportion of assets that are shielded vs. public

## Required Changes

### 1. Asset Visualization

- **Replace single asset bar with two bars**:
  - Shielded Assets bar (for Penumbra assets)
  - Public Assets bar (for Cosmos assets)
  - Implement proportional scaling between the two bars

### 2. Unified Asset Table

- Update the AssetsTable component to use the UnifiedAsset interface from useUnifiedAssets
- Update columns and cell rendering for the new data format:
  - Shielded Balance
  - Public Balance
  - Price
  - Shielded Value
  - Public Value
  - Actions (deposit/withdraw)
- Implement expandable rows to show asset locations

### 3. Deposit/Withdraw Functionality

- Add deposit button next to Public Balance
- Add withdraw button next to Shielded Balance
- Implement modals for deposit/withdraw operations:
  - **Deposit**: Integrate Skip widget, pre-fill asset and destination
  - **Withdraw**: Create form with asset amount and destination

### 4. Integration Improvements

- Finalize integration of the `useUnifiedAssets` hook with the AssetsTable component
- Improve asset mapping between chains for proper display and operations

## Technical Approach

1. **UI Components**:

   - Modify `AssetsTable` to display combined assets
   - Create new visualization components for the dual asset bars - we already have an asset bar, so probably just extend that.
   - Implement expandable rows showing asset locations
   - Build modal components for deposit/withdraw actions

2. **Additional Features**:
   - Add loading and empty states for all new components

KEEP IN MIND THESE USER JOURNEYS: ## User Flows

- A user with Cosmos assets and no Penumbra balances opens the portfolio page.
  - The page prompts them to connect their Cosmos wallet.
  - They connect a Cosmos wallet and the portfolio page is populated with their Cosmos balances
  - They select an asset from the list and hit the Deposit button
  - A modal dialog appears with the Skip deposit interface, pre-filled with the asset to deposit and Penumbra as the destination
    - All the user has to input is the amount they wish to deposit
  - The deposit completes and they see it reflected on the portfolio page
- A user with Penumbra assets opens the portfolio page
  - They see their asset allocations inside and outside of Penumbra
  - They can see a list of all of their positions
  - They can click through any position to the position details page in the Inspect tab
  - They can close or withdraw open positions
  - They can see a list of their history
  - They can click the withdraw button next to any asset
    - This opens a Penumbra dialog to withdraw that asset back to its origin chain

## Detailed Implementation Plan: Integrating Cosmos Assets into Assets Table

### 1. Component Modifications

1. **Assets Table Refactoring:**
   - Update column structure to include both shielded and public balances
   - Add columns for shielded and public values
   - Implement action buttons based on asset availability

   ```tsx
   <Table>
     <Table.Thead>
       <Table.Tr>
         <Table.Th>Asset</Table.Th>
         <Table.Th>Shielded Balance</Table.Th>
         <Table.Th>Public Balance</Table.Th>
         <Table.Th>Price</Table.Th>
         <Table.Th>Total Value</Table.Th>
         <Table.Th>Actions</Table.Th>
       </Table.Tr>
     </Table.Thead>
     <Table.Tbody>
       {unifiedAssets.map(asset => (
         <Table.Tr key={asset.symbol}>
           {/* Asset info */}
           <Table.Td>
             <div className="flex items-center gap-2">
               <AssetIcon metadata={asset.metadata} />
               <Text>{asset.symbol}</Text>
             </div>
           </Table.Td>
           
           {/* Shielded balance with withdraw button */}
           <Table.Td>
             <div className="flex items-center justify-between">
               {asset.shieldedBalance ? (
                 <ValueViewComponent valueView={asset.shieldedBalance.valueView} />
               ) : (
                 <Text color="text.tertiary">-</Text>
               )}
               {asset.canWithdraw && (
                 <Button icon={ArrowUpRight} iconOnly>
                   Withdraw
                 </Button>
               )}
             </div>
           </Table.Td>
           
           {/* Public balance with deposit button */}
           <Table.Td>
             <div className="flex items-center justify-between">
               {asset.publicBalance ? (
                 <ValueViewComponent valueView={asset.publicBalance.valueView} />
               ) : (
                 <Text color="text.tertiary">-</Text>
               )}
               {asset.canDeposit && (
                 <Button icon={ArrowDownRight} iconOnly>
                   Deposit
                 </Button>
               )}
             </div>
           </Table.Td>
           
           {/* Price */}
           <Table.Td>
             <Text color="text.secondary">-</Text> {/* Placeholder for future pricing */}
           </Table.Td>
           
           {/* Total value */}
           <Table.Td>
             <Text>{asset.totalValue > 0 ? `$${asset.totalValue.toFixed(2)}` : '-'}</Text>
           </Table.Td>
           
           {/* Actions */}
           <Table.Td>
             <div className="flex gap-2">
               <Button disabled>Buy</Button>
               <Button disabled>Sell</Button>
             </div>
           </Table.Td>
         </Table.Tr>
       ))}
     </Table.Tbody>
   </Table>
   ```

2. **Loading and Empty States:**
   - Update loading state to reflect the new column structure
     - No wallets connected

### 2. Implementation Steps

1. **UI Component Updates:**
   - Modify the `AssetsTable` component to use the unified data structure
   - Update columns and cell rendering for the new data format
   - Add conditional logic for displaying action buttons

2. **Connection State Handling:**
   - Implement a new empty state for when no assets

3. **Action Buttons:**
   - Add placeholder buttons for deposit/withdraw actions
   - Implement logic to determine when buttons should be enabled
   - Prepare for modal integration in future steps

### 3. Testing Scenarios

1. **Data Display:**
   - Verify correct display of assets present in both Penumbra and Cosmos
   - Verify correct display of assets only in Penumbra
   - Verify correct display of assets only in Cosmos

2. **Balance Aggregation:**
   - Verify that total value calculations are correct
   - Verify that assets are properly grouped by symbol/identity

3. **Connection States:**
   - Test with only Penumbra wallet connected
   - Test with only Cosmos wallet connected
   - Test with both wallets connected
   - Test with no wallets connected
