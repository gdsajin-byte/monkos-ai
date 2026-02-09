# MONKOS ID Photo JP Service - Cloud Run
# idphoto-jp.monkos.ai | 日本特化 AI 証明写真 (Gemini Live + Imagen + QC)

FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS AI ID Photo JP Service - idphoto-jp.monkos.ai"

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && \
    npm cache clean --force

COPY server.js ./
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
