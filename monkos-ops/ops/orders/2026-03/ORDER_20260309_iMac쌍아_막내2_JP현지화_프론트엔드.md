---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: 막내2
subject: JP 현지화 — HTML 페이지 6건 + JS 모듈
status: pending
---

# JP 현지화 — 프론트엔드 페이지

> **[2026-03-09 12:27 KST] iMac/쌍아 → 막내2**

## 배경

KR 코드가 `idphoto-jp/`에 복사 완료. HTML 페이지와 JS 모듈의 한국어 텍스트를 일본 시장에 맞게 **완전 현지화**한다. 기계적 번역이 아닌, 일본 UX 관습·마케팅 톤·문화적 기대에 맞는 재작성.

참조: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md`

## 현지화 원칙

1. **丁寧語(정중어)** 기본 — 「です・ます」체
2. **税込 표시** — 가격에 「(税込)」명시 (일본 소비세법)
3. **CTA 문구** — 일본식 표현 (「今すぐ撮影する」「無料で試す」등)
4. **카카오 → LINE** — SNS 채널 전면 교체
5. **원화 → 엔화** — ₩ → ¥, KRW → JPY
6. **일본 증명사진 용어** — 증명写真, パスポート写真, 履歴書写真, マイナンバーカード 등

## 작업 범위

### HTML 페이지 6건

| 파일 | 현지화 포인트 |
|------|-------------|
| `index.html` | 히어로 카피, 기능 소개, 가격(税込), CTA 버튼, 푸터(회사정보·법적링크), 카카오→LINE |
| `prep.html` | 포맷 선택 안내, 옵션 설명 텍스트 |
| `camera.html` | 촬영 안내, 가이드 텍스트, 버튼 라벨 |
| `result.html` | 결과 확인 안내, 다운로드 버튼, 편집 옵션 |
| `charge.html` | 결제 안내, 크레딧 패키지 설명, 가격(¥), 결제 버튼 |
| `thankyou.html` | 완료 안내, CS 채널(LINE), 공유 안내 |

### JS 파일 (HTML 내 인라인 텍스트 포함)

| 파일 | 현지화 포인트 |
|------|-------------|
| `prep.js` | LABELS 객체 40키 — 일본 증명사진 규격명·성별·연령·의상 용어 |
| `camera.js` | 촬영 가이드 메시지, 에러 안내 |
| `result.js` | 결과 화면 메시지, 다운로드 안내 |
| `thankyou.js` | 완료 메시지, 미션 안내 |

### JS 모듈 (텍스트만 현지화, 로직 무변경)

| 파일 | 현지화 포인트 |
|------|-------------|
| `modules/gate.js` | 로그인 모달 — 안내 텍스트, 버튼 라벨 |
| `modules/mission.js` | 미션 텍스트 |
| `modules/premium.js` | 프리미엄 안내 텍스트 |
| `modules/chatbot.js` | 구조 무변경, 표시 텍스트만 현지화 |

## 준수 조항

- **기능 코드 무변경**: HTML 구조, JS 로직, CSS 클래스명, Monk.js 바인딩 등 수정 금지
- **텍스트만 교체**: 한국어 → 일본어 (자연스러운 현지 표현)
- **헌법 4조**: 내부 기밀(에이전트 호칭 등) 외부 노출 금지
- **헌법 11조**: 미출시·미확정 기능 표현 금지. 되는 것만 안내

## 산출물

- `monkos_AI/idphoto-jp/public/` 내 HTML 6건 + JS 4건 + modules/ 4건
- 완료 보고서

## 참고 자료

- KR 원본: `monkos_AI/idphoto-kr/public/` (변경 전 비교용)
- JP v0.79 아카이브: `apps/idphoto-jp-v079/public/index.html` (기존 JP 톤 참조)
- 프레임워크: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md`
- UX 분기 보고서: `monkos-ops/ops/reports/2026-03/REPORT_20260308_막내2_KRJP_UX멘트_챗봇분기전략.md`
