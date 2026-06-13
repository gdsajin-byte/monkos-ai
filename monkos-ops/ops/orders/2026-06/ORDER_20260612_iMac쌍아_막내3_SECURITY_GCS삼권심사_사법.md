---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내3
subject: "monk-ai-images 버킷 교정 3권심사 — 사법 (검증·리스크)"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — monk-ai-images 3권심사: 사법 (검증·리스크)

> **[2026-06-12 12:47 KST]** iMac/쌍아 → iMac/막내3
> 작가님 직접 지시(②경로). Cloud Run SA 맵 후속.
> 3권 심사: 막내1=입법, 막내2=행정, 막내3=사법. 독립 진행 후 교차 대조.

---

## 배경

동일. 선행 보고서 필독:
- `REPORT_20260612_iMac막내3_SECURITY_CloudRun_SA맵_종료판정.md` (본인 작성)
- `REPORT_20260612_iMac막내1_SECURITY_GCS버킷코드참조전수.md`
- `REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md`

## 사법 관점 — "구멍과 리스크를 찾아라"

### Task 1 — allUsers 제거 시 장애 시나리오 전수

allUsers를 버킷 레벨에서 제거했을 때 발생 가능한 장애를 **서비스별로 시뮬레이션**:

| 서비스 | 영향받는 URL 패턴 | 장애 증상 | 발생 확률 | 심각도 |
|--------|-----------------|----------|----------|--------|
| idphoto-kr | `service/idphoto/kr/*.jpg` | ? | ? | ? |
| idphoto-jp | ... | | | |
| portal (블로그) | `blog/*.jpg` | ? | ? | ? |
| portal (광고) | `ads/*.jpg` | ? | ? | ? |
| photolab | ... | | | |
| 외부 백링크 | 구글 이미지 검색에 캐시된 public URL | ? | ? | ? |

**특히 확인할 것:**
1. 구글 이미지 검색에 monk-ai-images URL이 인덱싱되어 있을 가능성
2. 외부 사이트에서 직접 링크(핫링크)하고 있을 가능성
3. 네이버 블로그·SNS에 이미 공유된 이미지 URL 깨짐

### Task 2 — 교정 시 데이터 유실 리스크

1. 파일 레벨 ACL 보정 시 기존 ACL 덮어쓰기 리스크
2. `raw_data/` 3.17GB — 백업 없이 삭제 시 복구 불가
3. `service/idphoto/` 고객 사진 — 마이페이지 재다운로드 경로 단절 가능성
4. studio 경로 혼용 (`service/idphoto/kr/`에 studio가 쓰는 문제) — 경로 분리 시 참조 깨짐

### Task 3 — 현행 보안 노출 심각도 평가

현재 allUsers 상태에서의 실제 피해 가능성:
1. `raw_data/kbeauty_sources/` 2.93GB — 어떤 데이터인지 (파일명 패턴으로 추정)
2. `service/idphoto/` 770MB 990건 — 고객 증명사진이 public URL로 접근 가능한지 실제 curl 확인
3. `generated/` 187MB — AI 생성물의 민감도
4. **GDPR/개인정보보호법 위반 해당 여부** — 고객 실명+촬영물 조합이 공개 상태일 때

### Task 4 — 교정 후 검증 체크리스트

교정 작업 완료 후 "성공"을 판정할 체크리스트 작성:

```
□ allUsers 제거 확인 (익명 curl 403/404)
□ public 유지 경로 정상 접근 (ads/, blog/)
□ private 경로 차단 확인 (service/, raw_data/)
□ Signed URL 정상 발급 확인 (idphoto-kr, idphoto-jp)
□ 서비스별 핵심 동선 정상 (증명사진 촬영→결과→다운로드)
□ 마이페이지 재다운로드 (미래 구현 시) 경로 확보
□ GSC 이미지 색인 영향 확인
```

## 산출물

| # | 파일 |
|---|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내3_SECURITY_GCS삼권심사_사법.md` |

## ⚠️ 준수 조항

- **헌법 4조 2항**: **읽기 전용**. 변경 금지. 고객 촬영물 열람 금지 — URL 접근 테스트는 HEAD 요청만.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.
- 독립 판단 우선. **막내1(입법)·막내2(행정)의 결론에 반론이 있으면 명시적으로 기록.**

## 커밋 메시지

```
[research] monk-ai-images 3권심사 사법 — 장애 시나리오 + 리스크 평가 + 검증 체크리스트
```
