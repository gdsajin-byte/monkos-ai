---
type: order
id: ORDER_20260614_iMac쌍아_막내_IDPHOTO_GA4측정ID분리
date: 2026-06-14 13:21 KST
from: iMac/쌍아
to: 막내
portfolio: PF_IDPHOTO
priority: P2
status: pending
---

# GA4 측정 ID 교차오염 수정 — KR/JP 25개 HTML 측정 ID 분리

> **[2026-06-14 13:21 KST] iMac/쌍아 → 막내**
> 귀속: PF_IDPHOTO
> 근거: REPORT_20260614_iMac민아_IDPHOTO_GA4측정ID교차오염_감사.md (민아 감사)
> 원인: 2026-03-13 `3a69f239` KR에 JP ID 복붙 + `def0074a` KR ID 추가 시 JP ID 미제거

---

## 목표

KR·JP 사이트의 GA4 측정 ID를 각자 자기 속성 단일로 정리한다. 3개월간 누적된 교차오염을 해소하여 GA4 데이터 신뢰성을 회복한다.

---

## 현상

모든 HTML의 `<head>`에 두 개 측정 ID가 동시 선언:
```html
<script src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>
  gtag('config', 'G-JPZWSJ3323');
  gtag('config', 'G-FKG0CPTC14');
</script>
```
→ 모든 이벤트가 KR·JP 양 속성에 이중 전송.

---

## 측정 ID 매핑

| 사이트 | 정본 측정 ID | 제거 대상 |
|--------|------------|----------|
| **idphoto-kr** | `G-FKG0CPTC14` | `G-JPZWSJ3323` 제거 |
| **idphoto-jp** | `G-JPZWSJ3323` | `G-FKG0CPTC14` 제거 |

---

## 수정 대상

### idphoto-kr/public/*.html (12개)
1. `<script src=".../gtag/js?id=G-JPZWSJ3323">` → `id=G-FKG0CPTC14`로 교체
2. `gtag('config', 'G-JPZWSJ3323');` 라인 삭제
3. `gtag('config', 'G-FKG0CPTC14');`만 잔류

### idphoto-jp/public/*.html (13개)
1. 로더 `id=` 값이 이미 `G-JPZWSJ3323`인지 확인 (정상이면 유지)
2. `gtag('config', 'G-FKG0CPTC14');` 라인 삭제
3. `gtag('config', 'G-JPZWSJ3323');`만 잔류

---

## ⚠️ 준수 조항

- **배포는 `deploy.sh` 경유** (ch5 2조). `gcloud run deploy` 직접 실행 금지.
- 두 서비스 **각각 별도 배포**: `./deploy.sh prod` (idphoto-kr) + `./deploy.sh prod` (idphoto-jp)
- **roll-up 전략 여부**: 쌍아 확인 완료 — 의도된 roll-up이 아닌 복붙 사고. 안심하고 분리.
- 센서 코드(spec_select, photo_upload 등 6종)는 **변경하지 않는다**. 측정 ID 라인만 수정.

---

## 검증

수정·배포 후 **프로덕션에서 실측 검증** 필수:

1. idphoto-kr prod 접속 → 규격 선택 → 브라우저 네트워크 탭에서 `collect` 요청 확인
   - `tid=G-FKG0CPTC14` → ✅
   - `tid=G-JPZWSJ3323` → ❌ 있으면 실패
2. idphoto-jp prod 동일하게 반대로 검증
3. 양쪽 모두 단일 tid 확인되면 완료

---

## 산출물

- idphoto-kr 12개 HTML 수정
- idphoto-jp 13개 HTML 수정
- 프로덕션 배포 2건 (deploy.sh 경유)
- 검증 결과 (collect tid 단일화 실측)
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_IDPHOTO 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
