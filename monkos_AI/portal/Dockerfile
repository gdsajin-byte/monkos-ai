# MONKOS Portal - Cloud Run
# monkos.ai | AI 메인 포털 (Gemini 2.0 챗봇 + 국가별 분기)

# Stage 1: JS 난독화 (빌드 전용)
FROM node:20-slim AS builder

WORKDIR /build
COPY public/ ./public/
COPY obfuscate.mjs ./
RUN npm install javascript-obfuscator && \
    node obfuscate.mjs

# Stage 2: 런타임
FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS AI Portal - monkos.ai"

# 한글 폰트 — sharp SVG 텍스트 렌더링용
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk-extra && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && \
    npm cache clean --force

COPY server.js ./
COPY lib/ ./lib/
COPY --from=builder /build/public ./public/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
