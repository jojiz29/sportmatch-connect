# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Dependencies
FROM base AS deps
RUN npm ci

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Vite build argument for mode (production/development)
ARG MODE=production
ENV NODE_ENV=$MODE
RUN npm run build

# Stage 4: Development Runner
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV HOST=0.0.0.0
# Fix for HMR in Windows/Mac containers
ENV CHOKIDAR_USEPOLLING=true 
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
