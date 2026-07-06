# Node 22 필수 — @mediapipe/face_mesh가 전역 navigator 참조 (Node 21+ 내장, 20에서 기동 크래시. 2026-07-06 실사고)
FROM node:22-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS Crop Engine — AI 증명사진 정밀 크롭 서비스"

WORKDIR /app

# tfjs-node 네이티브 빌드 + sharp 의존성
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential python3 fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force

COPY server.js ./
COPY lib/ ./lib/
COPY specs/ ./specs/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
