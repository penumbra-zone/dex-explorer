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

# build the standalone output locally.
manual-build:
  rm -rf .next/ out/
  pnpm run build
  rsync -a .next/standalone/ out/
  rsync -a .next/static/ out/.next/static/
  rsync -a public/ out/public/
  # cd out/ && HOSTNAME=0.0.0.0 node server.js
