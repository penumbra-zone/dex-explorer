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
     - `CosmosConnectButton` for Cosmos wallet

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

- Create a single table with both shielded and public balances
- Add columns:
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

- Connect the `useBalances` hook from Cosmos to the main assets table
- Merge Penumbra and Cosmos balances in a consistent format
- Map assets between chains for proper display and operations

## Technical Approach

1. **Data Integration**:

   - Create a unified data structure that combines Penumbra and Cosmos assets - use the penumbra pd Asset for this.
   - Build utility functions to calculate total values and proportions - these might already exist.

2. **UI Components**:

   - Modify `AssetsTable` to display combined assets
   - Create new visualization components for the dual asset bars - we already have an asset bar, so probably just extend that.
   - Implement expandable rows showing asset locations
   - Build modal components for deposit/withdraw actions

3. **Additional Features**:
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
