export type TransactionApiResponse =
  | {
      tx: Uint8Array;
      height: number;
    }
  | { error: string };
