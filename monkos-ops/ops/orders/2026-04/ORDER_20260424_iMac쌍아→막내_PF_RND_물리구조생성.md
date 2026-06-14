---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내
status: 대기
portfolio: PF_RND
priority: 1
---

[2026-04-24 17:41 KST] iMac/쌍아 → iMac/막내

# ORDER: PF_RND 물리 구조 생성 + 2트랙 초기화

## 배경

PF_RND 신설 승인 완료 (작가님 2026-04-24 17:34 KST).
제안서: `monkos-ops/ops/proposals/PROPOSAL_20260424_민아_PF_RND_신설_제안서.md`

## 임무

### 1. PF_RND 디렉토리 생성

```
monkos-ops/ops/portfolios/PF_RND/
├── README.md
├── tracks/
│   ├── TRACK_강한소상공인_v8/
│   │   ├── history.md
│   │   └── timeline.md
│   └── TRACK_RIPC_2026_2차/
│       ├── history.md
│       └── timeline.md
└── crossref/
    └── 중복지원_교차점검.md
```

### 2. README.md 작성

기존 PF 템플릿(`monkos-ops/ops/portfolios/PF_CROP/README.md` 등) 참조하여 PF_RND용 README 작성.

포함할 내용:
- PF 목적: 정부 R&D·IP·창업 지원사업 통합 추적
- 현재 2트랙: 강한소상공인 v8 (마감 5/6) + RIPC 하남 IP 2차 (마감 5/11)
- Phase 현황: 제안서 §6 참조
- 관련 PF: PF_CROP (크롭앱 특허 = RIPC 대상 기술)

### 3. 트랙별 history.md 초기화

**TRACK_강한소상공인_v8/history.md**:
- 기존 경과 요약 (디딤돌 불선정 → 강한소상공인 전환, v8까지 진행)
- 현재 상태: §7-5 삭제 → §6-2 정량목표 → §5 자본·자금 → 최종 PDF
- 마감: 2026-05-06

**TRACK_RIPC_2026_2차/history.md**:
- 오늘 민아 세션 산출물 링크 (제안서 §4-1 참조)
- 현재 상태: 신청서 A·B 초안 완성, 변리사 견적 대기, 작가님 기재란 미완
- 마감: 2026-05-11 18:00

### 4. 중복지원_교차점검.md 초기화

| 사업 | 주관 | 지원 유형 | 중복 제한 | 현재 상태 |
|------|------|----------|----------|----------|
| 강한소상공인 v8 | 소상공인진흥공단 | 창업 | 확인 필요 | 접수 준비 |
| RIPC 하남 IP 2차 | 경기지식재산센터 | IP | 확인 필요 | 접수 준비 |

## ⚠️ 주의

- §5 도구·MCP 추적은 PF_RND에 넣지 말 것 — PF_CDP 관할 (작가님·쌍아 검토 결정)
- 기존 파일 이동/삭제 없음 — 링크 관리만
- Phase 1 강한소상공인 실무는 쌍아 라인 (이 PF는 추적 허브일 뿐)

## 산출물

- `monkos-ops/ops/portfolios/PF_RND/` 디렉토리 + 하위 파일 전체

## 참조

- 제안서: `monkos-ops/ops/proposals/PROPOSAL_20260424_민아_PF_RND_신설_제안서.md`
- PF 템플릿 참조: `monkos-ops/ops/portfolios/PF_CROP/README.md`
- 관련 파일 인벤토리: 제안서 §4
