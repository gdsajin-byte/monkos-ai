# MONKOS Studio — 내부용 AI 보정 앱
# Cloud Run: monkos-studio

FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS Studio - Internal AI Retouching App"

WORKDIR /app

# sharp SVG 렌더링에 fontconfig 필요
RUN apt-get update && \
    apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force

COPY server.js gcs-save.js ./
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
