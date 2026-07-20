---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_IDPHOTO
---

# 지시서: 크롭 33 플로어 제거 — 규격별 하한+1 복원

> **[2026-07-20 13:03 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 12:57 KST

## 배경

`spec-crop.js:84`의 `Math.max(33, fMin + 1)`에서 `33`은 kr 35×45 기준으로 박힌 상수.
40~59mm 프레임 39건에서 규격 자체의 하한이 아니라 kr 상수에 끌려가는 상한 밀착 역전 발생.
작가님 납품 철학(하한 편향 = 심사관 정수리 편차 방어)의 원상복구.

## Task

### Task 1 — 33 플로어 제거

**파일**: `monkos_AI/portal/lib/spec-crop.js`
**위치**: 84행

**현재**:
```js
const base = frameHmm >= 60 ? fMax - 1 : frameHmm >= 40 ? Math.max(33, fMin + 1) : frameHmm * 0.70;
```

**변경**:
```js
const base = frameHmm >= 60 ? fMax - 1 : frameHmm >= 40 ? fMin + 1 : frameHmm * 0.70;
```

**주석 갱신**: 71행의 주석에서 `max(33,fMin+1)` → `fMin+1`로 반영.

### Task 2 — 가드 테스트 전 슬러그 통과

```bash
npm test
```

- jest 전량 녹색 필수 (spec-crop-consistency 428 전 슬러그 faceTarget∈headHeight 포함)

### Task 3 — 실렌더 전후 비교 5슬러그

변경 전후로 아래 5슬러그의 `resolveCropSpec()` 출력을 비교 기록:

| 슬러그 | 프레임 | 변경 전 faceTargetMm | 변경 후 faceTargetMm | 범위 |
|--------|--------|---------------------|---------------------|------|
| uk-passport | 35×45 | | | 29~34 |
| sg-passport | 35×45 | | | 25~35 |
| us-passport | 51×51 | | | 25~35 |
| jm-passport | 25×35 | | | (계산) |
| mx-passport | 30×40 | | | 32~39 |

변경 후 faceTargetMm이 해당 규격 headHeight 범위 안에 있는지 확인.

### Task 4 — 배포

- `./deploy.sh` (portal)

## ⚠️ 준수 조항

- `frameHmm >= 60` 분기 미접촉 — 이번 스코프 밖
- 명시값 경로(faceTargetExplicitMm, 75행) 무접촉
- FACE_MIN_RATIO, hairMarginMm 무접촉
- 민아 검증 게이트 대상

## 완료 기준

- [ ] 84행 33 제거, 주석 갱신
- [ ] jest 전량 녹색
- [ ] 5슬러그 전후 비교표 COMPLETION 보고서에 포함
- [ ] 배포 완료
- [ ] COMPLETION 보고서 + 세션 로그 + PF 어펜드 + 커밋 + 푸시
