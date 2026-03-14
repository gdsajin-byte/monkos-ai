---
type: ORDER
date: 2026-03-14
time: "19:05 KST"
from: iMac/쌍아
to: 막내
subject: docs/corpus/sessions/ → ops/sessions/ 이관
priority: 일반
endline: 보고 후 대기
---

# 지시: 세션 로그 1~2월 이관

## 배경

1~2월 세션 로그가 docs/corpus/sessions/에 잔류. 현행 세션 로그 정위치는 monkos-ops/ops/sessions/. 월별 폴더 구조 통일.

## 작업

### 1. 목적지 폴더 생성

```bash
mkdir -p monkos-ops/ops/sessions/2026-01
mkdir -p monkos-ops/ops/sessions/2026-02
```

### 2. 이관 (git mv)

```
docs/corpus/sessions/2026-01/* → monkos-ops/ops/sessions/2026-01/
docs/corpus/sessions/2026-02/* → monkos-ops/ops/sessions/2026-02/
```

- README.md는 이관 불필요 (ops/sessions/에 이미 존재 시)
- 동명 파일 충돌 시: ops/ 쪽 기존 파일 보호, corpus/ 쪽에 `_origin` 접미사 부여

### 3. 빈 폴더 정리

이관 후 docs/corpus/sessions/ 가 비면 자동 소멸 (git 미추적).
docs/corpus/ 자체는 유지 (다른 하위 폴더 존재).

### 4. 커밋

```
[docs] sessions 1~2월 → ops/sessions/ 이관
```

커밋 후 push.

## 산출물

완료 보고: `monkos-ops/ops/reports/COMPLETION_20260314_막내_{HHMMSS}.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 헌법 제8조: git mv 사용 (히스토리 보존)
