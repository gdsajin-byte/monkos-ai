# 🎁 MONK AI Kit - 소상공인용 로컬 AI 패키지

**제품명**: MONK AI Kit  
**대상**: 카페, 음식점, 소규모 매장  
**특징**: 클라우드 비용 없이 로컬 PC에서 작동하는 AI 챗봇

---

## 🎯 **제품 개요**

### **왜 MONK AI Kit인가?**

- ✅ **비용 절감**: 클라우드 비용 0원, 월 구독료 없음
- ✅ **데이터 소유권**: 고객 대화가 외부 유출 없이 로컬에 저장
- ✅ **오프라인 작동**: 인터넷 없어도 기본 응대 가능
- ✅ **커스터마이징**: 메뉴, 영업시간 등 자유롭게 수정
- ✅ **간단 설치**: 클릭 3번으로 설치 완료

---

## 💻 **시스템 요구사항**

### **최소 사양**
- CPU: Intel i3 또는 AMD Ryzen 3 이상
- RAM: 8GB 이상
- 저장공간: 10GB 여유 공간
- OS: Windows 10/11, macOS 12+, Ubuntu 20.04+

### **권장 사양** (더 빠른 응답)
- CPU: Intel i5 또는 AMD Ryzen 5 이상
- RAM: 16GB 이상
- GPU: NVIDIA GTX 1650 이상 (선택사항)

---

## 📦 **패키지 구성**

```
MONK_AI_Kit/
├── 🚀 install.sh              # 원클릭 설치 스크립트
├── 🤖 ollama-models/           # AI 모델 파일
│   ├── llama3.2-3b.gguf       # Llama 3.2 3B (빠른 응답)
│   └── phi-3-mini.gguf        # Phi-3 Mini (경량형)
├── 🗂️  knowledge-base/         # 지식 베이스
│   ├── business_info.json     # 가게 정보
│   ├── menu.json              # 메뉴 정보
│   └── faq.json               # 자주 묻는 질문
├── 🌐 web-interface/           # 웹 인터페이스
│   ├── index.html             # 챗봇 UI
│   └── admin.html             # 관리자 페이지
├── 🛠️  config/                 # 설정 파일
│   └── config.yaml            # 가게 맞춤 설정
└── 📖 README.pdf               # 사용 설명서
```

---

## 🚀 **설치 가이드**

### **Step 1: Ollama 설치**

#### **macOS / Linux**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### **Windows**
1. https://ollama.com/download 접속
2. Windows Installer 다운로드
3. 더블클릭으로 설치

### **Step 2: AI 모델 다운로드**

```bash
# Llama 3.2 3B 모델 (권장)
ollama pull llama3.2:3b

# 또는 더 가벼운 Phi-3 Mini
ollama pull phi3:mini
```

### **Step 3: MONK AI Kit 설치**

```bash
# MONK AI Kit 다운로드
git clone https://github.com/MONK-KR/ai-kit.git
cd ai-kit

# 자동 설치 실행
./install.sh
```

설치 중 물어보는 질문:
- 가게 이름: (예: "카페 몽크")
- 영업시간: (예: "10:00-22:00")
- 주소: (예: "서울시 강남구...")
- 전화번호: (예: "02-1234-5678")

### **Step 4: 챗봇 시작**

```bash
# 챗봇 서버 시작
./start.sh

# 브라우저에서 접속
# http://localhost:3000
```

---

## 🛠️ **사용법**

### **고객용 화면**

1. 태블릿이나 PC를 매장 카운터에 배치
2. 브라우저에서 `http://localhost:3000` 접속
3. 고객이 직접 질문 입력
4. AI가 즉시 답변

### **관리자 화면**

1. 브라우저에서 `http://localhost:3000/admin` 접속
2. 비밀번호 입력 (초기값: `monk1234`)
3. 다음 항목 수정 가능:
   - 메뉴 추가/삭제
   - 영업시간 변경
   - FAQ 업데이트
   - 대화 로그 확인

---

## 📝 **지식 베이스 커스터마이징**

### **business_info.json 예시**

```json
{
  "name": "카페 몽크",
  "type": "카페",
  "address": "서울시 강남구 테헤란로 123",
  "phone": "02-1234-5678",
  "hours": {
    "weekday": "10:00-22:00",
    "weekend": "11:00-23:00",
    "holiday": "월요일 휴무"
  },
  "special_notes": [
    "반려동물 동반 가능",
    "무료 와이파이 제공",
    "주차 2시간 무료"
  ]
}
```

### **menu.json 예시**

