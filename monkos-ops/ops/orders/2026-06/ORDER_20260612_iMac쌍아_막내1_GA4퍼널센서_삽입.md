---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "GA4 퍼널 센서 7종 삽입 — idphoto-kr/jp 전환 측정 인프라"
status: 대기
portfolio: PF_IDPHOTO
---

# 지시서 — GA4 퍼널 센서 7종 삽입

> **[2026-06-12 19:23 KST]** iMac/쌍아 → iMac/막내1
> 설계서: `monkos-ops/tech/designs/2026-06/DESIGN_20260612_GA4퍼널센서_스키마.md`
> 작가님 승인 완료. 광고 중단 상태에서 오가닉 유입 측정 시급.

---

## 배경

GA4에 퍼널 핵심 단계 이벤트가 없어서 어디서 이탈하는지 데이터로 못 보는 상태. 설계서 기반으로 이벤트 7종을 삽입한다.

## 삽입 대상

**idphoto-kr** (`monkos_AI/idphoto-kr/public/`) + **idphoto-jp** (`monkos_AI/idphoto-jp/public/`)

## 이벤트 7종

| # | 이벤트명 | 트리거 시점 | 삽입 위치 (참고) |
|---|---------|-----------|----------------|
| 1 | `spec_select` | 규격 선택 시 | index.html 규격 선택 핸들러 |
| 2 | `photo_upload` | 셀카 업로드 완료 시 | camera.js 또는 업로드 핸들러 |
| 3 | `sign_up` | 이미 존재 — 확인만 | auth 모듈 |
| 4 | `generate_click` | 생성 버튼 클릭 시 | result.js `runGeneration()` 진입부 |
| 5 | `preview_view` | 프리뷰 이미지 렌더 완료 시 | result.js 생성 완료 후 |
| 6 | `begin_checkout` | 다운로드/결제 버튼 클릭 시 | result.js 다운로드 핸들러 |
| 7 | `purchase` | 결제 완료 (thankyou 진입) | thankyou.html 또는 결제 콜백 |

## 공통 파라미터 4종 (전 이벤트 부착)

```js
gtag('event', '{이벤트명}', {
  spec_type: store.format || '',      // 'passport', 'resume', 'visa'
  auth_method: store.user.provider || '',  // 'google', 'kakao', 'line'
  lang: document.documentElement.lang,     // 'ko', 'ja'
  service: 'idphoto-kr'                    // 또는 'idphoto-jp'
});
```

`purchase` 추가: `value`(금액), `currency`('KRW' 또는 'JPY'), `transaction_id`.

## 구현 원칙

- `gtag('event', ...)` 1줄 삽입. 복잡한 래퍼 불필요.
- GA4 measurement ID는 이미 활성 (page_view 수집 중) — 신규 태그 설치 불요.
- idphoto-kr과 idphoto-jp **양쪽 모두** 삽입. `service` 파라미터로 구분.
- `sign_up`은 이미 존재하므로 파라미터 4종만 추가 부착.

## 검증

삽입 후 **GA4 DebugView**에서 각 이벤트 실시간 발화 확인:
1. 규격 선택 → `spec_select` 발화
2. 사진 업로드 → `photo_upload` 발화
3. 생성 클릭 → `generate_click` 발화
4. 프리뷰 표시 → `preview_view` 발화
5. 다운로드 클릭 → `begin_checkout` 발화
6. 파라미터 4종이 정상 수집되는지

## 배포

삽입 + 검증 완료 후:
```bash
cd monkos_AI/idphoto-kr && ./deploy.sh prod
cd monkos_AI/idphoto-jp && ./deploy.sh prod
```

## ⚠️ 준수 조항

- **ch2 코딩**: 순수 JS, gtag 표준 API 사용.
- **ch5 배포**: deploy.sh 경유.
- **헌법 3조 1항**: 매 턴 `date` KST.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.

## 커밋 메시지

```
[feat] GA4 퍼널 센서 7종 삽입 — idphoto-kr/jp 전환 측정 인프라
```
