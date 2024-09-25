# A justfile for dex-explorer development.
# Documents common tasks for local dev.

# run the app locally with live reload, via pnpm
dev:
  pnpm install
  pnpm dev

# build container image
container:
  podman build -t penumbra-dex-explorer -f Containerfile .

# run container image
run-container: container
  podman run -it \
  -e PENUMBRA_GRPC_ENDPOINT \
  -e PENUMBRA_INDEXER_ENDPOINT \
  -e NEXT_PUBLIC_CHAIN_ID \
  -e PENUMBRA_INDEXER_CA_CERT \
  -p 3000:3000 \
  penumbra-dex-explorer
