# Extremely simple Containerfile, inappropriately using `pnpm run dev`
# as the entrypoint, due to https://github.com/penumbra-zone/dex-explorer/issues/73.
# Longer-term we should fix the app's config api, and return to using a prod build,
# as described in https://nextjs.org/docs/pages/building-your-application/deploying#docker-image.

FROM docker.io/node:20-slim AS builder
LABEL maintainer="team@penumbralabs.xyz"
ENV NEXT_TELEMETRY_DISABLED 1

# Create normal user for app
ARG GID=1001
ARG UID=1001
ARG USERNAME=nextjs
ARG GROUPNAME=nodejs
RUN groupadd -g ${GID} ${GROUPNAME} \
  && useradd -l -m -d /home/${USERNAME} -g ${GID} -u ${UID} ${USERNAME}

# Enable `pnpm` so we can use it instead of `npm` in builds.
RUN corepack enable pnpm
WORKDIR /app
RUN chown -R ${USERNAME}:${GROUPNAME} /app
USER nextjs

# Install node dependencies only when needed
COPY --chown=${UID}:${GID} package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
COPY --chown=${UID}:${GID} . .

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "run", "dev"]
