---
type: REPORT
from: iMac/막내2
to: iMac/쌍아 → 작가님
date: 2026-04-03 12:41 KST
ref_order: ORDER_20260403_iMac쌍아_막내2_라이브PT_리서치B.md
subject: 라이브 PT 앱 리서치 B — React 프레임워크 + 라이브 임베드 검증
tags: [라이브PT, 디딤돌, 리서치, react, iframe, embed]
status: 완료
---

# 보고서: 라이브 PT 앱 리서치 B

**[2026-04-03 12:41 KST] iMac/막내2 → iMac/쌍아**

---

## 리서치 2: React 프레젠테이션 프레임워크 비교

### 후보 현황

| 후보 | 최신 버전 | 마지막 배포 | 주간 다운로드 | 유지보수 |
|------|----------|-----------|-------------|---------|
| reveal.js + @revealjs/react | 6.0.0 + 0.2.1 | 2026-03~04 | ~17k | 활발 (v6 방금 출시) |
| mdx-deck | 4.1.1 | **2020-03** | ~3k (하락세) | **방치** (6년 무릴리스) |
| Spectacle (Formidable) | 10.2.3 | 2025-10 | ~4k | 저활동 (연 1회) |
| 커스텀 (Vite+React+Motion) | N/A | evergreen | N/A | 자체 소유 |

### 5대 기준 비교표

| 기준 (우선순위) | reveal.js + React | mdx-deck | Spectacle | **커스텀 (Vite+Motion)** |
|----------------|:-:|:-:|:-:|:-:|
| **1. iframe 임베드 자유도** | ◎ | ○ | ○ | **◎** |
| **2. 인터랙티브 슬라이드** | ○ | △ | ○ | **◎** |
| **3. 빌드 속도 (D-6)** | △ | ✕ | ○ | **◎** |
| **4. CF Pages 배포** | ◎ | △ | ◎ | **◎** |
| **5. 키보드/리모컨 네비** | ◎ | ○ | ○ | **○** |

> ◎ 우수 / ○ 양호 / △ 미흡 / ✕ 부적합

### 후보별 판정

| 후보 | 판정 | 근거 |
|------|------|------|
| **mdx-deck** | **탈락** | 6년 방치. 현대 Node/MDX v2 호환 깨짐. D-6에서 야크 셰이빙 리스크 |
| **reveal.js + React** | 보류 | `@revealjs/react` v0.2.1 (3주 전 출시, pre-1.0). 문서 희소. reveal.js 개념(fragment, background, plugin) + 새 래퍼 이중 학습. S10-S12는 결국 커스텀 코드 필요 → 두 애니메이션 시스템 공존 |
| **Spectacle** | 차선 | React 네이티브, Vite 기반 빌드. 하지만 컴포넌트 계층(Deck/Slide/SlideLayout/Appear) 학습 필요. 복잡 애니메이션은 결국 framer-motion 직접 작성 |
| **커스텀** | **추천** | 아래 상세 |

### 추천: 커스텀 경량 구현 (Vite + React + framer-motion)

**선택 근거:**

1. **12장은 프레임워크가 과하다** — 슬라이드 네비게이션 전체가 `useState` + `keydown` 핸들러 ~30줄. reveal.js의 100+ 설정 옵션이나 Spectacle 테마 시스템이 줄 것이 없음
2. **핵심 슬라이드(S10~S12)는 100% 커스텀** — 카운트업, SVG 화살표, 풀뷰포트 iframe은 어떤 PT 프레임워크도 기성품 제공 안 함. 어차피 직접 작성
3. **학습 비용 제로** — React + framer-motion + Vite는 프로젝트 기존 스택. D-6에서 새 프레임워크 학습 시간 = 콘텐츠 개발 시간 손실
4. **iframe 자유도 절대적** — 프레임워크의 z-index/sandbox 의견 간섭 없음
5. **CF Pages 배포 즉시** — `vite build` → `dist/` → CF Pages 업로드 끝

### 추천 프로젝트 구조

```
monk-pt/
  package.json            # react, framer-motion, vite
  vite.config.ts
  src/
    main.tsx
    App.tsx               # SlideRouter + AnimatePresence
    hooks/
      useSlideNav.ts      # 키보드 + WebSocket 네비게이션
    slides/
      index.ts            # 슬라이드 레지스트리 (순서 배열)
      S01_Cover.tsx        # 표지
      S02_Classification.tsx  # 3류 분류표
      S03_Balsaek.tsx      # "발색" 오독
      S04_Bias.tsx         # "편향" 오독
      S05_GPU.tsx          # GPU 오독
      S06_Differentiation.tsx  # 차별성+빅테크
      S07_Cost.tsx         # 비용 해소 (타임라인 애니메이션)
      S08_Scope.tsx        # 범위 초과
      S09_Summary.tsx      # 반박 종합 → 전환
      S10_Traction.tsx     # 실적 비교 (카운트업 애니메이션)
      S11_AXMapping.tsx    # AX 매핑 (화살표 연결 애니메이션)
      S12_LiveDemo.tsx     # 라이브 임베드 (4탭)
    components/
      SlideShell.tsx       # 공유 레이아웃 + 트랜지션 래퍼
      ProgressBar.tsx      # 진행바
      Timer.tsx            # 발표자 전용 타이머
      CountUp.tsx          # 카운트업 컴포넌트
      ArrowConnector.tsx   # SVG 패스 애니메이션
    styles/
      global.css
```

