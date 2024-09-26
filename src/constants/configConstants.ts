export interface ConstantsConfig {
  cuiloaUrl: string;
  chainId: string;
  indexerEndpoint: string;
  grpcEndpoint: string;
}

// The chain id of the network that the DEX explorer analyzes.
const defaultChainId = "penumbra-1";
// Used to look up asset registry and load token names and symbols.
// The URL for an external block explorer website.
// Used to generate drill-down URLs for exploring block contents elsewhere.
const defaultCuiloaUrl = "https://cuiloa.testnet.plinfra.net";
// The PostgreSQL database URL, including authentication parameters.
const defaultIndexerEndpoint = "postgresql://penumbra:penumbra@localhost:5432/penumbra";
// The URL for the Penumbra node's gRPC pd service. Should be the same node
// that's performing the event indexing into the postgres database.
const defaultGrpcEndpoint = "http://localhost:8080";

// We use variable names to look up the NEXT_PUBLIC_* env vars, to prevent inlining.
// Otherwise, the var value will be set at *build time* and will not accept overrides
// at runtime for a different value.
const cuiloaUrlVarName = "NEXT_PUBLIC_CUILOA_URL";
const chainIdVarName = "NEXT_PUBLIC_CHAIN_ID";

export const Constants: ConstantsConfig = {
  cuiloaUrl: process.env[cuiloaUrlVarName] ?? defaultCuiloaUrl,
  chainId: process.env[chainIdVarName] ?? defaultChainId,
  indexerEndpoint: process.env["PENUMBRA_INDEXER_ENDPOINT"] ?? defaultIndexerEndpoint,
  grpcEndpoint: process.env["PENUMBRA_GRPC_ENDPOINT"] ?? defaultGrpcEndpoint,
};
