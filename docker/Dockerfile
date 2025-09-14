# StreamFlix Demo - Multi-stage Docker build
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tokndemo -u 1001

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && \
    cd server && npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tokndemo -u 1001

# Copy dependencies from base stage
COPY --from=base --chown=tokndemo:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=tokndemo:nodejs /app/server/node_modules ./server/node_modules

# Copy application code
COPY --chown=tokndemo:nodejs . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER tokndemo

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]