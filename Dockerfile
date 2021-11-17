FROM node:16-alpine as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm exec pnpm i --frozen-lockfile

COPY . .
RUN npm exec pnpm run build
RUN ls -hal

FROM node:16-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm exec pnpm i --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

ENV LOCAL_ASSETS=/data
ENV ADDRESS=0.0.0.0

EXPOSE 80

CMD [ "node", "." ]
