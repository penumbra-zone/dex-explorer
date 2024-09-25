# Mostly boilerplate image spec, taken from nextjs docs:
# https://nextjs.org/docs/pages/building-your-application/deploying#docker-image

FROM docker.io/node:20-bookworm AS base
# Enable `pnpm` so we can use it instead of `npm` in builds.
RUN corepack enable pnpm
# Disable nextjs telemetry in base layer, so the env var carries over to other layers.
ENV NEXT_TELEMETRY_DISABLED 1
LABEL maintainer="team@penumbralabs.xyz"

# Install node dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
# RUN pnpm install --frozen-lockfile
RUN pnpm install

# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# Build the website as standalone output.
RUN pnpm --version && node --version && pnpm run build

# Production image, copy all the files and run nextjs via node
FROM base AS runner
WORKDIR /app

# Create normal user for app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Set the correct permission for prerender cache
RUN mkdir /app/.next && chown nextjs:nodejs /app/.next

# Copy standalone directories for serving.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/static /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public /app/public
RUN chown -R nextjs:nodejs /app
RUN apt-get update && apt-get install tree && tree -a -L 3 /app

USER nextjs
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD node server.js
