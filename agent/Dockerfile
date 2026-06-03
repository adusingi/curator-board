FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY agent ./agent
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
CMD ["pnpm", "exec", "tsx", "agent/main.ts"]
