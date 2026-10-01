# MONKOS Image Engine - Cloud Run Dockerfile
# Node.js 20 기반 경량 이미지

FROM node:20-slim

# 메타데이터
LABEL maintainer="MONK.KR"
LABEL description="MONKOS Image Engine - Vertex AI Imagen 4 Backend"

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 프로덕션 의존성만 설치 (최적화)
RUN npm install --only=production && \
    npm cache clean --force

# 소스 코드 복사
COPY server.js ./
COPY public ./public

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=8080

# 포트 노출
EXPOSE 8080

# 헬스 체크 (Cloud Run 로드밸런서용)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
CMD ["node", "server.js"]
