# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install Git
RUN apt-get update && apt-get install -y git
# Create the directory and set permissions
RUN mkdir -p /usr/src/app/clones && chown -R bun:bun /usr/src/app/clones

# Install dependencies into a temp directory to cache them
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory, then copy all project files
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
COPY .env .

# Optional: Run tests and build
ENV NODE_ENV=production
RUN bun b

# Copy production dependencies and source code into the final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src /usr/src/app/src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/.env .  

# Run the app
USER bun
EXPOSE 4000/tcp
ENTRYPOINT ["bun", "run", "src/server.ts"]
