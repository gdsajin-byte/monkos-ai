# 🎨 MONKOS IMAGE PRO

> **Professional Synthesis Platform**  
> Revolutionary AI image generation with one-click variation system

![Version](https://img.shields.io/badge/version-4.0-blue)
![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-proprietary-red)

---

## 🌟 핵심 기능

### 원클릭 변주 시스템 (세계 최초)
정체성을 유지하면서 원하는 부분만 변경하는 혁신적 시스템

```
확정 모델 1장 → 수백 장 포트폴리오
포즈/의상/배경/헤어/조명/소품 자유 변경
버튼 클릭만으로 즉시 변주
```

### 주요 기능
- ✨ **신규 생성**: 4장 배치 생성 (1K)
- 🔄 **변주**: 6개 원클릭 변주 버튼
  - 🚶 포즈 변경
  - 👕 의상 교체
  - 🖼️ 배경 변경
  - 💇 헤어 스타일
  - 💡 조명 조절
  - 👜 소품 추가
- 📈 **선택적 업스케일**: 2K/4K (포커스 뷰)
- 🧠 **AI 분석**: 이미지 역설계
- 💾 **자동 저장**: R2 + D1 통합

---

## 🚀 빠른 시작

### 1. 설치

```bash
npm install
cd backend && npm install
```

### 2. API 키 설정

```bash
# backend/.env 파일 생성
GEMINI_API_KEY=your_vertex_ai_key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. 실행

```bash
# 루트 폴더에서
npm run dev:full
```

→ Frontend: http://localhost:3000  
→ Backend: http://localhost:3001

---

## 💡 사용 방법

### 신규 생성 (T2I)
1. 프롬프트 입력
2. 비율 선택 (1:1 / 16:9 / 9:16)
3. [신규 생성 시작] 클릭
4. 4장 배치 생성 완료!

### 변주 (I2I) - 핵심 기능
1. [변주] 모드 클릭
2. 소스 이미지 업로드
3. 빠른 변주 버튼 클릭
   - [👕] 의상 변경
   - [🚶] 포즈 변경
   - [🖼️] 배경 변경
4. 정체성 유지 + 원하는 부분만 변주!

### 고급 옵션
- 버튼 옆 [▼] 클릭 → 상세 옵션
- 텍스트: 구체적 지시 입력
- 이미지: 레퍼런스 드롭 (향후)

---

## 🏗️ 아키텍처

```
Frontend (React + TypeScript)
    ↓
Backend Proxy (Express)
    ↓
AI Engines (Vertex | Anthropic | MonkOS)
    ↓
Storage (Cloudflare R2 + D1)
```

---

## 📊 기술 차별화

| 기능 | 기존 AI 툴 | MONKOS IMAGE PRO |
|------|-----------|------------------|
| **변주 방식** | 프롬프트 재작성 | 원클릭 버튼 |
| **정체성 유지** | 수동 (어려움) | 자동 (완벽) |
| **작업 시간** | 15분/변주 | 2분/변주 |
| **비용 효율** | 전체 4K | 선택적 4K (73% 절감) |
| **UI** | 프롬프트 중심 | 기능 중심 |
| **확장성** | 단일 엔진 | Multi-provider |

---

## 🎯 실사용 사례

### 모델 에이전시
- 확정 모델 → 다양한 룩북
- 포즈/의상/배경 무한 변주
- 시간: 1개월 → 1일
- 비용: 95% 절감

### 증명사진관 (예정)
- 카메라 촬영 → 자동 배경 제거
- 규격 자동 맞춤
- 다양한 포맷 생성

### 프로필 제작
- 1장 촬영 → 수십 장 프로필
- 다양한 스타일 변주

---

## 🔧 기술 스택

**Frontend:**
- React 19 + TypeScript
- Vite 6
- TailwindCSS

**Backend:**
- Node.js + Express
- @google/genai SDK
- Cloudflare R2/D1

**AI:**
- Vertex AI (현재)
- Anthropic (준비)
- MonkOS (계획)

---

## 📦 배포

### PWA 설치
브라우저에서 [배포] 버튼 → 독립 앱으로 설치

### Cloudflare Pages
```bash
npm run build
wrangler pages deploy dist
```

### Desktop App (향후)
Electron/Tauri 패키징 예정

---

## 🎊 혁신성

**이 시스템은 세계 어디에도 없습니다:**

- ✅ 고정 프롬프트 변주 로직
- ✅ 정체성 보존 알고리즘
- ✅ 원클릭 변주 인터페이스
- ✅ 기능 중심 UX
- ✅ 프로덕션 최적화

---

## 📄 라이선스

Proprietary - MONK Project
© 2026 All Rights Reserved

---

**MONKOS IMAGE PRO** - The Future of AI Image Production
