---
type: AGENDA
date: 2026-04-28
author: iMac/쌍아
status: 대기
priority: P2
---

# monk.kr CF 블로그 — AILAB 실험장

## 컨셉

monk.kr에 CF Workers 기반 블로그/에디터 시스템을 별도 구축한다.
79 리팩토링 때 AILAB에서 완성 → monkos로 이전한 검증된 패턴 재활용.

## 목적

1. **CF 생태계 실전 경험**: D1(DB) · R2(이미지/파일) · Workers(서버리스) · Stream(동영상)
2. **Google 텃세 회피**: Google 인프라를 찔러가는 게 아니라 CF 자체 완결 구조
3. **블로그 AI 기능 실험**: 시드 · 단락별 맥락 추적 · 이미지 생성 · 표 생성 · 검색 추천 · 편집 스킬
4. **기능 개별 배포 패턴 검증**: Workers 함수 단위 배포 → Cloud Run 전체 재배포와 비교
5. **안정화 후 monkos.ai 블로그 전환 근거 확보**

## 구조 (예상)

```
monk.kr (CF Pages)
├── 정적 랜딩 (현행)
├── /blog → CF Workers + D1 (블로그 서빙)
├── /admin → 에디터 UI (CF Pages or Workers)
└── AI 기능 → Workers 개별 함수
    ├── blog-ai-seed.js
    ├── blog-ai-translate.js
    ├── blog-ai-image.js
    └── ...

저장소: D1 (블로그 데이터)
이미지: R2 (CDN 내장)
AI: Workers → Gemini API (외부 REST, 어디서든 동일)
```

## 본진(monkos.ai) 영향

- **없음**. 완전 독립 실험. 실패해도 monkos.ai 블로그 그대로 유지.
- 성공 시: monkos.ai 블로그 데이터를 monk.kr로 마이그레이션 → Cloud Run에서 블로그 부하 제거

## 선행 조건

- [ ] monk.kr 레포 분리 (AGENDA_20260428_MONK_KR_레포분리_검토.md)
  - 또는 레포 분리 전에 MONK_kr/ 폴더 내에서 Workers 프로젝트 시작도 가능
- [ ] CF 계정 D1/R2/Workers 쿼터 확인

## 연관

- 79 리팩토링 → AILAB → monkos 이전 패턴 (검증됨)
- 4/28 작가님-쌍아 대화: "라이브는 살려두고 AILAB에서 테스트 거쳐서 옮겨간 거"
- AGENDA_20260428_MONK_KR_레포분리_검토.md (레포 분리 시 함께 진행 가능)

## 트리거

- 작가님 판단에 따름
- 블로그 기능 요구가 현행 Cloud Run 구조에서 병목될 때
