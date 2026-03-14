---
type: ORDER
date: 2026-03-14
time: "18:15 KST"
from: iMac/쌍아
to: 막내3
subject: docs/ 실행 — rnd_2026 이관 + corpus/factory 삭제
priority: 일반
endline: 보고 후 대기
---

# 지시: docs/ 정리 실행 — rnd 이관 + factory 삭제

## 배경

막내3 리서치 보고(REPORT_20260314_막내3_docs정리_archives_rnd)에서 docs/rnd_2026/과 monkos-ops/tech/rnd/의 분산이 확인됨. 작가님 결정: tech/rnd/로 통합, 기존 삭제.

## 작업

### 1. docs/rnd_2026/ → monkos-ops/tech/rnd/ 이관

- docs/rnd_2026/ 내 **모든 파일**을 monkos-ops/tech/rnd/로 이관 (`git mv`)
- 경로 충돌 시: tech/rnd/에 이미 존재하는 파일은 **건드리지 말 것** (활성 리서치)
- 충돌 파일은 docs/rnd_2026/ 쪽을 `archive/` 서브폴더로 분리
- `PDF변환 디딤돌 R&D/` 서브디렉토리도 통째로 이관
- tech/rnd/README.md에 이관 내역 출납 로그 추가

### 2. corpus/factory/ 삭제

- `docs/corpus/factory/` 폴더 전체 삭제 (`git rm -r`)
- 사문화 확인 완료 (막내2 리서치 보고)

### 3. tech/rnd/README.md 구 경로 보정

- `01_전략/decisions/` → `monkos-ops/ops/decisions/`로 수정 (막내3 리서치에서 발견)

### 4. 커밋

단일 커밋:
```
[docs] rnd_2026 → tech/rnd 이관 + corpus/factory 삭제
```

커밋 후 push.

## 산출물

완료 보고: `monkos-ops/ops/reports/COMPLETION_20260314_막내3_{HHMMSS}.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 헌법 제4조: 이관 전 대상 파일 확인, 충돌 시 기존 활성 파일 보호
- git mv 사용 (히스토리 보존)
