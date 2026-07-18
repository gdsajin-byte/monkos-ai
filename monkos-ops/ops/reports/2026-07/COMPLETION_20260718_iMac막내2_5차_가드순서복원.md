---
type: completion
date: 2026-07-18
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: hairTop 새니티 + 가드 순서 IDPASS 정합 + grayBg 판정 축소

**[2026-07-18 18:51 KST]** iMac/막내2 → 작가님

## 작업 결과

### ✅ 1. hairTop 새니티 캡
- `HAIR_VOLUME_MAX = 0.15` — crown 위로 fullFaceH × 15% 초과 시 오검출 판정, hairTop 무시
- T0/T1 전 경로 방어 (나노 배경 아티팩트 대응)

### ✅ 2. 가드 순서 IDPASS 정합
- 순서: ① 눈 앵커 → ② 헤어 가드 → ③④ 하단 마진 + 축소 루프(눈 재앵커)
- 축소 루프에서 hairTop 프레임 안 체크 포함 (양립 불가 시 ②의 위치 유지)
- 기존 "헤어 재확인이 하단 가드를 무효화"하던 문제 해소

### ✅ 3. grayBg 판정 축소
- `/^회색$/` — 진한 회색만 T1 비노출 (de-passport 포함)
- 밝은 회색·연회색·크림 등은 매칭 안 함 → UK·FR·AU·FI T1 복구

## 라이브 확인

| 항목 | 결과 |
|------|------|
| UK T1 카드 | ✅ `t1: true` (light-gray → 허용) |
| KZ T1 카드 | ✅ `t1: false` (gray → 비노출) |
| FR T1 카드 | ✅ `t1: true` (밝은 회색 → 허용) |

## 배포

- crop-engine rev **00025-4bw** (SCRFD ready ✅)
- portal rev **00507-pmq** · jest 105/105
