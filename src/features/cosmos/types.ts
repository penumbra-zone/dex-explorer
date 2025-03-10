export interface Balance {
  denom: string;
  amount: string;
  chain: string;
  symbol?: string;
  displayAmount?: string;
}

export interface BankBalancesResponse {
  balances: {
    denom: string;
    amount: string;
  }[];
}
