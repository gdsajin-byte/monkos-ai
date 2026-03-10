# MONKOS ID Photo KR Service - Cloud Run
# idphoto-kr.monkos.ai | 한국 특화 AI 증명사진 (Gemini Live + Imagen + QC)

# Stage 1: JS 난독화 — 일시 비활성화 (카메라 충돌 원인 조사 중)
# FROM node:20-slim AS builder
# WORKDIR /build
# COPY public/ ./public/
# COPY obfuscate.mjs ./
# RUN npm install javascript-obfuscator && \
#     node obfuscate.mjs

# 런타임
FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS AI ID Photo KR Service - idphoto-kr.monkos.ai"

WORKDIR /app

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
