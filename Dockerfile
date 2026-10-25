FROM node:24.22.1-bookworm AS runtime
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HOSTNAME="0.0.0.0" PORT=3000 NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@10.34.8
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN chmod +x /app/docker/build-app.sh /app/docker/start-app.sh
EXPOSE 3000
