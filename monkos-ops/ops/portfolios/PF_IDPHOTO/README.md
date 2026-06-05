---
type: portfolio
id: PF_IDPHOTO
name: "IDPHOTO"
subject: "MONKOS AI 증명사진 — 독립 iOS/Web 앱으로 AI 생성 증명사진 서비스"
created: 2026-01-11
owner: 작가님
leads: "쌍아(설계), 막내(실행)"
status: active
---

# PF_IDPHOTO — MONKOS AI 증명사진 서비스

> **PF_PHOTOPRO**(AI 증명사진 웹 서비스)를 승격. AI 기반 증명사진 생성 서비스의 정본 PF.
> Image Pro MVP(01/11) → idphoto-kr/jp(01/16) → 결제 퍼널 v5(03/05) → 운영+진단(04/11) → 결제 구조 개편+독립 iOS 앱(05/18~).
>
> ⚠️ **IDPASS(크롭앱)는 별도 PF** → [PF_CROP](../PF_CROP/README.md). 본 PF는 AI 증명사진 **생성** 서비스 전용.

---

## 앱 구조 (독립 앱 3개)

| 앱 | 성격 | PF |
|---|------|-----|
| **IDPASS** | 크롭 전용 무료앱 | **PF_CROP** (별도) |
| **AI 증명사진 앱** | AI 증명사진 생성 유료앱 | **PF_IDPHOTO** (본 PF) |
| **프로필 앱** | AI 프로필 사진 생성 | 추후 |

---

## 1. 비전

**"AI로 누구나 전문가 수준의 증명사진을 30초 안에 완성 — $1.99/컷"**

### 포지셔닝

| 구분 | 경쟁사 | MONKOS |
|------|--------|--------|
| AI 생성 | $2.33~$13.95/컷 | **$1.99/컷** (시장 중앙값 $2.33 이하) |
| 서버 의존 | 사진 업로드 필수 | 웹: Vertex AI / iOS: 온디바이스 Vision 활용 |
| 규격 커버 | 5~200국 | 26국+ 검증 완료 |

### 수익 구조

```
AI 증명사진 앱 (독립 iOS 앱)        웹 서비스 (idphoto-kr/jp)
 ├─ StoreKit 2 IAP $1.99/컷         ├─ 웹 크레딧 충전 (20% 보너스, 수수료 3~5%)
 ├─ 첫 체험 $1 단건 (계정 불필요)     ├─ 토스 결제
 └─ Sign in with Apple/Google       └─ LemonSqueezy (글로벌)
```

### 성공 지표

| 지표 | 시작점 | 목표 |
|------|--------|------|
| 결제 전환율 | 0% (5/18 현재) | 3%+ (12주) |
| 일일 AI 생성 수 | 0건 | 50건+ |
| 컷당 매출 | ₩0 | $1.99 (₩2,750) |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** PF_PHOTOPRO 히스토리를 계승.

### Phase 0 — Image Pro MVP (01/11~01/16)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 01/11 | 작가님+쌍아 | Image Pro MVP 착수 | `a08f5ff` | ✅ |
| 01/16 | 막내 | idphoto-kr 증명사진 MVP 완성 (7커밋) | `b2e7b26` | ✅ |

### Phase 1 — idphoto-kr/jp 웹 서비스 (01/16~02/14)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/01~14 | 막내 | idphoto-jp 일본 서비스 배포 + LINE LIFF 통합 | `637916f`, `b348194` | ✅ |
| 02/12~15 | 막내 | QC 강화 — 성별/연령 일치 검증 KR/JP | `0cd2268` | ✅ |

### Phase 2 — 이관 + 결제 퍼널 v5 (02/26~03/05)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/26~28 | 막내 | image.monkos.ai 이관 Phase 1~3 | `3f18774`~`9712bc5` | ✅ |
| 03/01~05 | 막내 | 결제 퍼널 v5 전환 (Wave 1~3) | `94b334b`~`385f556` | ✅ |
| 03/06~07 | 막내 | 촬영실 UI 리디자인 + 코칭 모드 | — | ✅ |

