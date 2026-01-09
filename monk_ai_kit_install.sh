#!/bin/bash

# ================================
# MONK AI Kit 자동 설치 스크립트
# 소상공인용 로컬 AI 챗봇 설치
# ================================

set -e

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 배너
echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║                                       ║
║   🤖 MONK AI Kit Installer           ║
║   소상공인을 위한 AI 챗봇             ║
║                                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# 시스템 확인
echo -e "${BLUE}[1/7]${NC} 시스템 환경 확인 중..."

OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    echo -e "${GREEN}✅ macOS 감지${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo -e "${GREEN}✅ Linux 감지${NC}"
else
    echo -e "${RED}❌ 지원하지 않는 OS입니다. (Windows는 수동 설치 필요)${NC}"
    exit 1
fi

# Ollama 설치 확인
echo -e "${BLUE}[2/7]${NC} Ollama 설치 확인 중..."

if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅ Ollama가 이미 설치되어 있습니다.${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama가 설치되어 있지 않습니다. 설치하시겠습니까? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Ollama 설치 중...${NC}"
        curl -fsSL https://ollama.com/install.sh | sh
        echo -e "${GREEN}✅ Ollama 설치 완료${NC}"
    else
        echo -e "${RED}❌ Ollama가 필요합니다. 설치를 취소합니다.${NC}"
        exit 1
    fi
fi

# AI 모델 다운로드
echo -e "${BLUE}[3/7]${NC} AI 모델 선택..."
echo -e "  ${GREEN}1${NC} = Llama 3.2 3B (권장, 약 2GB)"
echo -e "  ${GREEN}2${NC} = Phi-3 Mini (경량, 약 1.5GB)"
echo -e "  ${GREEN}3${NC} = 둘 다 설치"
read -r model_choice

case $model_choice in
    1)
        echo -e "${BLUE}Llama 3.2 3B 다운로드 중... (약 3분 소요)${NC}"
        ollama pull llama3.2:3b
        MODEL="llama3.2:3b"
        ;;
    2)
        echo -e "${BLUE}Phi-3 Mini 다운로드 중... (약 2분 소요)${NC}"
        ollama pull phi3:mini
        MODEL="phi3:mini"
        ;;
    3)
        echo -e "${BLUE}두 모델 모두 다운로드 중...${NC}"
        ollama pull llama3.2:3b
        ollama pull phi3:mini
        MODEL="llama3.2:3b"
        ;;
    *)
        echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ AI 모델 준비 완료${NC}"

# 프로젝트 디렉토리 생성
echo -e "${BLUE}[4/7]${NC} MONK AI Kit 설치 디렉토리 생성..."
INSTALL_DIR="$HOME/monk_ai_kit"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

mkdir -p knowledge-base web-interface config logs

echo -e "${GREEN}✅ 디렉토리 생성 완료: $INSTALL_DIR${NC}"

# 가게 정보 입력
echo -e "${BLUE}[5/7]${NC} 가게 정보를 입력해주세요..."

echo -n "가게 이름: "
read -r business_name

echo -n "업종 (예: 카페, 음식점, 게스트하우스): "
read -r business_type

echo -n "주소: "
read -r business_address

echo -n "전화번호: "
read -r business_phone

echo -n "평일 영업시간 (예: 10:00-22:00): "
read -r weekday_hours

echo -n "주말 영업시간 (예: 11:00-23:00): "
read -r weekend_hours

echo -n "정기 휴무일 (예: 매주 월요일): "
read -r holiday

# business_info.json 생성
cat > knowledge-base/business_info.json << EOF
{
  "name": "$business_name",
  "type": "$business_type",
  "address": "$business_address",
  "phone": "$business_phone",
  "hours": {
    "weekday": "$weekday_hours",
    "weekend": "$weekend_hours",
    "holiday": "$holiday"
  },
  "special_notes": [
    "AI 챗봇으로 24시간 문의 응대 가능",
    "더 자세한 정보는 전화 문의 바랍니다"
  ]
}
EOF

echo -e "${GREEN}✅ 가게 정보 저장 완료${NC}"

# FAQ 템플릿 생성
cat > knowledge-base/faq.json << EOF
{
  "faqs": [
    {
      "question": "영업시간이 어떻게 되나요?",
      "answer": "평일은 $weekday_hours, 주말은 $weekend_hours입니다. $holiday 휴무입니다."
    },
    {
      "question": "주소가 어디인가요?",
      "answer": "$business_address에 위치해 있습니다."
    },
    {
      "question": "전화번호 알려주세요",
      "answer": "$business_phone로 연락주시면 됩니다."
    },
    {
      "question": "예약이 가능한가요?",
      "answer": "전화($business_phone)로 예약하시면 더 편리합니다."
    }
  ]
}
EOF

# 챗봇 서버 스크립트 생성
echo -e "${BLUE}[6/7]${NC} 챗봇 서버 생성 중..."

cat > start_chatbot.py << 'PYEOF'
#!/usr/bin/env python3
"""
MONK AI Kit 챗봇 서버
"""

