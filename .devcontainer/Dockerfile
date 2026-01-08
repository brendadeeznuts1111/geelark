## Use official Bun image with Node.js 20 (includes Bun 1.2.x)
#FROM oven/bun:1.2.3-debian

## Install development tools and utilities
#RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    python3-pip \
    jq \
    htop \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

## Install security scanning tools
#RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g snyk \
    && npm install -g @snyk/cli \
    && curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin \
    && curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

## Install code quality tools
#RUN pip3 install bandit safety

## Install container security scanner
#RUN curl -sSfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

## Install development utilities
#RUN npm install -g \
    typescript \
    ts-node \
    @types/node \
    nodemon \
    concurrently

## Install global Bun packages for development
#RUN bun add -g \
    bun-types \
    @types/bun \
    @types/node

## Create non-root user for security
#RUN useradd -m -s /bin/bash developer \
    && mkdir -p /workspace \
    && chown -R developer:developer /workspace

## Switch to non-root user
#USER developer
#WORKDIR /workspace

## Set up environment variables
#ENV NODE_ENV=development
#ENV BUN_ENV=development
#ENV CI=false
#ENV FORCE_COLOR=1

## Copy entrypoint script
#COPY --chown=developer:developer entrypoint.sh /entrypoint.sh
#RUN chmod +x /entrypoint.sh

#ENTRYPOINT ["/entrypoint.sh"]
#CMD ["sleep", "infinity"]
