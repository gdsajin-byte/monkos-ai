---
type: order
date: 2026-07-16
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: SPECS — credits.html 글로벌 대응 (en 모드 + 레몬 충전 동선)
status: 대체됨 — ORDER_20260716_iMac민아_막내2_SPECS_크레딧동선완결_글로벌.md로 흡수 (2026-07-16 15:09, 작가님 동선 확장 지시)
portfolio: PF_SPECS
---

# 지시서: credits.html 글로벌 대응 — en 모드 + 레몬 충전 동선

**[2026-07-16 11:47 KST]** iMac/민아 → 막내(번호 작가님 지정)

## 1. 배경/목적

7/15 글로벌 크레딧 결제 개방으로 ja/en/es 퍼널에 크레딧 카드가 라이브됐다. 그러나 **비로그인·잔액부족 유저는 전 언어 공통으로 `/credits.html`로 이동**하는데(`public/js/specs-funnel.js:994`), 이 페이지는:

- `<html lang="ko">` 고정 — 전 UI·문구 한국어 전용
- **결제 수단이 Toss 위젯 전용** — 글로벌 유저는 충전 자체가 불가능

즉 글로벌 유저의 **크레딧 로그인·충전 관문이 막혀 있다** (P1). 퍼널 꼬리 EVENT 슬롯(`lib/cms/components/spec-funnel-markup.js`의 `id="ip-slot-credit"`, `href="/credits.html"`)도 같은 페이지로 유도한다.

백엔드는 준비 완료 상태다 (7/15 민아 실측):
- 레몬 글로벌 USD 5종 variant 매핑 라이브 — `lib/shared/config.js` `VARIANT_CREDITS` (store#415328: topup_40 $3.90 ~ package_750 $39.90)
- 레몬 웹훅 크레딧 적립 (`/api/webhooks/lemonsqueezy` + 별칭 `/api/webhooks`)
- 크레딧 차감 API 언어 무관

## 2. 산출물

| 파일 | 작업 |
|------|------|
| `monkos_AI/portal/public/credits.html` | lang 판별 + en 사전 + 글로벌 모드(레몬 충전 카드) |
| `monkos_AI/portal/lib/cms/components/spec-funnel-markup.js` | EVENT 슬롯 href에 lang 전달 (1줄) |
| `monkos_AI/portal/server.js` | (기존 체크아웃 재사용 불가 시에만) 레몬 topup 체크아웃 생성 지원 |

## 3. 상세 설계

### A. lang 판별 (credits.html)
1. `?lang=` 쿼리 우선 → 2. `?from=` 경로의 `/{lang}/` 프리픽스 (specs URL은 경로 기반: `/ja/specs/...`) → 3. 기본 `ko`.
- 1차 범위: **non-ko 전부 en 표시** (ja/es 개별 사전은 후속 — 스코프 밖).

### B. en 최소 사전
`<title>`/description, 로그인 카드(간편로그인 안내 + 신규 10c 이벤트 문구), 잔액 라벨, 패키지 섹션 제목, 충전 버튼, 주요 토스트/에러 메시지. `document.documentElement.lang` 동기화.

### C. 글로벌 결제 수단 분기
- non-ko: Toss 패키지 그리드·위젯 **숨김**, 레몬 글로벌 5종 충전 카드 렌더.
- 클릭 → 레몬 체크아웃 진입. **체크아웃에 userId custom 필드 전달 필수** (웹훅 적립 매칭용). 기존 direct 결제의 체크아웃 생성 방식(`/api/checkout` → `handleCheckout`)에서 custom 전달 패턴을 확인하고 준용할 것.
- **variant ID·가격은 클라이언트 하드코딩 금지** — 서버가 config 정본(`VARIANT_CREDITS`)에서 내려주는 구조로.
- Toss SDK `<script>`는 non-ko에서 로드 생략 가능하면 생략 (성능 — 단, 분기 복잡도가 크면 유지 허용).

### D. 퍼널 연결
- `spec-funnel-markup.js` EVENT 슬롯: `href="/credits.html"` → `href="/credits.html${lang !== 'ko' ? `?lang=${lang}` : ''}"` 형태.
- `specs-funnel.js:994`의 `from=` 리다이렉트는 경로에 lang이 포함되므로 그대로 두되, credits.html이 from 경로에서 lang을 판별(A-2)하는 것으로 커버.
- 충전/로그인 후 `from` 복귀(returnUrl) 동작은 기존 그대로 유지 — 회귀 금지.

### E. ko 회귀 0
기존 ko 화면·Toss 흐름·문구 변경 금지. ko에서 diff가 시각적으로 0이어야 한다.

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키·시크릿 절대 생성/추측 금지. 레몬 키는 기존 서버 코드 경유만.
- **헌법 3조 1항**: 타임스탬프는 `date` 명령 취득.
- **헌법 3조 2항**: 완료 보고 필수 (COMPLETION 파일 + 세션로그 + PF_SPECS 히스토리 1행).
- **ch5**: 배포는 `./deploy.sh` 경유만. **dev까지만** — prod 승격은 민아 검증 후 별도.
- **ch4 10조**: 크레딧 수동 조회/변경은 `scripts/credits.sh` 경유 (서비스 코드 내 Firestore 접근은 예외 대상).
- **가격 SSOT**: 금액·variant 하드코딩 금지, config 정본 참조.
- **실결제 금지**: 검증은 체크아웃 진입까지. 카드 입력·결제 완료 절대 금지.

## 5. 완료 기준

- [ ] en 시나리오: `/en/specs/kr-passport` → 크레딧 카드 클릭(비로그인) → credits.html 영문 UI 도착 → 구글 로그인 → 잔액 표시 → 레몬 충전 카드 5종 노출 → 체크아웃 진입 확인(실결제 금지) → from 복귀 정상
- [ ] EVENT 슬롯(무료 생성 후 화면)에서 non-ko 진입 시 영문 UI
- [ ] ko 회귀: Toss 흐름·화면 diff 0
- [ ] dev 배포 + 위 시나리오 dev 실측 캡처/로그
- [ ] COMPLETION 보고서 + PF_SPECS 히스토리 어펜드

## 6. 커밋 메시지

```
[feat] credits.html 글로벌 대응 — en 모드 + 레몬 충전 동선 (PF_SPECS)
```
