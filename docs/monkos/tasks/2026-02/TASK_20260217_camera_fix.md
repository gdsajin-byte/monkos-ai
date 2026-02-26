---
type: task
from: M1/쌍아
to: 막내(any)
date: 2026-02-17 13:33 KST
status: approved
tags: [camera, obfuscator, fix, blocker]
---

# 막내 지시서: 카메라 충돌 수정 — controlFlowFlattening 비활성화

## 배경

카메라 충돌 조사 결과 근본 원인 특정됨:
- `obfuscate.mjs`의 `controlFlowFlattening: true` 옵션
- async/await 코드 흐름을 switch문으로 변환 → initCamera() 등 파괴
- 40% 확률 적용 → 빌드마다 다른 결과 (확률적 장애)
- 로컬(난독화 없음)은 정상, Docker 빌드(난독화 적용)만 충돌

## 작업 내용

### STEP 1: KR obfuscate.mjs 수정

```
파일: monkos_AI/idphoto-kr/obfuscate.mjs
변경: controlFlowFlattening: true → false
```

```javascript
// 변경 전
controlFlowFlattening: true,
controlFlowFlatteningThreshold: 0.4,

// 변경 후
controlFlowFlattening: false,
// controlFlowFlatteningThreshold: 0.4,  // CFG 비활성화로 불필요
```

### STEP 2: JP obfuscate.mjs 동일 수정

```
파일: monkos_AI/idphoto-jp/obfuscate.mjs
변경: 동일 — controlFlowFlattening: false
```

KR/JP 동일 옵션이므로 **둘 다 수정**.

### STEP 3: .dockerignore 추가 (KR/JP 둘 다)

```
파일: monkos_AI/idphoto-kr/.dockerignore (신규)
파일: monkos_AI/idphoto-jp/.dockerignore (신규)
```

내용:
```
node_modules
.git
.DS_Store
*.md
docs/
```

### STEP 4: 검증

- `grep -n "controlFlowFlattening" monkos_AI/idphoto-kr/obfuscate.mjs`
- `grep -n "controlFlowFlattening" monkos_AI/idphoto-jp/obfuscate.mjs`
- 둘 다 `false`인지 확인

### STEP 5: 커밋

```
커밋 메시지: [idphoto-kr/jp] 카메라 충돌 수정: obfuscator controlFlowFlattening 비활성화 + .dockerignore 추가
```

## 제약

- **배포 금지** — 커밋만. dev 배포는 작가님 지시 후
- KR/JP 둘 다 수정 (동일 옵션)
- obfuscate.mjs에서 controlFlowFlattening 관련 2줄만 변경, 나머지 옵션 건드리지 마

## 완료 보고

```
✅ 수정: KR/JP obfuscate.mjs — controlFlowFlattening: false
✅ 추가: KR/JP .dockerignore
📁 변경 파일: 4개
🔀 커밋: [해시]
```
