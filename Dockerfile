# Builder stage: install deps + build app
# Use a hardened base image to reduce CVEs
FROM cgr.dev/chainguard/node:20-dev AS builder

# All subsequent commands run inside /app
WORKDIR /app

# Enable Corepack so pnpm is available in this image
RUN corepack enable

# Copy only dependency manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies exactly as pinned in pnpm-lock.yaml for reproducibility
RUN pnpm install --frozen-lockfile

# Copy the rest of the project source into the image
COPY . .

# Generate Prisma Client code (used by the app at runtime)
RUN pnpm prisma:generate

# Build NestJS (compile TypeScript -> dist/)
RUN pnpm run build

# Remove devDependencies for a smaller, safer runtime bundle
RUN pnpm prune --prod

# Runtime stage: hardened minimal image
FROM cgr.dev/chainguard/node:20 AS runtime

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Document the port the container is expected to listen on
EXPOSE 3000

# Start NestJS production build
CMD ["dist/main.js"]
