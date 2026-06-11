---
type: briefing
date: 2026-04-25
from: iMac/민아
to: 철창이 (전략·디자인 자문 / Claude Chat)
subject: monkos.ai 포털 메인 영역 전면 카드화 — JSX 시안 의뢰
ref: PROPOSAL_20260425_민아_포털전체개편_기안서.md
status: 의뢰
---

# 철창이 형, JSX 시안 부탁드립니다 — monkos.ai 메인 카드 그리드

작가님께서 **iCloud.com 스타일의 전면 카드 그리드**로 포털 메인 영역을 재구성하자 하십니다. JSX 즉답 잘하시는 형이 시안 한 장 잡아주시면 좋겠습니다.

---

## 1. 컨텍스트 (한 페이지로)

**서비스**: monkos.ai — AI 증명사진 플랫폼 + 무료 크롭앱 + 콘텐츠 허브 (블로그·FAQ·갤러리·게시판)

**현 메인 영역의 문제** (민아 진단 + 작가님 4/25 직지)
- 헤더 `Photography × AI × K-Beauty` — 증명사진 단서 0, K-Beauty 표기는 검색 유입자에게 노이즈
- /specs 26국 규격 데이터(Article+FAQPage+HowTo 스키마 완비)가 본문·nav 어디에도 진입로 없음 → 자산 사장
- 우측 사이드바 가이드 영상 = 검은 폰목업 + 가짜 dot/bar
- GA 30일 실측 (4/24): portal 255명 / idphoto-kr 1,587 / 결제 0건 / 오가닉 2%

**작가님 디렉션 (4/25)**
> "포털 메인영역을 전면 카드화 하는 디자인으로 바꿔보자. 아이클라우드처럼."

→ 헤더는 어느 정도 유지하되 **메인 콘텐츠 영역을 12개 내외 타일 카드 그리드로 재편**. 각 카드가 서비스/규격/콘텐츠/가이드의 진입로.

---

## 2. 카드 구성안 (12장 / 4×3 그리드 권장)

| # | 카드 | 카테고리 | 링크 | 시각 모티프 |
|---|------|----------|------|-------------|
| 1 | **AI 증명사진** (LIVE) | 메인 서비스 | https://idphoto-kr.monkos.ai | 📷 큰 아이콘 + 보라 그라디언트 |
| 2 | **무료 크롭앱** (FREE) | 메인 서비스 | /crop | ✂️ + 그린 그라디언트 |
| 3 | 🇰🇷 한국 규격 | /specs | /specs#korea | 태극·여권 모티프 |
| 4 | 🇯🇵 日本 規格 | /specs | /specs#japan | 일장기·재류카드 |
| 5 | 🇺🇸 USA Specs | /specs | /specs#usa | 성조기·헤드샷 |
| 6 | 🇪🇺 Europe Specs | /specs | /specs#europe | EU·UK·DE·ES |
| 7 | 🌏 기타 (8국) | /specs | /specs#others | 호주·캐나다·중국·베트남 외 |
| 8 | **가격** | 정보 | /pricing | 💳 ₩9,900 강조 |
| 9 | **자주 묻는 질문** | 정보 | /faq | ❓ |
| 10 | **블로그** (한송이 매거진) | 콘텐츠 | /blog | 📰 최신 1건 썸네일 |
| 11 | **증명사진 사용법** (쇼츠) | 가이드 | (작가님 영상 URL) | ▶ 9:16 영상 썸네일 |
| 12 | **크롭앱 사용법** (쇼츠) | 가이드 | (작가님 영상 URL) | ▶ 9:16 영상 썸네일 |

→ 영상 URL은 추후 작가님 입력. 시안 단계에서는 placeholder.

---

## 3. 디자인 토큰 (현 portal.css 정합)

