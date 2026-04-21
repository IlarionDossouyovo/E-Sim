# E-Sim By ELECTRON - Production Dockerfile
FROM node:20-alpine

# Labels
LABEL maintainer="E-Sim Team <support@esim-electron.com>"
LABEL description="E-Sim By ELECTRON - Global eSIM Platform"

# Environment
ENV NODE_ENV=production \
    PORT=3000

# Working directory
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend files
COPY backend/ ./backend/
COPY public/ ./public/

# Create non-root user
RUN addgroup -g 1001 -S esim && \
    adduser -u 1001 -S esim -G esim

# Set ownership
RUN chown -R esim:esim /app
USER esim

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start
CMD ["node", "backend/server.js"]

# Build:
# docker build -t esim-electron:latest .
#
# Run:
# docker run -d -p 3000:3000 --name esim-app esim-electron:latest
#
# With docker-compose:
# docker-compose -f docker-compose.prod.yml up -d