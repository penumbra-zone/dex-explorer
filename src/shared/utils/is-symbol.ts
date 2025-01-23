const STABLECOIN_SYMBOLS = ['USDC', 'USDY', 'USDT'];

// important numeraire symbols
const NUMERAIRE_SYMBOLS = ['BTC', 'UM'];

export function isStablecoinSymbol(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.includes(symbol.toUpperCase());
}

export function isNumeraireSymbol(symbol: string): boolean {
  return NUMERAIRE_SYMBOLS.includes(symbol.toUpperCase());
}
