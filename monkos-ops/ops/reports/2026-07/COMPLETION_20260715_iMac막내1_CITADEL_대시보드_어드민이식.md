---
type: completion
date: 2026-07-15
device: iMac
agent: 막내1
portfolio: PF_CITADEL
subject: CITADEL 대시보드 어드민 이식 — 초본 HTML + 실데이터 바인딩 + prod 배포
status: 완료
order: ORDER_20260715_iMac쌍아_막내_CITADEL_대시보드_어드민이식.md
---

# COMPLETION — CITADEL 대시보드 어드민 이식

**[2026-07-15 12:07 KST]** iMac/막내1 → 작가님

---

## 결과

✅ `dashboard.js`에 `handleDashboardCitadel` 함수 추가 (GA4 7d 세션 + BQ 퍼널/이벤트 종합, 1h 메모리 캐시)
✅ `server.js`에 `/api/admin/dashboard/citadel` 라우트 등록 + import 추가
✅ `admin/citadel.html` 신규 생성 — 초본 이식 + nav 바 + 인증 + 실데이터 바인딩
✅ `admin/dashboard.html` nav에 CITADEL 링크 추가
✅ 민아 정정 3건 반영:
  - 정정①: GA4 세션(7d) = 7d 합계 + 일평균 병기
  - 정정②: Purchase = 실데이터 or "계측 중" 표시
  - 정정③: 전 KPI 카드에 `데이터 기준: YYYY-MM-DD` 캡션 추가
✅ dev 배포 (rev 00126) → 검증 OK
✅ prod 배포 (rev 00477) → `monkos.ai/admin/citadel.html` 401 확인 (인증 정상)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/dashboard.js` | `handleDashboardCitadel` 함수 + BQ import 추가 |
| `monkos_AI/portal/server.js` | import + 라우트 1줄 추가 |
| `monkos_AI/portal/public/admin/citadel.html` | 신규 생성 |
| `monkos_AI/portal/public/admin/dashboard.html` | nav에 CITADEL 링크 1개 추가 |

## 배포

- dev: `monkos-portal-dev` rev 00126-f6q
- prod: `monkos-portal` rev 00477-gc5

## 준수 조항 확인

1. ✅ 초본 원본 존중 — 레이아웃/색상/구조 그대로, 변경은 정정 3건 + nav + 데이터 바인딩에 한정
2. ✅ 시크릿 비노출 — 카운트·상태만 표시
3. ✅ GSC API 범위 밖 — GSC KPI는 "연결 대기" 플레이스홀더
4. ✅ 기존 dashboard.html 무변경 — nav 링크 1개만 추가
5. ✅ deploy.sh prod 경유 배포

## 비고

- `monkos.ai/admin/citadel.html` 로 접속 → 로그인 → 실데이터 렌더 확인 필요
- BQ `purchase` 이벤트가 0이면 "계측 중"으로 표시됨 (정정② 반영)
