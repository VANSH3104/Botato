FROM node:22-bookworm-slim

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json tsconfig.json ./
RUN npm install

# Copy source and build TypeScript
COPY src ./src
RUN npm run build

ENV PORT=8000
ENV NODE_ENV=production

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "start"]

