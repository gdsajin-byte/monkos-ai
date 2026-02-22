# 아키텍처 문서 카탈로그

> 원본: `docs/infrastructure/` — 이 문서는 인덱스만 제공, 원본 무수정
> 갱신: 2026-02-22

## 시스템 아키텍처 (5건)

| # | 문서 | 요약 | 원본 경로 |
|---|------|------|----------|
| 1 | 3트랙 시스템 | Mac/iMac/Cloud 인프라 + 6인 에이전트 팀 체계 | `docs/infrastructure/3TRACK_SYSTEM_ARCHITECTURE.md` |
| 2 | 서비스 플로우차트 | idphoto 서비스 흐름 (사용자→Cloud Run→Gemini/Imagen) | `docs/infrastructure/ARCHITECTURE_FLOWCHART.md` |
| 3 | 용아 아키텍처 가이드 | 클라우드 네이티브 엔진 설계 (이벤트 드리븐) | `docs/infrastructure/ARCHITECTURE_GUIDE_FROM_YONGA.md` |
| 4 | 포토스튜디오 아키텍처 | Photo Studio 서비스 구조 + MONK.KR 생태계 포지셔닝 | `docs/infrastructure/MONK_PHOTO_STUDIO_ARCHITECTURE.md` |
| 5 | 운영 인프라 개요 (2/20) | 5디바이스, 데몬, 네트워크 토폴로지, 통신 프로토콜 통합 | `docs/infrastructure/OPERATIONS_OVERVIEW_20260220.md` |

## 기능 설계 (6건 → feature_specs_catalog.md)

아키텍처와 분리된 기능별 상세 스펙은 [feature_specs_catalog.md](feature_specs_catalog.md) 참조.

## 코드 공유 설계 (1건)

| # | 문서 | 요약 | 원본 경로 |
|---|------|------|----------|
| 1 | KR/JP 공유 코어 분리 | 단일 코드베이스 + 지역 변수(언어/결제)만 분기 | `docs/infrastructure/SHARED_CORE_SEPARATION_PLAN.md` |
