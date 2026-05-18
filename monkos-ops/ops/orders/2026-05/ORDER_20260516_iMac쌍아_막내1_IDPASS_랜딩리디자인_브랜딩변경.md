---
type: order
date: 2026-05-16
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS 랜딩 리디자인 + 앱 전체 브랜딩 변경

> **[2026-05-16 14:09 KST] iMac/쌍아 → iMac/막내1**

## 배경

크롭앱 브랜드명이 **MONKOS CROP → IDPASS** (powered by MONKOS AI)로 확정되었다.
철창이가 제작한 IDPASS 랜딩 페이지 시안(`Desktop/crop app/idpass_landing_v3.html`)을 앱 내 Landing 화면에 적용하고, 앱 전체 브랜딩을 IDPASS로 변경한다.

## 사전 컨텍스트 파악 (착수 전 필수)

1. **PF_CROP 히스토리 확인**: `monkos-ops/ops/portfolios/PF_CROP/README.md` — 전체 히스토리를 읽고 현재 Phase 2 상태를 파악
2. **시안 파일 확인**: `Desktop/crop app/idpass_landing_v3.html` — 브라우저에서 열어 시각 확인 (583줄, base64 이미지 포함)
3. **현재 Landing 코드 확인**: `ContentView.swift:1188~1325` — LandingView + StatBadge
4. **현재 Swift 소스 전체 구조 확인**: `Desktop/crop app/WORKFLOW.md` — 파일 구조 + 빌드 방법
5. **디자인 토큰**: `ContentView.swift` 상단의 V1 struct (색상/폰트)

## 작업 1: Landing 화면 전면 교체

### 시안 구조 (idpass_landing_v3.html)

```
Hero 섹션 (전체 화면)
├── 배지: "FREE · NO ADS · NO LOGIN" (초록 도트 + 테두리)
├── 로고: "ID" (흰) + "PASS" (accent)
├── 서브: "powered by MONKOS AI"
├── 태그라인: "증명사진, 다 통과."
├── 부제: "200개국 규격 · 서버 전송 없음 · 완전 무료"
└── Phone Demo (240px, 3:4 비율)
    ├── Before 이미지 → After 이미지 전환
    ├── 스캔라인 애니메이션
    ├── 눈 도트 (왼/오)
    ├── 가이드라인 (눈/턱/정수리)
    ├── 코칭 라벨 3개
    ├── PASS 스탬프 (원형, 회전)
    ├── 여권 이미지 슬라이드인
    └── IDPASS 엔드카드 (페이드 인/아웃)

스크롤 섹션 (Hero 아래)
├── Transformation Strip: 셀카 → 배경제거 → 증명사진 (3카드 + 화살표)
├── Process 4단계: 사진선택 → 배경제거 → IDPASS 검수 → 완료
├── Features 3칸: 200+국 / 0원 / 30초
├── Trust 4행: 서버전송없음 / ICAO검증 / 오프라인 / MONKOS AI
└── CTA: "무료 다운로드 →" 버튼
```

### 애니메이션 타임라인 (13.8초 루프)

```
0.0s — 리셋 (Before 이미지)
0.5s — 상태 "SCANNING", 스캔라인 시작
0.8s — 코너 브래킷 표시
1.5s — 눈 도트 표시
1.8s — 눈 가이드라인
2.2s — 코칭 라벨 1 (EYE 43%)
2.5s — step "2/4"
2.8s — 턱 가이드라인
3.0s — 코칭 라벨 2 (HEAD 34mm)
3.5s — 코칭 라벨 3 표시
3.8s — 정수리 가이드라인
4.2s — step "3/4"
4.8s — 배경 플래시 + After 이미지 전환
6.0s — PASS 스탬프 표시
6.8s — 여권 이미지 슬라이드인
9.5s — 페이드 블랙
12.0s — IDPASS 엔드카드
12.8s — 리셋
13.8s — 재시작
```

### 구현 방침

