# Use the official Bun image as the base image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install Git (if needed for your utility functions)
RUN apt-get update && apt-get install -y git

# Install Node.js and npm
RUN apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs
    
# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .
COPY .env .

# Create necessary directories and set permissions
RUN mkdir -p /usr/src/app/clones \
    && mkdir -p /usr/src/app/src/builds \
    && chown -R bun:bun /usr/src/app/clones /usr/src/app/src/builds

# Set the working directory to 'bun' user
USER bun

# Ensure the environment variables are set
ENV NODE_ENV=production

# Run the deploy server
ENTRYPOINT ["bun", "run", "src/server.ts"]
