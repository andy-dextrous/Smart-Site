FROM node:20-bookworm AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /app

COPY .npmrc ./
COPY package.json ./
COPY patches ./patches

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN chmod +x /app/docker/build-app.sh /app/docker/start-app.sh

EXPOSE 3000
