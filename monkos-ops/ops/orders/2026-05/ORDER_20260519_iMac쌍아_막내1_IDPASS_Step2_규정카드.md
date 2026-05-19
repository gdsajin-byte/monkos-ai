---
type: order
date: 2026-05-19
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS Step2 업로드 화면 — 촬영 가이드 + 규정 카드 + 공식 링크

> **[2026-05-19 14:08 KST] iMac/쌍아 → iMac/막내1**

## 배경

Step2(업로드) 화면을 철창이 시안 기반으로 리디자인한다. 현재 Step2는 사진 피커만 있는데, 촬영 가이드 일러스트 + 체크리스트 + 국가별 규정 카드 + 공식 기관 링크를 추가한다.

**2단계 진행**: HTML 시안으로 페이지뷰 먼저 제작 → 작가님 승인 → SwiftUI 본코딩.

## 사전 컨텍스트 파악 (착수 전 필수)

1. **PF_CROP 히스토리 확인**: `monkos-ops/ops/portfolios/PF_CROP/README.md` — Phase 2 현황까지 읽기
2. **철창이 시안 확인**: `~/Desktop/crop app/idpass_upload_v4.html` — **브라우저에서 열어 시각 확인 필수** (392줄, base64 이미지 포함)
3. **현재 Step2 코드 확인**: `apps/MonkosCrop/MonkosCrop/ContentView.swift` — `// MARK: - Step 2` 섹션
4. **규격 데이터 확인**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 202국 규격 데이터 (size/px/head/std)
5. **2차 검수 리포트 확인** (공식 URL 출처):
   - `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내1_증명사진규격_2차검수_아시아오세아니아.md`
   - `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내2_증명사진규격_2차검수_유럽.md`
   - `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내3_증명사진규격_2차검수_아메리카중동.md`
   - `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내4_증명사진규격_2차검수_아프리카.md`

## 시안 구조 (idpass_upload_v4.html)

```
Step2 — 업로드 화면
├── 헤더 (IDPASS 로고 + 스테퍼 5단)
├── nav-row: ← 뒤로 + spec-badge (🇷🇺 러시아 · 여권 · 35×45)
├── 페이지 타이틀: "사진 업로드"
│
├── upload-zone (3:4 비율, 규격별 동적)
│   ├── 참조 인물 실루엣 (반투명)
│   ├── 가이드 라인 4개: HEAD TOP / EYE LINE / CHIN / SHOULDER
│   ├── 코너 브래킷 4개
│   ├── 스펙 태그: "35 × 45 mm" + "ICAO"
│   ├── 콜아웃 3개: 이마·눈썹 보이게 / 밝은 배경 / 어깨선 포함
│   └── CTA: 탭하여 사진 선택
│
├── checklist (2행 × 3열)
│   ├── ✓ 정면 응시 / ✓ 밝은 배경 / ✓ 무표정
│   └── ✕ 안경·모자 / ✕ 그림자 / ✕ 얼굴 가림
│
├── reg-card (규정 카드)
│   ├── reg-header: 국기 + "러시아 여권사진 규정" + 현지어 부제
│   ├── reg-specs: 35×45 SIZE / 600 DPI / 32-36 FACE (3칸)
│   ├── reg-section (공통 요구사항): ✓/✕ 리스트
│   ├── reg-special (특이사항): ⚡ highlight + ℹ️ info 알림 카드
│   └── reg-link: 공식 규정 링크 (gosuslugi.ru)
│
└── CTA: 갤러리에서 선택 버튼
```

## Phase 1: HTML 페이지뷰 (먼저 완료)

시안을 기반으로 **동적 데이터 바인딩 가능한 HTML 프로토타입**을 제작한다.

### 요구사항

1. **시안의 CSS/레이아웃을 그대로 유지** — 색상, 간격, 폰트, 그라데이션, 애니메이션 모두 보존
2. **러시아 하드코딩 → 데이터 변수화** — 국가명, 국기, 규격, 특이사항, 공식 링크를 JS 객체로 분리
3. **최소 3국 데이터 포함** — 러시아(시안 원본), 한국, 미국 (정사각형 51×51 케이스)
4. **드롭다운 또는 버튼으로 국가 전환** — 데이터만 바뀌고 UI 구조는 동일하게
5. **upload-zone 비율 동적** — 35×45 → 3:4, 51×51 → 1:1 등 규격에 따라 변환
6. **공식 링크**: A등급 국가는 공식 기관 링크 표시, B등급 또는 URL 없는 국가는 링크 섹션 숨김
7. **특이사항**: 국가별 고유 경고 (배경색 허용, AI 금지, 규격 전환 등). 없는 국가는 섹션 숨김

### 데이터 구조 예시