### Phase 3 — 운영 + 진단 (03~04)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/06~10 | 막내 | 일본 전면 현지화 (결제/법적/UX) | — | ⏳ |
| 04/11 | 쌍아+민아+막내 | **P0 전팀 진단 — "500 클릭 0 결제"** 3축 교차 (Firestore 전수+CDP 17장+경쟁사 18장) | 보고서 4건 | ✅ |
| 04/11 | 쌍아 | **결정적 발견**: 286 sitemap URL → Google 색인 1개 (0.35%). CSR + 표준 메타 부재 = SEO 사각지대 | REPORT | 🚨 |
| 04/11 | 작가님 | **광고는 오가닉 부스터** — 광고비가 오가닉 시그널로 축적되어야 의미 | — | ✅ |

### Phase 4 — 가격조사 + 전환 전략 수립 (05/18)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 05/18 | 막내1 | AI 증명사진 서비스 글로벌 전수조사 (47개 서비스, 컷당 단가) | [REPORT](../../sessions/2026-05/REPORT_20260518_막내1_AI증명사진_가격전수조사.md) | ✅ |
| 05/18 | 막내3 | 증명앱 iOS 전환 난이도 분석 | [REPORT](../../sessions/2026-05/REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md) | ✅ |
| 05/18 | 막내2 | Gemini 모델 마이그레이션 조사 + 2.0→2.5 실행 | REPORT×2 | ✅ |
| **05/18** | **쌍아** | **PF_PHOTOPRO → PF_IDPHOTO 승격** | 본 문서 | ✅ |
| 05/18 | 쌍아 | **idphoto-kr PRECHECK 2.0-flash 롤백** — 2.5-flash 엄격 이슈로 사전분석 모델을 2.0으로 환원 (`ce34b4ec`) | server.js | ⚠️ |
| 06/02 | 막내1 | **[검증] PF 현행성 검증** — Track A "✅ 완료" 표기가 KR 롤백 미반영 발견. 코드 실측: KR precheck=2.0(롤백), JP precheck=2.5(정상), KR/JP Live=2.0(미전환). Phase 현황·리스크 현행화 | 광역오더 #1 | ✅ |
| 06/02 | 막내1 | **Gemini 2.0→2.5 긴급 전환** — KR precheck `gemini-2.5-flash`(fallback `2.5-flash-lite`) + 프롬프트 완화(엄격 이슈 방지: 체크 4항목 축소, "AI 입력 원본" 문맥). KR/JP Live `gemini-2.5-flash`. KR prod 배포 rev 00190-8sk. 헬스체크 확인 | `8e5b890e`, deploy.sh prod | ✅ |
| 06/02 | 막내1 | **🔴 INCIDENT: idphoto-jp 오배포** — rev 00116에서 kr 코드가 jp로 서빙됨(deploy.sh가 CWD 미고정 + 잘못된 디렉토리에서 실행). 일본 손님에게 한국어+한국규격 제공. 13:19~13:54 약 35분 장애 | rev 00116-4jc | 🔴 |
| 06/02 | 막내1 | **INCIDENT 복구** — `cd idphoto-jp` 후 `./deploy.sh prod` 재실행. rev 00117-j7s, 100% 트래픽. `service: "monkos-idphoto-jp"` + 일본 규격(`証明写真`/`コーチング`) 확인. 원인: deploy.sh CWD 미고정 | deploy.sh prod | ✅ |
| 06/05 | 막내3 | **[INCIDENT] OAuth 게시 진단** — image_pro 정적앱은 OAuth 미사용(Gemini API키+CloudRun `image.monkos.ai`) 확정. 동의화면 "MONKOS IMAGE pro" 출처=AI Studio/PWA 빌드앱(proj monkos). 게시상태 gcloud 미노출→Console 확인 필요. 처방=Testing→Production 게시(승인 게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_OAuth게시.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] Gemini 라이브 장애 진단** — 근본원인=**AI Studio 선결제 크레딧 소진(429 RESOURCE_EXHAUSTED)**, 키 삭제 무관. GEMINI_API_KEY=살아있는 MONKOS NEW(fp 대조 일치), gemini-3·2.5 둘다 429. 복구=작가님 콘솔 빌링 충전(undelete/키교체/재배포 무의미). 4기능(KR/JP생성·image_pro·translate) 단일키 SPOF | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_GeminiKEY진단복구.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] AI Studio 결제 복구 — 지갑 경계 실측 확정** — ⭐Vertex AI(ADC)=200 정상 vs AI Studio(API키)=429. 두 지갑 분리: GCP크레딧(ANNUAL24%)은 Vertex로 살아있고 AI Studio prepay만 0. 429에 QuotaFailure 부재→rate cap 아님(spending limit 가설 소거). 생성코어 gemini-3-pro-image=Vertex 404→AI Studio 결제 불가피. Path B(번역·분석 Vertex 부분복구) 가능 | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_AIStudio결제복구.md) | ⏳ 결제대기 |
| 06/05 | 막내1 | **[SECURITY] monkosimagepro 유출키 공격 포렌식** — raw 실측(Monitoring request_count + DeleteKey audit). 유출키=5759b56b(6/2 13:19 삭제), 5/31~6/2 ListModels 프로빙(98/97/76·403·대만리전)→삭제후 UNKNOWN 400 지속(6/3~5 일94). **공격 전건 차단·도용성공 0·비용기여 0**. ⭐429장애=유출과 무관(6/5 정상키 MONKOS NEW 8건=크레딧소진, 막내2진단 일치). 방어=키노출점검+6/19 application restriction(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내1_유출공격분석.md) | ⏳ 승인대기 |
| 06/05 | 막내2 | **[INCIDENT P0] 코칭 Gemini Live 복구** — 원인=6/2 `8e5b890e`가 `ai.live.connect` 모델을 일반모델 gemini-2.5-flash로 오변경(Live 미작동). 실측(round-trip RESP_OK)으로 `gemini-2.0-flash-live-preview-04-09` 생존 확인→롤백(2.5 라이브 회피, precheck/generateContent 보존). 코칭=Vertex ADC(결제 무관). KR rev00191/JP rev00118 prod 배포, 배포 모델 RESP_OK 검증 | [REPORT](../../reports/2026-06/REPORT_20260605_막내2_코칭Live복구.md) | ✅ |
| 06/05 | 막내3 | **[INCIDENT P0] image_pro git 포렌식** — ⭐**코드변경 무관** 확정: 백엔드 `apps/monk_imagen4/backend/server.js` 마지막 수정 3/01·운영 리비전 00022 **3/30 배포**, 6/2 EOL마이그(8e5b890e)·키삭제 미접촉. 실제 장애=`/generate`의 **Vertex `imagen-4.0-ultra`만 RESOURCE_EXHAUSTED "out of capacity"**(6/05오전 onset, HTTP500). `fast`·`/refine`·`/health` 정상. 막내2 AI Studio크레딧건과 경로 분리. 권고=ultra→fast폴백+backoff+Vertex쿼터(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_imagePro_변경추적.md) | ⏳ 승인대기 |
| 06/05 | 막내3 | **[INCIDENT P0] image_pro 일러스트 편향 3대가설 검증** — ⭐원인=**enhancePrompt:false 미적용**. 3/31 P0권고가 `git -S` 상 server.js 역사상 0건(미반영, "리그레션" 아닌 처음부터 미적용)→Vertex 기본값(Google인정 리그레션) 작동. 가설B(Google저하)=미확인(deprecation 6/24 미래), 가설C(키삭제/세이프티)=반박(세이프티는 완전거부·/generate는 Vertex ADC). 라이브 A/B는 코드 enhancePrompt 미수신이라 불가. 권고=enhancePrompt:false 머지+photoreal프리픽스(승인게이트) | [REPORT](../../reports/2026-06/REPORT_20260605_막내3_imagePro_일러스트편향.md) | ⏳ 승인대기 |

