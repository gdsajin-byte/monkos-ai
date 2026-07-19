---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내1
portfolio: PF_SPECS
status: 대기
priority: P1
prerequisite: V1 소각 완료 (f8d392b5 + P0 핫픽스 통과)
---

# 지시서: specs 전수조사 — 서빙 버전·이미지-배경 정합·텍스트 모순·데드 UI 계보

**[2026-07-19 12:48 KST]** iMac/쌍아 → 막내1

## 배경

V1 소각 + 유색 게이트 개방 완료(rev 00512). 이제 428슬러그 전량 V2 단일 렌더러 상태여야 함. 전수조사로 잔존 문제 0 확인 + 기계적 모순 탐지.

- 민아 기획서: `PROPOSAL_20260719_민아_V1완전제거_유색국정합_전수조사.md` (C1·C2·C3·C4 + B3)

## ⚠️ 준수 조항

- 조사 스크립트는 **읽기 전용** — 데이터 교정하지 않음. 모순 발견 시 목록으로 보고만.
- deploy.sh 경유 배포 필수 (수정이 발생할 경우)
- kw-visa / om-visa 배경 미확정분: **교정 금지**, 목록에 "미확정" 표기만

## 작업

### Task 1. C1 — 서빙 버전 전수 (V1 잔존 0 확인)

428슬러그 전량에 대해 `isEngineCompatibleSpec` + `isV2Spec` predicate를 스크립트로 판정:

```javascript
// 스크립트 골격 — Node.js로 실행
const { SPECS_DATA } = require('./lib/cms/specs-data.js');
// isEngineCompatibleSpec, isV2Spec 함수를 import하거나 재현
// 전 슬러그 판정 → V1 잔존 목록 출력
```

**종료 조건**: V1 잔존 = cn-resume 1건만 (의도적 제외). 그 외 잔존 발견 시 즉시 보고.

### Task 2. C2 — 이미지-규정 배경 모순 전수

유색·회색 배경 30+슬러그의 가이드 이미지를 기계 대조:
- 이미지 파일(webp/png)의 4모서리 픽셀 색상 추출
- 규정 bg hex (`countries.jsonl`의 background → hex 매핑) 와 비교
- 모순(예: 규정=파랑인데 이미지=흰색) 목록 출력

도구: sharp 또는 canvas로 픽셀 읽기. 이미지 경로: `public/images/guides/{slug}_{lang}.webp`

### Task 3. B3 — 텍스트-배경 모순 스캔

유색 배경국의 SEO 텍스트·본문에 "흰색", "white", "흰 배경" 등 모순 표현이 남아 있는지 grep:

```bash
# 규정 배경이 흰색이 아닌 슬러그의 seoTitle/seoDescription/details/heroDesc에서 흰색 관련 문구 검출
```

결과: 슬러그 + 필드 + 모순 문구 목록

### Task 4. C3 — 데드 UI 계보 (P2, 기록용)

V1 업로드가 언제부터 배선 없이 방치됐는지 git log 추적:
- `specsDetailFragment`에서 input[type=file]이 마지막으로 존재한 커밋
- 삭제된 시점의 커밋 해시 + 날짜 + 작업자

간략 타임라인 1장으로 정리. 깊이 파지 않아도 됨.

### Task 5. C4 — 재색인 대상 URL 목록 산출

V1→V2 전환된 6슬러그 × 4언어 = 최대 24 URL 목록 생성:
- 형식: 한 줄에 하나씩 전체 URL (`https://monkos.ai/specs/visa/kw` 등)
- **재색인 실행은 하지 않음** — 목록만 산출하여 보고서에 포함. 작가님 원탭 실행용.

### Task 6. kw-visa / om-visa CDP 재시도 (가능 시)

eVisa 포털(evisa.moi.gov.kw, evisa.rop.gov.om)이 JS SPA라 WebFetch 실패했던 건.
- CDP 브라우저 스킬(`/cdp-browser`) 활용하여 접근 시도
- 사진 규격 페이지의 배경색 명시 원문 확보
- **확보 실패 시**: "CDP 재시도 실패, 수동 확인 필요" 보고만. 데이터 교정 금지.
- 오만 ROP 원문도 재확인 (막내2가 외무부 대사관 경유였으므로 발급기관 직접 확인)

## 산출물

보고서 1건:
```
monkos-ops/ops/reports/2026-07/REPORT_20260719_iMac막내1_SPECS_전수조사.md
```

포함:
- C1: V1 잔존 목록 (0건 기대)
- C2: 이미지-배경 모순 목록
- B3: 텍스트-배경 모순 목록
- C3: 데드 UI 계보 타임라인
- C4: 재색인 URL 목록
- C0 CDP: 배경색 확보 결과

## 완료 조건

1. 보고서 파일 생성
2. 모순 발견 시 교정하지 않고 목록으로만 보고
3. 커밋·푸시

## 커밋

```
[ops] specs 전수조사 — 서빙 버전·이미지 정합·텍스트 모순·데드 UI 계보·재색인 목록
```