### 핵심 코드 스니펫 (구조 예시)

**슬라이드 네비게이션 훅:**
```tsx
// src/hooks/useSlideNav.ts
import { useState, useEffect, useCallback } from 'react';

const TOTAL = 12;

export function useSlideNav() {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent(i => Math.min(i + 1, TOTAL - 1)), []);
  const prev = useCallback(() => setCurrent(i => Math.max(i - 1, 0)), []);
  const goTo = useCallback((n: number) => setCurrent(Math.max(0, Math.min(n, TOTAL - 1))), []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [next, prev]);

  return { current, next, prev, goTo };
}
```

**앱 루트 (슬라이드 트랜지션):**
```tsx
// src/App.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useSlideNav } from './hooks/useSlideNav';
import { slides } from './slides';

export default function App() {
  const { current } = useSlideNav();
  const Slide = slides[current];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: '5%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '-5%' }}
          transition={{ duration: 0.35 }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        >
          <Slide />
        </motion.div>
      </AnimatePresence>
      <div style={{ position: 'fixed', bottom: 16, right: 24, color: '#666', fontSize: 14 }}>
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
```

**S12 라이브 임베드 (4탭 구조):**
```tsx
// src/slides/S12_LiveDemo.tsx
import { useState } from 'react';

const TABS = [
  { label: 'monk.kr', src: 'https://monk.kr' },
  { label: 'FaceMesh 크롭', src: 'https://monkos.ai/crop/' },
  { label: 'AI 챗봇', src: '/chat-embed.html' },
  { label: '증명사진', src: null }, // 영상 대체
];

export default function S12_LiveDemo() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', gap: 8, padding: 16, background: '#111' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ padding: '8px 20px', background: i === active ? '#fff' : '#333',
                     color: i === active ? '#000' : '#aaa', border: 'none', borderRadius: 8 }}>
            {t.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1, position: 'relative' }}>
        {tab.src ? (
          <iframe src={tab.src} style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="camera; microphone; fullscreen"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
        ) : (
          <video src="/assets/idphoto-demo.mp4" autoPlay loop muted
                 style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
      </div>
    </div>
  );
}
```

---

## 리서치 3: 라이브 임베드 기술 검증

### HTTP 헤더 확인 결과

