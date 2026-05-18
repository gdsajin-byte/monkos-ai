---
type: order
from: iMac/쌍아
to: iMac/막내4
date: 2026-05-09
project: 문서체계총정리
priority: 높음
portfolio: PF_MONK_OS
deadline: 금일 내
---

# 지시서: 어젠다 README + MEMORY.md 외장 인덱스 현행화

## 배경

- 어젠다 README 최종 갱신: 2026-03-26 (2개월+ 미갱신)
- 4월 이후 어젠다 파일 4건 추가됐으나 README 인덱스 미반영
- 진행 안건 중 마감 경과 건 상태 미갱신
- MEMORY.md "외장 메모리" 인덱스 섹션이 memory/ 외장 파일을 가리키나, 막내1이 전부 이관/삭제 예정 → 링크 교체 필요

## 임무

### 1. 어젠다 README 현행화 (monkos-ops/ops/agenda/README.md)

#### 1-1. 4월 이후 신규 어젠다 반영

아래 파일들을 Read하여 어젠다 README에 등록:

```
AGENDA_20260411_갤러리탭_빈노출_이미지사이트맵.md
AGENDA_20260427_블로그이미지_alt단일화_썸네일시각력.md
AGENDA_20260428_MONK_KR_CF블로그_AILAB실험장.md
AGENDA_20260428_MONK_KR_레포분리_검토.md
```

각 파일을 읽고 적절한 카테고리(C/D/G 등)에 배치. 안건 번호는 #33부터.

#### 1-2. 만료/진행 안건 상태 갱신

README의 진행 안건 중:
- **#14 IRIS 지원사업**: 마감 03-30 경과 → 결과 확인 후 상태 갱신
- **#25 크롭앱 특허**: 현재 RIPC 2차 접수와 연동 → PF_RND 트랙 참조하여 상태 갱신
- **#29 디딤돌 대조**: 상태 확인

#### 1-3. PF_RND 편입 반영

강한소상공인, RIPC 관련 안건이 PF_RND로 편입되었는지 확인하고, README에 "PF_RND 편입" 이관 표기.

### 2. MEMORY.md 외장 인덱스 교체

MEMORY.md 위치: `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/MEMORY.md`

현행 "외장 메모리 (필요 시 Read)" 섹션의 항목들이 memory/ 파일을 가리킴.
막내1이 정본 이관 완료 후 → 이관된 정본 위치로 링크 교체.

**주의**: 막내1 작업 완료 후 실행. 막내1의 COMPLETION 보고서를 Read하여 이관 결과 확인 후 진행.

교체 패턴:
```
현행: `memory/project_jarvis_vision.md`
교체: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_자비스비전.md`
```

삭제된 항목(security_consolidation, user_4muse_origins 등)은 인덱스에서도 제거.
유지/이관된 항목은 새 경로로 교체.

### 3. 산출물

- 수정된 `monkos-ops/ops/agenda/README.md`
- 수정된 `MEMORY.md`
- `monkos-ops/ops/reports/COMPLETION_20260509_막내4_어젠다MEMORY현행화.md`

## 준수 조항

- ⚠️ 헌법 제3조 1항: 타임스탬프 절대 준수
- ⚠️ 어젠다 README 수정 시: 기존 종결 안건 테이블 변경 금지. 신규/진행 안건만 갱신
- ⚠️ MEMORY.md 수정: "외장 메모리" 섹션만 교체. 다른 섹션 변경 금지
- ⚠️ 막내1 완료 후 MEMORY.md 작업 착수 (의존성)
