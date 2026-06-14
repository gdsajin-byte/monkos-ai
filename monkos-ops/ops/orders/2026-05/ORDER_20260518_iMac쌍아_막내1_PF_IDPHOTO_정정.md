---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내1
status: 긴급정정
portfolio: PF_IDPHOTO
---

# 긴급 정정: PF_IDPHOTO 개설 지시서 오류 수정

## ❌ 잘못된 부분

1. **PF_CROP 흡수 금지** — PF_CROP은 IDPASS 크롭앱이며 독립 PF로 유지. status 변경하지 마라
2. **"IDPASS 확장" 개념 폐기** — 증명사진 앱은 IDPASS와 별도 독립 앱으로 출시
3. 비전 섹션의 "IDPASS(크롭) = 무료 배포 → 유입 깔때기" 구조 삭제

## ✅ 정정된 구조

### PF 관계

| PF | 변경 | 비고 |
|---|------|------|
| **PF_CROP** | **변경 없음. 건드리지 마라** | IDPASS 크롭앱, 독립 유지 |
| **PF_PHOTOPRO** | → `completed (merged → PF_IDPHOTO)` | 웹 증명사진 히스토리 흡수 |
| **PF_IDPHOTO** | 신규 개설 | PF_PHOTOPRO 승격 |

### 앱 구조 (독립 앱 3개)

| 앱 | 성격 | PF |
|---|------|-----|
| **IDPASS** | 크롭 전용 무료앱 | PF_CROP (기존) |
| **증명사진 앱** (별도) | AI 증명사진 생성 | **PF_IDPHOTO** |
| **프로필 앱** (별도) | AI 프로필 사진 생성 | 추후 |

### Phase 5 정정

"IDPASS 확장" → **"독립 iOS 네이티브 증명사진 앱 신규 개발"**로 전부 교체.

IDPASS의 코드 자산(Vision, 규격 데이터 등)을 **참조/공유할 수는 있지만**, IDPASS 앱 자체를 확장하는 것이 아님.

## 요약

- PF_CROP 일절 수정 금지
- PF_PHOTOPRO만 PF_IDPHOTO로 승격
- Phase 5 = 독립 iOS 증명사진 앱
