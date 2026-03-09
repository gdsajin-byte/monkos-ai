---
type: DESIGN
date: 2026-03-09
author: iMac/쌍아
status: approved
subject: JP 클론 사전 프레임워크
---

# JP 클론 사전 프레임워크 — 불필요한 리팩토링 방지 설계서

> **[2026-03-09 11:53 KST] iMac/쌍아 → 작가님**

## Context

**목표**: KR 코드를 JP에 클론하여 안정적으로 돌아가게 하는 것이 1차 목표.
**배경**: 현행 JP v0.79는 모놀리식 SPA + Raw Node.js로, KR의 Express 모듈형 아키텍처와 구조가 다르다. v0.79는 `apps/`에 아카이브하고 KR 코드 기반으로 JP를 새로 구축한다.
**순서**: KR E2E 완성 → JP 클론(현지화+Lemon Squeezy) → JP 테스트 → KR 백업 → KR 리팩토링(직접결제 전환)

### 근거 보고서 (8건 + M1 시장 리서치)

| 보고서 | 위치 |
|--------|------|
| KR/JP 법적·정책 분기 (27항목) | `ops/reports/2026-03/REPORT_20260308_막내1_KRJP법적정책분기.md` |
| KR/JP UX·챗봇 분기 (296건) | `ops/reports/2026-03/REPORT_20260308_막내2_KRJP_UX멘트_챗봇분기전략.md` |
| 크레딧 정책 법규 리서치 | `docs/infrastructure/reports/REPORT_20260308_CREDIT_POLICY_LEGAL.md` |
| 데이터 보관 법규 + 약관 개정 | `docs/infrastructure/reports/REPORT_20260308_DATA_RETENTION_LEGAL_TERMS.md` |
| 데이터 보관 기술 설계 | `docs/infrastructure/reports/REPORT_20260308_DATA_RETENTION_TECHNICAL_DESIGN.md` |
| 일본 증명사진 기계 시장 | `ops/reports/2026-03/REPORT_20260309_막내1_일본증명사진기계시장분석.md` |
| 일본 편의점 증명사진 시장 | `ops/reports/2026-03/REPORT_20260309_막내2_일본편의점증명사진_시장분석.md` |
| 편의점 프린터 스펙 정밀 분석 | `ops/reports/2026-03/REPORT_20260309_막내2_편의점프린터스펙_정밀분석.md` |

---

## 핵심 원칙: 리팩토링 방지 가이드

> **"지금 KR에서 건드리지 말아야 할 것"을 명확히 하는 것이 이 문서의 핵심**

### KR에서 건드리면 안 되는 것 (JP 클론 전까지)
1. **크레딧 시스템 로직** — JP가 그대로 쓸 것. KR 직접결제 전환은 JP 클론 완료 후
2. **shared.js buyCreditsKR()** — JP에서 buyCreditsJP()로 복사할 원본
3. **config.js CHARGE_OPTIONS** — JP 가격 체계의 참조 원본
4. **modules/charge.js** — Toss 결제 UI가 JP Lemon Squeezy 참조 원본
5. **server.js 크레딧 API** (`/api/credit/*`) — 양쪽 공용

### JP 클론 시 KR과 달라지는 것 (변경 지점 전수)
| 영역 | KR | JP | 변경 유형 |
|------|----|----|----------|
| 결제 | TossPayments | Lemon Squeezy | SDK 교체 |
| SNS 로그인 | Kakao + Google | LINE + Google | SDK 교체 |
| 통화 | ₩ KRW | ¥ JPY | Config |
| 크레딧 단가 | 생성10c/다운70c | 생성1c/다운10c | Config |
| 법적 근거법 | PIPA, 전자상거래법 | APPI, 特定商取引法 | 전면 재작성 |
| 법적 페이지 | terms/privacy/refund/credits-policy | + **tokusho.html** (신규 필수) | 5개 |
| UI 텍스트 | 한국어 | 일본어 | 번역 (296건) |
| 챗봇 채널 | idphoto-kr | idphoto-jp 추가 | Config 5줄 |
| 코칭 프롬프트 | 한국어 strict | 일본어 positive | 톤 변경 |

> **L판 레이아웃/크롭 기능은 별도 컴포넌트 앱으로 진행 — 본 프레임워크 범위 밖**

---

