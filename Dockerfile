# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# Custom n8n image with the @egose/n8n-sync external-hook bundles baked in.
#
# Built from the workspace root so the bundles reflect the current source tree
# (the integration tests exercise whatever is in packages/n8n-sync/dist, or
# the bundles are rebuilt in stage 1 if dist is stale).
#
# Used by sandbox/docker-compose.yml for the two-instance sync integration test.
# -----------------------------------------------------------------------------

ARG N8N_VERSION=latest

# ---------------------------------------------------------------------------
# Stage 1: build the publisher.cjs + subscriber.cjs bundles from source
# ---------------------------------------------------------------------------
FROM node:22-alpine AS bundles

WORKDIR /repo

# pnpm needs to be available; node:22-alpine ships npm + corepack.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what's needed to build the n8n-sync package.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/n8n-sync ./packages/n8n-sync

# Install the n8n-sync workspace dependencies (devDeps needed for tsup).
RUN pnpm install --frozen-lockfile --filter @egose/n8n-sync...

# Build the bundles → packages/n8n-sync/dist/{publisher,subscriber}.cjs
RUN pnpm --filter @egose/n8n-sync build

# ---------------------------------------------------------------------------
# Stage 2: n8n runtime image with the bundles baked in
# ---------------------------------------------------------------------------
FROM n8nio/n8n:${N8N_VERSION}

COPY --from=bundles /repo/packages/n8n-sync/dist/publisher.cjs  /opt/n8n-hooks/publisher.cjs
COPY --from=bundles /repo/packages/n8n-sync/dist/subscriber.cjs /opt/n8n-hooks/subscriber.cjs

# Both bundles are present; per-container role is selected at runtime via
# EXTERNAL_HOOK_FILES (see sandbox/docker-compose.yml).
ENV EXTERNAL_HOOK_FILES=/opt/n8n-hooks/publisher.cjs