### Phase 5 — 독립 iOS 네이티브 증명사진 앱 + 결제 개편 (05/18~) **← 현재**

> 신규 시작점. IDPASS와 별도의 독립 앱으로 AI 증명사진 생성 서비스 출시.
> IDPASS 코드 자산(Vision, 규격 데이터 등)은 참조/공유 가능하나, IDPASS 앱 자체를 확장하는 것이 아님.

---

## 3. Phase 현황

> Phase별 상태. 에이전트 투입 시 이 섹션이 "지금 뭘 해야 하는지"의 정본.

### Phase 0~2 — MVP → KR/JP → 이관 → 퍼널 v5 ✅ 완료

Image Pro MVP(01/11) → idphoto-kr(01/16) → idphoto-jp(02/01) → image.monkos.ai 이관(02/28) → 결제 퍼널 v5(03/05).

### Phase 3 — 운영 + 진단 ✅ 완료 (04/11)

P0 전팀 진단(500 클릭 0 결제), SEO 사각지대 발견, 광고=오가닉 부스터 전략 확립.

### Phase 4 — 가격조사 + 전환 전략 수립 ✅ 완료 (05/18)

47개 서비스 전수조사 (컷당 중앙값 $2.33), iOS 전환 난이도 분석, Gemini 마이그레이션 완료.

