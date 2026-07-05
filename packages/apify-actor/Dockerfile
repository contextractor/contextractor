# syntax=docker/dockerfile:1.7

FROM apify/actor-node-playwright-chrome:24 AS builder

USER root
ENV NODE_ENV=development
WORKDIR /repo

# Copy workspace + package manifests for layer-cache efficiency.
# Only copy linux prebuilds — darwin/windows dirs are not needed.
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/schema/package.json packages/schema/
COPY packages/extraction/native/npm/linux-x64-gnu/ packages/extraction/native/npm/linux-x64-gnu/
COPY packages/extraction/native/npm/linux-arm64-gnu/ packages/extraction/native/npm/linux-arm64-gnu/
COPY packages/extraction/native/package.json packages/extraction/native/
COPY packages/extraction/native/index.d.ts packages/extraction/native/
COPY packages/extraction/native/index.js packages/extraction/native/
COPY packages/extraction/package.json packages/extraction/
COPY packages/crawler/package.json packages/crawler/
COPY packages/standalone/package.json packages/standalone/
COPY packages/apify-actor/package.json packages/apify-actor/

RUN corepack enable && pnpm install

# Copy sources needed for the build.
COPY tsconfig.json ./
# The standalone tsup build copies the repo-root NOTICE and LICENSE into its dist
# (npm/PyPI attribution); the builder must have both on disk for those copies to
# succeed.
COPY NOTICE LICENSE ./
COPY packages/schema/ packages/schema/
COPY packages/extraction/src/ packages/extraction/src/
COPY packages/extraction/tsconfig.json packages/extraction/
COPY packages/crawler/ packages/crawler/
COPY packages/standalone/ packages/standalone/
COPY packages/apify-actor/ packages/apify-actor/

# Build packages in dependency order, then deploy a self-contained bundle.
RUN pnpm --filter @contextractor/schema build \
    && pnpm --filter @contextractor/extraction build \
    && pnpm --filter @contextractor/crawler build \
    && pnpm --filter contextractor build \
    && pnpm --filter @contextractor/apify build \
    && pnpm --filter @contextractor/apify --prod deploy /deploy \
    && node -e "const fs=require('fs');const p='/deploy/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));pkg.type='module';fs.writeFileSync(p,JSON.stringify(pkg,null,2)+String.fromCharCode(10))"

FROM apify/actor-node-playwright-chrome:24

WORKDIR /usr/src/app

COPY --chown=myuser:myuser --from=builder /deploy ./
# Third-party license attribution (Ghostery MPL-2.0) plus the Apache-2.0 LICENSE
# text the NOTICE points at ("see LICENSE"); see repo-root NOTICE.
COPY --chown=myuser:myuser NOTICE LICENSE ./

CMD ["node", "dist/main.js"]
