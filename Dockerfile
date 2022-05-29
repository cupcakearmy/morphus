# BASE
FROM node:16-alpine as base

WORKDIR /app
RUN npm -g i pnpm@7
# Needed for node-gyp
RUN apk add --no-cache python3

# BUILDER
FROM base as builder

COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

COPY . .
RUN pnpm run build
RUN ls -hal

# RUNNER
FROM base

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

ENV LOCAL_ASSETS=/data
ENV ADDRESS=0.0.0.0
ENV PORT=80

EXPOSE 80

CMD [ "node", "." ]