## 공유 vs 분기 정리표

> 기능적 코드 변경 = 없음. 변경은 전부 **번역 + 설정값 + 법적 페이지**

### 공유 (KR에서 그대로 복사, 수정 없음)
| 파일 | 이유 |
|------|------|
| `server.js` — I2I 파이프라인 | buildPromptV5(), /api/idgen, /api/qc, /api/credit/* 로직 동일 |
| `server.js` — WebSocket 코칭 구조 | 구조 동일 (프롬프트 텍스트만 교체) |
| `monk.js` | 리액티브 프레임워크 — 언어 무관 |
| `app.css`, `cr-coin.css` | 스타일시트 — 텍스트 없음 |
| `monkos-icon.svg`, `og-image.png`, `favicon` | 브랜딩 에셋 |
| `package.json`, `Dockerfile`, `deploy.sh` | 인프라 — 환경변수만 배포 시 교체 |
| `obfuscate.mjs` | 빌드 도구 |
| `modules/chatbot.js` | Portal API 연동 — 언어 무관 |
| `modules/gate.js` | 로그인 모달 구조 — 텍스트만 교체 |
| `modules/mission.js` | 미션 구조 — 텍스트만 교체 |
| `modules/premium.js` | 프리미엄 구조 — 텍스트만 교체 |

### 분기 A: 설정값 교체 (복사 후 값만 변경)
| 파일 | 교체 항목 |
|------|----------|
| `config.js` | TX 객체 25키 번역, CHARGE_OPTIONS JPY, CREDIT_COST 단가, Kakao 키 제거 |
| `shared.js` | buyCreditsKR()→buyCreditsJP(), alert/log 메시지 번역 |
| `modules/charge.js` | Toss SDK→Lemon Squeezy SDK, JPY 가격 |
| `server.js` 코칭 프롬프트 | COACHING_INSTRUCTIONS 한→일 번역, 톤 변경 |

### 분기 B: 번역 (복사 후 텍스트만 일본어로)
| 파일 | 번역 대상 |
|------|----------|
| `index.html` | 마케팅 카피, 가격 표시, 푸터 링크 |
| `prep.html` + `prep.js` | LABELS 40키, 폼 텍스트 |
| `camera.html` + `camera.js` | 촬영 안내 UI |
| `result.html` + `result.js` | 결과 화면 UI |
| `charge.html` | 결제 UI 텍스트 + JPY 표시 |
| `thankyou.html` + `thankyou.js` | CS 채널 (카카오→LINE), 완료 메시지 |

### 분기 C: 법적 페이지 (각국 독립, 공유 불가)
| 파일 | KR 근거법 | JP 근거법 | 비고 |
|------|----------|----------|------|
| `terms.html` | 전자상거래법, 정보통신망법 | 特定商取引法, 消費者契約法 | 전면 재작성 |
| `privacy.html` | PIPA (개인정보보호법) | APPI (個人情報保護法) | 전면 재작성 |
| `credits-policy.html` | KR 크레딧 정책 | JP 크레딧 정책 (단가 다름) | 구조 공유, 값 분기 |
| `refund.html` | 전자상거래법 17조 | 特定商取引法 返品特約 | 전면 재작성 |
| **`tokusho.html`** | — (KR 해당 없음) | 特定商取引法に基づく表記 | **JP 전용 신규** |

### 포탈 연동 (1파일 수정)
| 파일 | 변경 |
|------|------|
| `portal/lib/chat-engine.js` | CHANNEL_CONFIG에 `'idphoto-jp'` 5줄 추가 |

---

## Phase 0: KR E2E 완성 (JP 클론 전 선행)

> 현재 KR에서 미완성인 항목을 먼저 마무리. 이것이 JP 클론의 원본이 된다.

| 항목 | 상태 | 비고 |
|------|------|------|
| Firestore TTL 90일 활성화 | ⏳ CLI 실행 대기 | `scripts/firestore_ttl_activate.sh` |
| 약관·개인정보처리방침 개정 | ⏳ privacy.html "즉시 삭제"→90일 | L1/L2 반영 |
| KR 직접결제 설계 | **보류** | JP 클론 후 착수 |
| sitemap.xml 커밋 | ⏳ 수정 완료, 커밋 대기 | 서브도메인 URL 보정 |

---

## Phase 1: JP 클론 — 파일 구조 (32파일)

### 1-A. 직접 복사 (변경 없음, 9파일)
```
package.json, deploy.sh, Dockerfile, obfuscate.mjs
public/monk.js, app.css, cr-coin.css
public/monkos-icon.svg, og-image.png
```

### 1-B. 번역 + 현지화 (텍스트만 변경, 14파일)
| 파일 | 변경 내용 |
|------|----------|
| `server.js` | COACHING_INSTRUCTIONS 일본어 전환, buildPromptV5() 유지 |
| `public/config.js` | TX 객체 25키 번역, V5_OPTIONS 라벨 번역, Kakao 제거 |
| `public/shared.js` | alert/log 메시지 번역, buyCreditsKR→buyCreditsJP 교체 |
| `public/index.html` | 마케팅 텍스트 + 가격 표시 번역 |
| `public/prep.html` + `prep.js` | LABELS 40키 번역, 포맷 옵션 유지 |
| `public/camera.html` + `camera.js` | UI 텍스트 번역 |
| `public/result.html` + `result.js` | UI 텍스트 번역 |
| `public/thankyou.html` + `thankyou.js` | CS 채널 변경 (카카오→LINE), 텍스트 번역 |
| `public/modules/gate.js` | 로그인 모달 텍스트 번역 |
| `public/modules/chatbot.js` | Portal API 연동 (언어 무관, 텍스트만) |
| `public/modules/mission.js` | 미션 텍스트 번역 |
| `public/modules/premium.js` | 프리미엄 텍스트 번역 |

### 1-C. 기능 변경 (결제·인증 분기, 2파일)
| 파일 | 변경 내용 |
|------|----------|
| `public/modules/charge.js` | Toss UI → Lemon Squeezy checkout 교체, JPY 가격 |
| `public/shared.js` (중복) | `buyCreditsJP()` 신규 구현 (Lemon Squeezy SDK) |

### 1-D. 법적 페이지 전면 재작성 (5파일)
| 파일 | 근거법 | 비고 |
|------|--------|------|
| `terms.html` | 消費者契約法, 特定商取引法 | 카카오→LINE, 관할→東京地方裁判所 |
| `privacy.html` | APPI (個人情報保護法) | PIPA 전면 교체 |
| `credits-policy.html` | JP 크레딧 정책 유지 | 단가 1c/10c 반영 |
| `refund.html` | 特定商取引法 返品特約 | tokusho 통합 검토 |
| **`tokusho.html`** | 特定商取引法に基づく表記 | **KR에 없는 신규 필수 페이지** |

### 1-E. 포탈 연동 (1파일 수정)
| 파일 | 변경 |
|------|------|
| `portal/lib/chat-engine.js` | CHANNEL_CONFIG에 `'idphoto-jp'` 추가 (5줄) |

---

## Phase 2: RAG + 챗봇 분기

| 작업 | 파일 | 내용 |
|------|------|------|
| CHANNEL_CONFIG 추가 | `chat-engine.js` | `'idphoto-jp': { systemPrompt, logCollection }` |
| SYSTEM_PROMPT_JP 작성 | `prompts.js` | JP 전용 앱 프롬프트 |
| cs_knowledge language 필드 | `rag.js` | `language: 'ko'/'ja'/null` 필터 3줄 추가 |
| JP 지식 문서 4건 | Firestore seed | credit_purchase_jp, login_issue_jp, service_urls_jp, law_refund_jp |

---

## Phase 3: 배포 + 테스트

| 항목 | 내용 |
|------|------|
| Cloud Run 서비스 | `idphoto-jp` 서비스 생성 (기존 환경변수 참조) |
| 서브도메인 | `idphoto-jp.monkos.ai` (이미 DNS 설정 완료) |
| E2E 테스트 | 촬영→생성→QC→크레딧→다운로드 |
| Lemon Squeezy 테스트 | 테스트 모드 결제 → 크레딧 충전 확인 |
| WebSocket 코칭 | 일본어 코칭 동작 확인 |

---

## Phase 4: KR 리팩토링 (JP 클론 완료 후)

> JP에 크레딧 시스템이 안전하게 이식된 후에만 KR 변경 착수

| 항목 | 내용 |
|------|------|
| KR 전체 백업 | apps/idphoto-kr-backup/ 아카이브 |
| 직접결제 전환 | 크레딧 중간 로직 제거, 9,900원 단일 상품 |
| **토스 위젯 정식 전환** | 테스트키(test_ck_) → 프로덕션 위젯(MID: monkoss7od) |
| charge.html → pricing.html | Toss 직접 결제 위젯 UI |
| credits-policy.html 제거 | pricing.html로 대체 |

### 토스페이먼츠 인프라 정보
- **MID**: `monkoss7od`
- **계약 상태**: 전자결제 계약 완료 (2026-03-09)
- **현행**: 테스트키(`test_ck_...`) — config.js에 하드코딩
- **전환 시**: Client Key + Secret Key → Cloud Run 환경변수로 이관 (코드에 절대 기록 금지)

---

## 막내 배분 계획 (지시서 발행 기준)

### Round 1: 기반 구축 (병렬 3명)
| 막내 | 담당 | 산출물 |
|------|------|--------|
| 막내1 | server.js + config.js + shared.js 클론 | 백엔드 + 설정 파일 3건 |
| 막내2 | HTML 페이지 6건 번역 (index, prep, camera, result, charge, thankyou) | 프론트엔드 페이지 |
| 막내3 | 법적 페이지 5건 (terms, privacy, refund, credits-policy, tokusho) | 법적 준수 |

### Round 2: 결제 + 연동 (병렬 2명)
| 막내 | 담당 | 산출물 |
|------|------|--------|
| 막내1 | Lemon Squeezy 결제 통합 (charge.js + shared.js) | 결제 파이프라인 |
| 막내2 | 포탈 챗봇 연동 (CHANNEL_CONFIG + RAG + JP 지식문서) | 챗봇 분기 |

### Round 3: 테스트 + 배포
| 막내 | 담당 | 산출물 |
|------|------|--------|
| 막내1 | E2E 테스트 + 배포 | 프로덕션 검증 |

---

## 검증 방법

1. **로컬 테스트**: `node server.js` → localhost에서 전체 플로우 확인
2. **결제 테스트**: Lemon Squeezy 테스트 모드로 크레딧 충전 → 사용 → 환불
3. **챗봇 테스트**: `idphoto-jp.monkos.ai` 접속 → 챗봇 일본어 응답 확인
4. **법적 페이지**: 모든 링크 동작 + tokusho.html 표기 항목 완전성 확인

---

## 리스크 & 블로커

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Lemon Squeezy JPY 결제 미지원 | 결제 불가 | Stripe 대안 (2.7% 수수료) |
| 法的ページ 전문가 검토 지연 | 런칭 지연 | 1차 자체 작성 → 후속 검토 |
| LINE Login SDK 통합 복잡도 | 인증 불가 | Google 단독으로 1차 런칭 |

---

## KR/JP 코드베이스 구조 비교 (참고)

### KR (idphoto-kr/) — 38파일, Express 모듈형
```
server.js (867L) ........... Express + Vertex AI + WebSocket
public/
  config.js (142L) ......... Google OAuth, API, Credits, TX
  shared.js (512L) ......... Store, Pipes, Auth, Toss Payment
  monk.js .................. Reactive Framework
  index.html (1031L) ....... Landing SPA
  prep.html/js ............. Format/Gender/Age Selection
  camera.html/js ........... WebSocket Coaching
  result.html/js ........... QC + Editing
  charge.html .............. Toss Payment UI
  thankyou.html/js ......... Post-Download
  modules/
    charge.js .............. Toss Payment + Stepper
    gate.js ................ Login Modal
    chatbot.js ............. Portal Chatbot
    mission.js ............. Download Missions
    premium.js ............. Premium Features
  terms, privacy, refund, credits-policy (법적 4건)
```

### JP v0.79 (idphoto-jp/) — 16파일, Raw Node.js 모놀리식
```
server.js (766L) ........... Raw Node.js HTTP (Express 없음)
public/
  index.html (2375L) ....... 모놀리식 SPA (올인원)
  tokusho.html ............. 特商法 (KR에 없는 페이지)
  terms, privacy, credits-policy (법적 3건)
  [config.js 없음, shared.js 없음, 모듈 시스템 없음]
```

**결론**: KR을 원본으로 클론. v0.79는 tokusho.html 참조용으로만 활용.