| 05/22 | 쌍아 | **og:image 수정 지시서 발행** — idphoto-kr/jp 빈 파일(size 0)+상대경로 → 절대URL+실제 이미지로 교체. SERP 썸네일 노출 대응 | ORDER 발행, 막내 대기 | ⏳ |

### Phase 5 — 독립 iOS 앱 + 결제 개편 ⏳ 진행 중 (05/18~) **← 현재**

#### 5-A. 독립 iOS 네이티브 증명사진 앱 (신규 개발)

> IDPASS(PF_CROP)와 **별도 독립 앱**. IDPASS 코드 자산(Vision, 규격 데이터) 참조 가능.

| 항목 | 상태 | 비고 |
|------|------|------|
| SwiftUI 기반 독립 앱 | ❌ | 신규 프로젝트 |
| AI 증명사진 생성 기능 | ❌ | Vertex AI / 온디바이스 모델 |
| StoreKit 2 IAP $1.99/컷 | ❌ | 신규 |
| 인증: Sign in with Apple + Google | ❌ | 신규 |

#### 5-B. 결제 구조 개편

| 항목 | 상태 | 비고 |
|------|------|------|
| 크레딧 폐지 → 직접결제 전환 | ❌ | 신규 설계 |
| 첫 체험 $1 단건 (계정 불필요) | ❌ | 신규 |
| 재구매 시 크레딧 전환 유도 (이 시점에 OAuth) | ❌ | 신규 |
| 이중 과금: 앱 IAP($1.99) + 웹 크레딧(보너스) | ❌ | Apple 30% vs 웹 3~5% |
| 웹 크레딧 충전 시 20% 보너스 → 웹 전환 유인 | ❌ | 신규 |

#### 5-C. Gemini 마이그레이션

| 항목 | 상태 | 비고 |
|------|------|------|
| Track A: KR precheck 2.5 전환 | ✅ | `8e5b890e`(6/2) 2.5-flash 전환 + 프롬프트 완화. fallback: 2.5-flash-lite |
| Track A: JP precheck 2.5 | ✅ | `79be913a` 이후 유지 |
| Track B: KR/JP Live 2.5 전환 | ✅ | `8e5b890e`(6/2) gemini-2.5-flash 전환 완료 |

#### 5-D. 환불정책

- 현 단계: 유입 우선, "100% 만족 보장" 마케팅 활용 검토
- 추후: 볼륨 증가 시 환불 방어 설계

---

