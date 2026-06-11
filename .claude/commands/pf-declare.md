---
name: PF선언
description: 세션 시작 후 작업 대상 PF를 선언하고 관련 컨텍스트를 선택 로딩한다
---

> 원천: ch4 9조 (PF 운용 규칙) + ch7 6조 (활성 PF 참조 의무)
> 세션시작 스킬 완료 후 호출. 또는 세션 도중 PF 전환 시 호출.

## PF 선언 절차

### 1단계 — PF 선택

1. 작가님 또는 지시서에서 대상 PF를 확인한다.
2. 명시 없으면 작가님에게 질문: "이번 세션에서 어떤 PF를 다루시겠습니까?"
3. 복수 PF 가능 (예: PF_CITADEL + PF_PORTAL).

### 2단계 — PF 정본 로딩

1. 선언된 PF의 정본을 Read한다:
   - 파일형: `monkos-ops/ops/portfolios/PF_{코드네임}.md`
   - 폴더형: `monkos-ops/ops/portfolios/PF_{코드네임}/README.md`
2. Phase 현황, 최근 히스토리 5행, 리스크를 확인한다.

### 3단계 — 관련 법률 확인

1. PF 도메인에 따라 관련 법률을 식별한다:

| 도메인 | 관련 법률 |
|--------|----------|
| 서비스 (PHOTOPRO, PORTAL, CROP, STUDIO) | ch2 코딩, ch5 배포 |
| 인프라 (CDP, SECURITY) | ch2 코딩, ch5 배포 |
| 전략 (CITADEL, SPREAD, EVENT, PROFILES) | ch8 브랜딩 |
| 운영 (MONK_OS, DOCS, RND) | ch4 문서구조 |
| 콘텐츠 (BRIEF, PRESENTATION, VIDEO) | ch8 브랜딩 |

2. 핵심 조항만 확인 (전문 Read 불필요 — rules에 발췌 있음).

### 4단계 — 컨텍스트 요약 보고

1. 아래 형식으로 보고한다:

```markdown
📋 PF 선언: PF_{코드네임}
- Phase: {현재 Phase}
- 최근: {히스토리 최신 1행 요약}
- 리스크: {주요 리스크 또는 "없음"}
- 관련 법률: {ch번호 목록}
```

### 5단계 — 세션 종료 시 환류 예약

1. 이 PF에 대해 세션 마감 시 히스토리 어펜드가 필요함을 기억한다.
2. 세션 마감 스킬(3단계)에서 자동 체크된다.