```json
{
  "categories": [
    {
      "name": "커피",
      "items": [
        {
          "name": "아메리카노",
          "price": 4500,
          "description": "깊고 풍부한 맛의 에스프레소",
          "options": ["HOT", "ICE"]
        },
        {
          "name": "카페라떼",
          "price": 5000,
          "description": "부드러운 우유와 에스프레소의 조화"
        }
      ]
    }
  ]
}
```

---

## 🎨 **UI 커스터마이징**

### **로고 변경**
```bash
# 가게 로고를 다음 경로에 복사
cp your-logo.png web-interface/assets/logo.png
```

### **색상 테마 변경**
`config/config.yaml` 파일 수정:
```yaml
ui:
  primary_color: "#667eea"
  secondary_color: "#764ba2"
  font_family: "Pretendard"
```

---

## 📊 **대시보드 & 분석**

### **주간 리포트 자동 생성**

```bash
# 매주 월요일 오전 9시 자동 실행
./generate_weekly_report.sh
```

생성되는 통계:
- 총 대화 수
- 자주 묻는 질문 TOP 10
- 고객 만족도
- 피크 시간대 분석

---

## 🔄 **업데이트 & 유지보수**

### **AI 모델 업데이트**
```bash
# 최신 모델로 업데이트
ollama pull llama3.2:3b
./restart.sh
```

### **지식 베이스 백업**
```bash
# 자동 백업 (매일 자동 실행됨)
./backup.sh

# 수동 백업
cp -r knowledge-base/ backups/$(date +%Y%m%d)/
```

---

## 💰 **비용 비교**

| 항목 | 클라우드 AI (Vertex) | MONK AI Kit |
|------|---------------------|-------------|
| **초기 비용** | 0원 | 0원 (오픈소스) |
| **월 비용** | ~5만원 | **0원** |
| **연 비용** | 60만원 | **0원** |
| **하드웨어** | 불필요 | PC 필요 (기존 PC 활용 가능) |
| **인터넷** | 필수 | 선택 |
| **데이터 소유** | 클라우드 | **로컬 (완전 소유)** |

---

## 🏪 **실제 사용 사례**

### **Case 1: 카페 "빈앤북스"**
- **도입 전**: 알바생이 같은 질문 반복 답변으로 피로
- **도입 후**: AI가 기본 질문 80% 처리, 직원은 서비스 집중
- **결과**: 고객 만족도 15% 상승, 인건비 월 50만원 절감

### **Case 2: 게스트하우스 "서울스테이"**
- **도입 전**: 심야/새벽 문의 대응 불가
- **도입 후**: 24시간 AI 응대, 예약 안내 자동화
- **결과**: 예약률 20% 증가, 구글 리뷰 평점 4.8 달성

---

## 🛡️ **보안 & 프라이버시**

- ✅ 모든 데이터는 로컬 PC에 저장
- ✅ 외부 서버 전송 없음
- ✅ 고객 개인정보 완전 보호
- ✅ 관리자 페이지 비밀번호 보호
- ✅ 대화 로그 자동 암호화 (옵션)

---

## 📞 **기술 지원**

### **무료 지원**
- 이메일: gdsajin@gmail.com
- 전화: 031-791-5030
- 카카오톡: @몽크스튜디오

### **유료 지원 (선택)**
- 원격 설치 대행: 5만원
- 맞춤형 UI 디자인: 10만원
- 월간 유지보수: 2만원

---

## 🚀 **로드맵**

### **v1.0 (현재)**
- ✅ Llama 3.2 3B 기반 챗봇
- ✅ 웹 인터페이스
- ✅ 기본 지식 베이스

### **v1.5 (2026 Q2)**
- 🔜 음성 인식 (STT)
- 🔜 음성 출력 (TTS)
- 🔜 다국어 지원 (영어, 일본어, 중국어)

### **v2.0 (2026 Q3)**
- 🔜 이미지 인식 (메뉴판 사진으로 질문)
- 🔜 예약 시스템 통합
- 🔜 결제 시스템 연동

---

## 📄 **라이선스**

- **오픈소스**: MIT License
- **상업적 사용**: 자유롭게 가능
- **재배포**: 출처 표기 필수

---

## 🐉 **MONK의 약속**

> "우리는 AI를 대기업의 전유물이 아닌, 모든 소상공인이 누릴 수 있는 도구로 만들고자 합니다.
> 
> MONK AI Kit는 단순한 챗봇이 아닙니다. 
> 이것은 여러분의 작은 가게가 대기업과 동등하게 경쟁할 수 있는 '디지털 무기'입니다.
> 
> 함께 성장합시다. 🚀🔥"
> 
> **- MONK.KR 팀**

---

**Made with 🔥 by MONK.KR**  
**Website**: https://monk.kr  
**Email**: gdsajin@gmail.com  
**Phone**: 031-791-5030
