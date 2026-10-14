FROM node:22-bookworm-slim

# Install system dependencies: Python 3, pip, git, curl, build essentials, bash
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    jq \
    unzip \
    ca-certificates \
    build-essential \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Configure unprivileged user
RUN groupadd -g 1001 sandbox && \
    useradd -u 1001 -g sandbox -m -s /bin/bash sandbox

# Set working directory for sandbox manager daemon
WORKDIR /app

# Copy package files and install dependencies
COPY package.json tsconfig.json ./
RUN npm install

# Copy source code and build TypeScript
COPY src ./src
RUN npm run build

# Prepare shared workspace directory with permissions for unprivileged sandbox user
RUN mkdir -p /workspaces && \
    chown -R sandbox:sandbox /workspaces /app /home/sandbox

# Set environment
ENV PORT=4000
ENV NODE_ENV=production
ENV SANDBOX_WORKSPACES_DIR=/workspaces

# Run as unprivileged user
USER sandbox
WORKDIR /home/sandbox

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "/app/dist/server.js"]
