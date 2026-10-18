FROM node:24-alpine

# tzdata để lịch cron chạy theo giờ Việt Nam (TZ đặt trong docker-compose.yml)
RUN apk add --no-cache tzdata

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY fonts ./fonts
COPY src ./src

RUN mkdir -p data && chown node:node data
USER node

CMD ["node", "src/index.js"]
