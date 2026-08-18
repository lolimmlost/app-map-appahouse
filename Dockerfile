# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build-time public flags (baked into the client bundle by Vite).
# Coolify passes "Build Variable" env vars as --build-arg; they must be declared
# as ARG and re-exported as ENV so `vite build` can read import.meta.env.*.
ARG VITE_AUTHENTIK_ENABLED
ENV VITE_AUTHENTIK_ENABLED=$VITE_AUTHENTIK_ENABLED

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built application (Nitro bundles its own node_modules)
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