```js
const tokens = {
  // 라이트 베이스
  bg:        '#FAFAF8',
  surface:   '#F5F4F0',
  white:     '#FFF',
  border:    '#E8E6E1',
  borderH:   '#D4D1CA',
  ink:       '#1A1A18',
  inkSub:    '#73726C',
  inkLight:  '#9C9A92',

  // 액센트 (보라 — 메인 서비스 톤)
  accent:    '#4A3ABA',
  accentL:   '#6C5CE7',
  accentXL:  '#A78BFA',

  // 그린 (FREE / 크롭앱 톤)
  green:     '#1A7A5C',

  // Cr Coin Gold (트러스트·가격 강조)
  gold:      '#D4A017',
  goldLight: '#FCEABB',

  // 폰트
  serif:     "'Cormorant Garamond', Georgia, serif",  // 브랜드 H1
  sans:      "'Pretendard', 'Noto Sans JP', sans-serif",
};
```

---

## 4. 디자인 요건

### 톤 — iCloud.com을 모티프로
- 둥근 카드 (border-radius 16~20px)
- 카드 호버 시 살짝 lift + scale (`transform: translateY(-2px) scale(1.02)`)
- 그림자는 hover 시에만 (`box-shadow: 0 8px 24px rgba(0,0,0,.08)`)
- 카드 배경 = 화이트 또는 카테고리별 컬러 그라디언트 (메인 서비스 2개는 보라/그린 강조, 규격 5개는 라이트 톤)

### 구조 — 카드 anatomy
```
┌─────────────────────────┐
│  [아이콘 또는 썸네일]    │  ← 비중 60%
│                         │
├─────────────────────────┤
│  카드 제목 (h3, 16~18px) │
│  부제 (12~13px, ink-sub) │  ← 비중 40%
│  [뱃지: LIVE / FREE 등]  │
└─────────────────────────┘
```

### 그리드
- Desktop: 4열 (`grid-template-columns: repeat(4, 1fr)`)
- Tablet: 3열 또는 2열
- Mobile: 2열 (작가님 4/24 GA 분석 — 모바일 비중 높음)
- gap: 20~24px

### 첫 화면 (Above the fold) 우선순위
1열: AI 증명사진 / 무료 크롭앱 / 가격 / FAQ (전환 직결)
2열: 한국 / 일본 / USA / 유럽 (검색 의도 대응)
3열: 기타 / 블로그 / 쇼츠 1 / 쇼츠 2 (콘텐츠 회유)

### 다국어
- 카드 제목·부제는 props로 받는 구조 (한/일/영 분기 가능하게)
- 시안 단계에서는 KO 텍스트 하드코딩 OK

---

## 5. 출력 형식

**단일 React functional component**, 자기완결적.

```jsx
// PortalMainCardGrid.jsx
export default function PortalMainCardGrid({ lang = 'ko' }) {
  // 카드 데이터, 그리드 레이아웃, hover 인터랙션, 반응형 모두 포함
  return (
    <main className="portal-main">
      {/* 12개 카드 */}
    </main>
  );
}
```

**제약**
- 외부 라이브러리 의존 금지 (Tailwind 사용 가능, 단 inline style fallback도 허용)
- 단일 파일, 즉시 실행 가능
- 데이터(카드 12개)는 컴포넌트 내부 배열로 하드코딩
- 아이콘은 이모지 또는 inline SVG
- 영상 카드 2개는 `<a target="_blank" rel="noopener">` + 썸네일 placeholder (회색 배경 + ▶ 오버레이)

---

## 6. 참조

- **[PROPOSAL_20260425_민아_포털전체개편_기안서.md](PROPOSAL_20260425_민아_포털전체개편_기안서.md)** — 본 BRIEFING의 모(母) 기안서
- **현 포털 코드**: `monkos_AI/portal/public/index.html` + `portal.css`
- **/specs 라이브 데이터**: `monkos_AI/portal/lib/cms/specs-data.json` (26국)

---

## 7. 다음 단계

1. **철창이 형 JSX 시안 1차** — 본 BRIEFING 기준
2. 작가님 + 민아 시안 검토 (필요 시 2~3회 반복)
3. 시안 확정 → 막내가 `monkos_AI/portal/public/index.html` + `portal.css`로 컨버트
4. `deploy.sh prod` → 라이브 검증 (민아)

---

> 형, 형의 즉답력에 기대고 있습니다. 한 장 잡아주시면 작가님과 같이 굴려보겠습니다.
> — iMac/민아
