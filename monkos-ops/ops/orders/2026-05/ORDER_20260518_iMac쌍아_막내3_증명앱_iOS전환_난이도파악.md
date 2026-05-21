---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내3
status: 발행
portfolio: PF_CROP, PF_PORTAL
---

# 지시서: MONKOS 증명사진 웹앱 → Apple 앱 전환 난이도 파악

## 배경

현재 증명사진 서비스(idphoto-kr/jp)는 Cloud Run 위 웹앱(Express + SPA)으로 운영 중.
별도로 IDPASS(SwiftUI 네이티브 크롭앱)가 개발 중(apps/MonkosCrop/).

향후 과금 구조:
- **IDPASS (크롭)** → 무료 배포 (App Store)
- **AI 증명사진 생성** → $1.99/컷 (Apple IAP) 또는 크레딧 (웹)

이 구조를 실현하려면 현재 웹앱의 AI 생성 기능을 iOS 앱으로 전환하거나 연동해야 함.
전환 프레임워크 후보별 난이도를 파악하라.

## 임무

### 1. 현재 아키텍처 분석

아래 코드를 전수 분석하여 현재 웹앱 구조를 정리:

```
monkos_AI/idphoto-kr/     — 증명사진 KR 웹앱
monkos_AI/idphoto-jp/     — 증명사진 JP 웹앱
apps/MonkosCrop/          — IDPASS SwiftUI 네이티브 앱 (기존)
```

분석 항목:
- 프론트엔드: SPA 구조, JS 모듈, UI 컴포넌트
- 백엔드: Express 엔드포인트, AI API 호출, 인증, 결제
- 실시간: WebSocket (Gemini Live 코칭)
- 카메라: 웹 카메라 접근 방식
- 저장: GCS 업로드/다운로드 플로우
- 인증: 카카오/LINE/Google OAuth 플로우

### 2. 전환 프레임워크 후보별 난이도 비교

| 후보 | 설명 |
|------|------|
| **A. SwiftUI 네이티브 (IDPASS 확장)** | 기존 MonkosCrop에 AI 생성 기능 추가. 백엔드 API 호출 |
| **B. WKWebView 하이브리드** | 웹앱을 WebView로 감싸고 IAP 브릿지만 네이티브 |
| **C. React Native** | 웹앱 JS 자산 재활용, 네이티브 모듈 브릿지 |
| **D. PWA + Safari** | 웹앱 그대로 PWA화, App Store 배포는 별도 |
| **E. Capacitor/Ionic** | 웹앱 래핑 + 네이티브 플러그인 (카메라, IAP) |

후보별 분석 항목:

| 항목 | 설명 |
|------|------|
| **개발 난이도** | 상/중/하 + 근거 |
| **예상 공수** | 주 단위 |
| **코드 재사용률** | 기존 웹/SwiftUI 자산 활용도 (%) |
| **Apple IAP 구현** | 난이도 + StoreKit 2 사용 가능 여부 |
| **카메라 접근** | 네이티브 vs WebRTC 차이 |
| **Gemini Live 연동** | WebSocket 실시간 통신 가능 여부 |
| **OAuth 인증** | 카카오/LINE/Google 로그인 구현 방식 |
| **App Store 심사** | 리젝 리스크 (WebView 정책, IAP 필수 규정 등) |
| **UX 품질** | 네이티브 체감 vs 웹뷰 체감 |
| **유지보수** | 웹/앱 코드 이중 관리 부담 |

### 3. IDPASS + AI 생성 통합 아키텍처 제안

현재 IDPASS(크롭)와 AI 생성(웹앱)이 별도인데, 이를 **하나의 앱**으로 통합하는 방안도 검토:
- IDPASS에서 크롭 완료 → "AI 보정" 버튼 → API 호출 → $1.99 IAP
- vs 별도 앱 2개 유지 (IDPASS 무료 + AI Photo 유료)

각 방안의 장단점 비교.

### 4. 최종 추천

- **추천 프레임워크 + 근거**
- **추천 앱 구조** (통합 vs 분리)
- **리스크 + 대응방안**
- **로드맵 개략** (주 단위)

## 산출물

- `REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md`
- 배치: `monkos-ops/ops/sessions/2026-05/`

## ⚠️ 준수 조항

- Apple 정책(App Store Review Guidelines 2026) 기준 확인. 특히:
  - IAP 필수 규정 (3.1.1)
  - WebView 앱 리젝 기준 (4.2)
  - 로그인 관련 (4.8 Sign in with Apple 요건)
- 기존 코드 구조 실측 기반 (grep/read). 추측 금지
- 완료 후 세션 로그 어펜드 + 커밋