## 4. 성과

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| KR 서비스 배포 | 운영 중 | 01-16~ | idphoto-kr |
| JP 서비스 배포 | 운영 중 | 02-08~ | idphoto-jp |
| 퍼널 버전 | v5 | 03-05 | v4→v5 전환 완료 |
| **결제** | **외부 결제 0건** | 05-18 | 🚨 Phase 5 존재 이유 |

---

## 5. 복기

### 교훈 1: 제1원칙 — 동일인 유지
AI 생성 이미지에서 원본과 다른 인물이 나올 수 있음. 제1원칙(정체성 보존) 최우선. photo.js 패턴 준수.

### 교훈 2: SEO 사각지대 (04/11 진단)
286 sitemap URL → Google 색인 1개. CSR + 메타 부재 = 광고비 증발. 자산 완성과 노출 동선은 같은 사이클에 묶어야.

### 교훈 3: 시장 가격 구조 (05/18 전수조사)
47개 서비스 컷당 중앙값 $1.66. 카테고리 B(배경제거+크롭) 중앙값 $2.33. B와 C(AI 생성)의 중앙값 거의 동일 — AI 기능이 가격 프리미엄을 만들지 못함. 차별화는 **신뢰(환불보증)** 와 **편의(시트 장수, 인쇄 연동)**.

### 교훈 4: 크레딧 시스템은 시장 비주류 (05/18 전수조사)
시장 47개 서비스 중 크레딧 모델은 6%(3개)에 불과. 건별 결제(47%)가 주류. 크레딧 복잡성이 전환 장벽으로 작용.

---

## 6. 관련 문서 인덱스

### Phase 5 기반

| 문서 | 내용 |
|------|------|
| `AGENDA_20260518_결제전환_크레딧폐지_직접결제.md` | 결제 구조 전환 어젠다 |
| `REPORT_20260518_막내1_AI증명사진_가격전수조사.md` | 47개 서비스 가격·과금·컷당단가 |
| `REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md` | iOS 네이티브 전환 난이도 |
| `REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md` | Gemini D-14 대응 조사 |
| `REPORT_20260518_막내2_Gemini2.0_마이그레이션_실행.md` | 2.0→2.5 마이그레이션 실행 |

### PF_PHOTOPRO 계승

| 문서 | 내용 |
|------|------|
| `REPORT_20260411_iMac쌍아_PHOTOPRO_통합진단.md` | 500 클릭 0 결제 진단 |
| 막내1~3 분기분석 보고서 | AI 사진 서비스 1~3월 분석 |

### 핵심 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| `a08f5ff` | 01-11 | Image Pro 정식 배포 |
| `b2e7b26` | 01-16 | 증명사진 MVP 완성 |
| `637916f` | 02-14 | KR/JP REST v2.0.0 |
| `385f556` | 03-05 | 결제 퍼널 v5 |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| **결제 전환 0건 지속** | 고 | Phase 5-B 결제 구조 개편. $1 첫 체험 + IAP 직결 |
| Vertex AI 비용 급증 | 중 | 모니터링 + 자체 모델 백업 |
| Apple IAP 30% 수수료 | 확정 | 웹 크레딧 20% 보너스로 웹 전환 유인 |
| iOS 앱스토어 심사 리젝 | 중 | 기능 완성 후 즉시 제출. 리젝 사유별 대응 준비 |
| ~~Gemini 2.0 서비스 종료~~ | ~~고~~ | ✅ 해소 (6/2) — KR/JP precheck + Live 모두 2.5-flash 전환 완료 (`8e5b890e`) |
| 정체성 보존 실패 | 저 | 제1원칙 세이프가드 + QC 이중 검증 |

---

## 8. 원본 PF 참조

> 본 PF는 PF_PHOTOPRO를 승격한 것. PF_CROP은 별도 독립 PF로 유지.

| PF | 경로 | 상태 |
|----|------|------|
| PF_PHOTOPRO | `portfolios/PF_PHOTOPRO/README.md` | completed (merged → PF_IDPHOTO) |
| **PF_CROP** | `portfolios/PF_CROP/README.md` | **active (독립 유지)** |
