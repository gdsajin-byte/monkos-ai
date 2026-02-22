# MONK AI Backend - Cloud Run Dockerfile
FROM node:20-slim

WORKDIR /app

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 복사 및 빌드
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 포트 설정
ENV PORT=8080
EXPOSE 8080

# 실행
CMD ["node", "dist/index.js"]