- 기존 LandingView (1190~1300행) + StatBadge (1302~1321행) 전면 교체
- **Phone Demo는 기존 InspectionState 데모 루프를 확장/개선** — 시안의 타임라인을 참조하되 SwiftUI 애니메이션으로 자연스럽게 구현
- Before/After 이미지: 현재 person.fill SF Symbol → **실제 샘플 이미지 사용** (`Desktop/crop app/ID_Photosample.jpg`를 Resources에 추가). After는 크롭+배경제거 결과 느낌의 이미지 필요 — 없으면 Before에 흰배경 합성으로 대체
- 스크롤 하단 섹션: ScrollView 내부에 Transformation/Process/Features/Trust/CTA 순서로 배치
- i18n: 기존 tr() 함수 활용. SpecData.swift의 ko/en/ja 사전에 새 키 추가
- 기존 V1 디자인 토큰 유지 (#05080E / #00D4AA)
- 시안의 CSS를 SwiftUI로 1:1 변환할 필요 없음 — **시안의 의도와 느낌을 SwiftUI 네이티브로 구현**

## 작업 2: 앱 전체 브랜딩 변경

### ContentView.swift 변경 대상

| 위치 | 현재 | 변경 |
|------|------|------|
| ~958행 | `MONKOS · VERIFIED` | `IDPASS · VERIFIED` |
| ~1037행 | `MONKOS` (Step5 상단) | `IDPASS` |
| ~1148행 | `© 2026 MONKOS` | `© 2026 IDPASS` |
| ~1150행 | `monkos.ai · TERMS` | `idpass by monkos.ai · TERMS` |

### SpecData.swift 변경 대상

- i18n 사전에 IDPASS 관련 새 키 추가 (hero, landing 섹션)
- 기존 "MONKOS CROP" 문자열 → "IDPASS" 변경

### Step5 완료 화면의 Thanks 프로모

- "MONKOS AI STUDIO" → "MONKOS AI STUDIO" 유지 (이건 외부 서비스 프로모이므로 MONKOS 브랜드 유지)

## 작업 3: 빌드 검증

```bash
# macOS 빌드
cd apps/MonkosCrop && swift build

# 실행하여 Landing 화면 시각 확인
.build/debug/MonkosCrop
```

- Landing 애니메이션 루프 정상 동작 확인
- Step1~5 전체 플로우에서 IDPASS 브랜딩 일관성 확인
- 기존 기능(크롭, 배경제거, 다운로드) 정상 동작 확인

## 완료 기준

- [ ] Landing 화면 시안 반영 (Hero + Phone Demo 애니 + 스크롤 섹션)
- [ ] 앱 전체 MONKOS CROP → IDPASS 브랜딩 변경
- [ ] i18n 키 추가 (ko/en/ja)
- [ ] macOS swift build 성공
- [ ] 실행 후 Landing 애니메이션 루프 정상 확인

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- ch7 6조: 막힘 시 PF 선행 참조 — `monkos-ops/ops/portfolios/PF_CROP/README.md`
- 기존 Step1~5 기능 코드 변경 최소화 — Landing + 브랜딩 문자열만 변경

## 참조 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| 시안 HTML | `~/Desktop/crop app/idpass_landing_v3.html` | 디자인 정본 |
| PF_CROP | `monkos-ops/ops/portfolios/PF_CROP/README.md` | 컨텍스트 |
| WORKFLOW | `~/Desktop/crop app/WORKFLOW.md` | 빌드 방법 |
| 샘플 이미지 | `~/Desktop/crop app/ID_Photosample.jpg` | Demo Before 이미지 |
| ContentView | `apps/MonkosCrop/MonkosCrop/ContentView.swift` | 메인 UI |
| SpecData | `apps/MonkosCrop/MonkosCrop/SpecData.swift` | 데이터+i18n |

## 보고

완료 후 `✅❌💡⏳📁🔀` 형식으로 보고. 스크린샷은 `/tmp/`에 저장하여 첨부.
