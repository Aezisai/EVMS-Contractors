FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npx tsc && npx tsc-alias

FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

# By default, run the unanet connector (this will be overridden in Cloud Run config for the others)
ENV SERVICE_NAME=unanet
CMD ["sh", "-c", "node dist/${SERVICE_NAME}/index.js"]
