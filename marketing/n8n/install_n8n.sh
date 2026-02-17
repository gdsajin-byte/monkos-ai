#!/bin/bash
# n8n 설치 스크립트 (4060 서버용)
# MONK.KR 마케팅 자동화
#
# 실행: bash install_n8n.sh

set -e

echo "=================================="
echo "🚀 n8n 설치 시작"
echo "=================================="

# 1. Docker 확인
echo ""
echo "[1/4] Docker 확인..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    echo "   설치: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
docker --version
echo "✅ Docker 확인 완료"

# 2. Docker Compose 확인
echo ""
echo "[2/4] Docker Compose 확인..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi
echo "✅ Docker Compose 확인 완료"

# 3. n8n 디렉토리 생성
echo ""
echo "[3/4] n8n 디렉토리 생성..."
N8N_DIR="$HOME/monk-n8n"
mkdir -p "$N8N_DIR/workflows"
cd "$N8N_DIR"
echo "✅ 디렉토리 생성: $N8N_DIR"

# 4. docker-compose.yml 생성
echo ""
echo "[4/4] docker-compose.yml 생성..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: monk-n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - GENERIC_TIMEZONE=Asia/Seoul
      - TZ=Asia/Seoul
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/workflows
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  n8n_data:
    driver: local
EOF
echo "✅ docker-compose.yml 생성 완료"

# 5. n8n 시작
echo ""
echo "=================================="
echo "🎯 n8n 시작"
echo "=================================="
docker compose up -d

# 6. 상태 확인
echo ""
echo "⏳ 컨테이너 시작 대기 (10초)..."
sleep 10

if docker ps | grep -q monk-n8n; then
    echo ""
    echo "=================================="
    echo "✅ n8n 설치 완료!"
    echo "=================================="
    echo ""
    echo "📍 접속 주소:"
    echo "   - 로컬: http://localhost:5678"
    echo "   - Tailscale: http://$(hostname -I | awk '{print $1}'):5678"
    echo ""
    echo "📝 관리 명령어:"
    echo "   - 로그: docker compose logs -f"
    echo "   - 중지: docker compose down"
    echo "   - 재시작: docker compose restart"
    echo ""
else
    echo "❌ n8n 시작 실패. 로그 확인:"
    docker compose logs
    exit 1
fi