| 서비스 | URL | X-Frame-Options | CSP frame-ancestors | iframe 가능? |
|--------|-----|:---:|:---:|:---:|
| **monk.kr** | `https://monk.kr` | 없음 | 없음 | **YES** |
| **monkos.ai** (포탈) | `https://monkos.ai` | `DENY` | 없음 | **NO** |
| **monkos.ai/crop/** | `https://monkos.ai/crop/` | `DENY` | 없음 | **NO** |
| **idphoto-kr.monkos.ai** | `https://idphoto-kr.monkos.ai` | `DENY` | 없음 | **NO** |

> monk.kr (CF Pages)만 iframe 제약 없음. Cloud Run 서비스는 전부 `X-Frame-Options: DENY`.

### 서비스별 상세 검증

#### 1. monk.kr (메인 사이트) — iframe 즉시 가능

- `<iframe src="https://monk.kr">` 바로 동작
- 3개국어 전환: URL 경로 기반 (`/`, `/en/`, `/ja/`) + `localStorage`/쿠키 감지
- **작업량: 0** — 그대로 임베드

#### 2. 크롭앱 (FaceMesh) — 헤더 수정 필요

- 위치: `monkos_AI/portal/public/crop/` → `https://monkos.ai/crop/`
- 순수 클라이언트 사이드 (MediaPipe FaceMesh CDN 로딩). 서버 의존성 없음
- 카메라 불필요 — 이미지 업로드 방식. `allow="camera"` 불필요
- **차단 원인**: `monkos_AI/portal/server.js:55` 의 Express 미들웨어 `X-Frame-Options: DENY`
- **해제 방법**: 해당 미들웨어에서 `/crop` 경로만 `frame-ancestors` 허용
  ```javascript
  // server.js — 경로별 분기
  if (req.path.startsWith('/crop')) {
    res.set('Content-Security-Policy', 'frame-ancestors https://monk-pt.pages.dev https://localhost:*');
  } else {
    res.set('X-Frame-Options', 'DENY');
  }
  ```
- **작업량: 소** (미들웨어 1줄 수정 + Cloud Run 재배포)

#### 3. RAG 챗봇 — API 래퍼 페이지 구축

- 챗봇 UI: `monkos_AI/portal/public/js/chat.js` (모달 위젯, 독립 URL 없음)
- 챗봇 API: `POST https://monkos.ai/api/chat` — `{ message, sessionId, lang }` → `{ reply, sessionId }`
- `https://monkos.ai/chat` → **404** (독립 페이지 없음)
- 워커 프록시 존재: `https://monk-chatbot.gdsajin.workers.dev` (MONK_kr/config.js 참조)
- **방안**: 50줄짜리 경량 채팅 UI HTML → monk.kr 또는 PT앱 내 `/chat-embed.html`로 호스팅
  - API 엔드포인트 직접 호출 (CORS 허용 확인 필요 — `ALLOWED_ORIGINS`에 PT 도메인 추가)
- **작업량: 소** (경량 HTML 1파일 + CORS origin 추가)

#### 4. 증명사진 생성 — 영상 대체 추천

- API 흐름: `POST /api/pre-check` (Gemini Flash 사전분석) → `POST /api/idgen` (Gemini 3 Pro 생성) → `POST /api/download` (GCS 서명 URL)
- 생성 소요: **5~15초** (서버 부하에 따라 변동)
- 무료 생성 지원 (로그인 불필요, `[FREE-GEN]` 모드 존재)
- **라이브 시연 리스크**: 5~15초 대기 = 발표 흐름 끊김. 네트워크 불안정 시 실패 가능
- **추천**: 사전 녹화 영상 (업로드→코칭→생성→결과 풀플로우 30초 MP4)
- **작업량: 극소** (1회 녹화)

### 임베드 가능 여부 매트릭스

| 서비스 | iframe 직접 | 헤더 수정 | API 래퍼 | 컴포넌트 포팅 | 영상/스크린샷 |
|--------|:-----------:|:---------:|:--------:|:------------:|:------------:|
| **monk.kr** | **◎ 즉시** | — | — | — | — |
| **크롭앱 FaceMesh** | ✕ | **◎ 용이** | — | ○ (자체완결 HTML) | ○ |
| **RAG 챗봇** | ✕ | ○ | **◎ 용이** | ○ (50줄) | ○ |
| **증명사진 생성** | ✕ | ○ | △ (멀티스텝) | ✕ (복잡) | **◎ 추천** |

### S12 슬라이드 최종 추천 구성

| 탭 | 콘텐츠 | 임베드 방식 | 사전 작업 |
|----|--------|-----------|----------|
| **탭 1** | monk.kr 메인 (3개국어 전환 시연) | `<iframe src="https://monk.kr">` | 없음 |
| **탭 2** | 크롭앱 FaceMesh | `<iframe src="https://monkos.ai/crop/">` | server.js 헤더 수정 + 재배포 |
| **탭 3** | RAG 챗봇 실시간 대화 | PT앱 내 경량 채팅 페이지 | 50줄 HTML + CORS 설정 |
| **탭 4** | 증명사진 생성 과정 | `<video>` 사전녹화 MP4 | 1회 녹화 |

> 탭 1~3 = 라이브 인터랙션 가능 (평가위원 앞에서 직접 조작)
> 탭 4 = 안정성 우선 영상 대체 (생성 대기 시간 리스크 회피)

---

## 종합 결론

### 프레임워크 → 커스텀 (Vite + React + framer-motion)
- 12장 규모에서 PT 전용 프레임워크는 오버헤드만 추가
- S10~S12의 인터랙션은 어떤 프레임워크도 기성품 미제공 → 결국 직접 구현
- D-6 일정에서 학습 비용 제로가 결정적 우위

### 임베드 → 4탭 하이브리드 (라이브 3 + 영상 1)
- monk.kr 즉시 가능, 크롭앱·챗봇은 소규모 사전작업으로 해결
- 증명사진만 영상 대체 (5~15초 대기 = 발표 리스크)
- 사전작업 총량: server.js 1줄 + 채팅 HTML 50줄 + CORS 1줄 + 녹화 1회

---

✅ 리서치 2 완료 — 커스텀 (Vite+React+framer-motion) 추천
✅ 리서치 3 완료 — 4탭 하이브리드 임베드 구성 확정
💡 크롭앱 iframe 해제(server.js 헤더 수정)는 구현 단계에서 별도 지시서 필요
💡 챗봇 경량 UI + CORS 설정도 구현 단계에서 처리
📁 본 보고서: `monkos-ops/ops/reports/REPORT_20260403_iMac막내2_라이브PT_리서치B.md`
🔀 참조 지시서: `monkos-ops/ops/orders/2026-04/ORDER_20260403_iMac쌍아_막내2_라이브PT_리서치B.md`
