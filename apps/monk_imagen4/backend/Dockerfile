# Base Image
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치 (npm ci 대신 npm install 사용 - lock 파일 없을 때 대비)
RUN npm install --only=production

# 소스 코드 복사
COPY . .

# 포트 설정
ENV PORT 8080
EXPOSE 8080

# 실행 명령
CMD [ "npm", "start" ]
