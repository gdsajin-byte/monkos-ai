# MONKOS ID Photo Service - Cloud Run
# idphoto.monkos.ai | Gemini Live 코칭 + Imagen 생성 + QC 검증

FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS AI ID Photo Service - idphoto.monkos.ai"

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