import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# 설정
PORT = 3000
MODEL = "llama3.2:3b"

class ChatbotHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_html()
        elif self.path == '/health':
            self.send_json({'status': 'healthy'})
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/chat':
            self.handle_chat()
        else:
            self.send_error(404)
    
    def handle_chat(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        user_message = data.get('message', '')
        
        # 지식 베이스 로드
        with open('knowledge-base/business_info.json', 'r', encoding='utf-8') as f:
            business_info = json.load(f)
        
        with open('knowledge-base/faq.json', 'r', encoding='utf-8') as f:
            faq = json.load(f)
        
        # 프롬프트 생성
        context = f"""
당신은 {business_info['name']}의 AI 어시스턴트입니다.

가게 정보:
- 이름: {business_info['name']}
- 업종: {business_info['type']}
- 주소: {business_info['address']}
- 전화: {business_info['phone']}
- 영업시간:
  * 평일: {business_info['hours']['weekday']}
  * 주말: {business_info['hours']['weekend']}
  * 휴무: {business_info['hours']['holiday']}

고객의 질문에 친절하고 간결하게 답변하세요. 
모르는 내용은 전화 문의를 안내하세요.
"""
        
        # Ollama 호출
        try:
            result = subprocess.run(
                ['ollama', 'run', MODEL, context + "\n\n고객 질문: " + user_message],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            ai_response = result.stdout.strip()
            
            # 로그 저장
            with open('logs/chat.log', 'a', encoding='utf-8') as f:
                f.write(f"\n[{self.log_date_time_string()}]\n")
                f.write(f"User: {user_message}\n")
                f.write(f"AI: {ai_response}\n")
            
            self.send_json({
                'success': True,
                'response': ai_response
            })
            
        except Exception as e:
            self.send_json({
                'success': False,
                'error': str(e)
            }, status=500)
    
    def serve_html(self):
        html = '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 챗봇</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .messages { flex: 1; overflow-y: auto; padding: 20px; }
        .message { margin-bottom: 15px; padding: 12px; border-radius: 12px; max-width: 70%; }
        .message.user { background: #667eea; color: white; margin-left: auto; }
        .message.ai { background: #f0f0f0; }
        .input-area { border-top: 1px solid #ddd; padding: 15px; display: flex; gap: 10px; }
        .input-area input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
        .input-area button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .input-area button:hover { background: #5568d3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI 챗봇</h1>
            <p>무엇을 도와드릴까요?</p>
        </div>
        <div class="messages" id="messages">
            <div class="message ai">안녕하세요! 무엇을 도와드릴까요?</div>
        </div>
        <div class="input-area">
            <input type="text" id="input" placeholder="메시지를 입력하세요..." onkeypress="if(event.key==='Enter') send()">
            <button onclick="send()">전송</button>
        </div>
    </div>
    <script>
        async function send() {
            const input = document.getElementById('input');
            const msg = input.value.trim();
            if (!msg) return;
            
            addMessage(msg, 'user');
            input.value = '';
            
            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: msg})
                });
                const data = await res.json();
                addMessage(data.response, 'ai');
            } catch (e) {
                addMessage('오류가 발생했습니다.', 'ai');
            }
        }
        
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = text;
            document.getElementById('messages').appendChild(div);
            div.scrollIntoView({behavior: 'smooth'});
        }
    </script>
</body>
</html>
        '''
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), ChatbotHandler)
    print(f'🚀 MONK AI Kit 챗봇 서버 시작!')
    print(f'📱 브라우저에서 접속: http://localhost:{PORT}')
    print(f'⏹️  종료하려면 Ctrl+C를 누르세요')
    server.serve_forever()
PYEOF

chmod +x start_chatbot.py

# 시작 스크립트 생성
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 MONK AI Kit 챗봇 시작 중..."
python3 start_chatbot.py
EOF

chmod +x start.sh

echo -e "${GREEN}✅ 챗봇 서버 생성 완료${NC}"

# 완료
echo -e "${BLUE}[7/7]${NC} 설치 완료!"

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   ✅ 설치 완료!                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}📍 설치 위치: $INSTALL_DIR${NC}"
echo ""
echo -e "${YELLOW}🚀 챗봇을 시작하려면:${NC}"
echo -e "   ${GREEN}cd $INSTALL_DIR${NC}"
echo -e "   ${GREEN}./start.sh${NC}"
echo ""
echo -e "${YELLOW}📱 브라우저에서 접속:${NC}"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${PURPLE}💡 관리자 가이드:${NC}"
echo -e "   - 가게 정보 수정: ${CYAN}knowledge-base/business_info.json${NC}"
echo -e "   - FAQ 수정: ${CYAN}knowledge-base/faq.json${NC}"
echo -e "   - 대화 로그: ${CYAN}logs/chat.log${NC}"
echo ""
echo -e "${BLUE}📞 문의: gdsajin@gmail.com | 031-791-5030${NC}"