```javascript
const countries = {
  "ru": {
    flag: "🇷🇺",
    name: { ko: "러시아", en: "Russia", local: "Россия" },
    doc: "여권",
    size: "35×45", dpi: 600, face: "32-36",
    std: "GOST R ISO/IEC 19794-5",
    common: [
      { ok: true, text: "최근 6개월 이내 촬영한 사진" },
      // ...
    ],
    special: [
      { type: "highlight", icon: "⚡", title: "배경색: 흰색 외 허용", desc: "밝은 회색, 밝은 파란색..." },
      // ...
    ],
    officialUrl: "https://www.gosuslugi.ru/",
    officialName: "gosuslugi.ru — 러시아 공공서비스 포털",
    grade: "A"
  },
  "kr": { ... },
  "us": { ... }
};
```

### 산출물

- `~/Desktop/crop app/idpass_upload_v5_proto.html` — 단일 HTML 파일 (인라인 CSS+JS)
- 브라우저에서 열어서 국가 전환 + 규정 카드 + 링크 동작 확인 가능한 상태

## Phase 2: SwiftUI 본코딩 (Phase 1 승인 후)

> **Phase 1 승인이 떨어진 후에만 착수한다.**

### 작업 내용

1. **countries.jsonl 확장** — 공식 URL, 특이사항, 공통 요구사항 필드 추가
2. **SpecData.swift** — DocSpec에 officialUrl, specialNotes, commonRequirements 필드 추가
3. **ContentView.swift Step2** — 시안 기반 SwiftUI 구현
   - upload-zone (규격별 동적 비율)
   - 촬영 가이드 오버레이 (HEAD TOP / EYE LINE / CHIN / SHOULDER)
   - 체크리스트 (✓/✕ 그리드)
   - 규정 카드 (reg-card → SwiftUI View)
   - 공식 링크 (Link + openURL)
4. **빌드 검증**: `cd apps/MonkosCrop && swift build`

### 데이터 소스

- 공식 URL: 2차 검수 리포트 4건에서 A등급 국가 URL 추출
- 특이사항: 리포트의 "특이점" 컬럼 + reg-special 패턴 적용
- 공통 요구사항: ICAO 기본 항목 — 전 국가 공통, 국가별 오버라이드 가능

### ⚠️ 규정 정확성 주의

- **안경 착용 금지는 공통 요구사항이 아니다.** 시안(러시아 예시)에서 "안경 착용 금지"가 공통에 들어가 있으나, 이는 러시아 고유 규정이다. 한국 등 다수 국가는 안경 착용을 금지하지 않는다 (눈동자 선명 조건만 있음).
- 안경 금지는 **해당 국가 특이사항(reg-special)**으로만 표시한다. 공통 요구사항에 넣지 않는다.
- 안경 관련 국가별 정책: 러시아(금지), 호주(2018.7~금지), 말레이시아(완전금지), 홍콩(최근금지). 한국·미국·일본 등은 금지하지 않음.
- 공통 체크리스트의 ✕ 항목은 "선글라스·모자" / "그림자" / "얼굴 가림"으로 수정 (안경 제외).
- **되는 것만 응답 원칙 (헌법 4조 4항)**: 확인 안 된 규정을 추정으로 넣지 말 것. 2차 검수 리포트에 없는 국가의 특이사항은 비워둔다.

## 완료 기준

### Phase 1 (HTML 프로토)
- [ ] 시안 디자인 충실 재현
- [ ] 3국 이상 국가 전환 동작
- [ ] upload-zone 비율 동적 전환
- [ ] 규정 카드 데이터 바인딩
- [ ] 공식 링크 A등급만 표시
- [ ] 특이사항 유/무에 따른 섹션 토글

### Phase 2 (SwiftUI — 승인 후)
- [ ] countries.jsonl 확장 (최소 A등급 국가 공식 URL 전수)
- [ ] Step2 SwiftUI 구현
- [ ] swift build 성공
- [ ] 실행 후 3국 이상 전환 확인

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- ch7 6조: 막힘 시 PF 선행 참조 — `monkos-ops/ops/portfolios/PF_CROP/README.md`
- **Phase 1 완료 후 보고 → 작가님 승인 대기 → Phase 2 착수** (승인 없이 본코딩 금지)
- 기존 Step1, Step3~5 코드 변경 금지 — Step2만 수정

## 참조 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| 시안 HTML | `~/Desktop/crop app/idpass_upload_v4.html` | 디자인 정본 |
| PF_CROP | `monkos-ops/ops/portfolios/PF_CROP/README.md` | 컨텍스트 |
| ContentView | `apps/MonkosCrop/MonkosCrop/ContentView.swift` | 현재 Step2 |
| SpecData | `apps/MonkosCrop/MonkosCrop/SpecData.swift` | 규격+i18n |
| countries.jsonl | `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` | 202국 데이터 |
| 2차 검수 리포트 | `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내*_2차검수_*.md` | 공식 URL 출처 |

## 보고

Phase 1 완료 후 `✅❌💡⏳📁🔀` 형식으로 보고. 프로토 HTML 경로 명시.
