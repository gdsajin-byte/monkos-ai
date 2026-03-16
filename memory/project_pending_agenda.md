---
name: project_pending_agenda
description: 미결 어젠다 — 즉시 실행 대기 / 기안 검토 대기 / 장기 로드맵 항목
type: project
---

# 미결 어젠다

## 즉시 실행 대기

1. **블로그 에디터 2차** — 3컬럼 + 헤더버튼 + 이미지 저장소 (지시서 발행 완료, 막내 투입 대기)
2. **막내 1차 8건 프로덕션 배포** — Cloud Run 수동 배포 필요 (커밋 `aadffa8`)
3. **FAQ EN/JA Firestore 시딩** — 번역본 준비 완료, 시딩 미실행

## 기안 검토 대기

4. **블록 에디터 통합** — `monkos-ops/ops/proposals/PROPOSAL_20260316_블록에디터통합_기안서.md`
   - Phase A: HTML 블록 템플릿 삽입 (Toast UI 유지, 단기)
   - Phase B: Editor.js 전환 (중기)
   - Phase C: 홈+블로그 통합 블록 시스템 (v4 Phase 6~7)

5. **GEO GitHub 공개 레포 전략** — `monkos-ops/ops/proposals/PROPOSAL_20260316_GEO_GitHub공개레포_전략.md`
   - monkos-ai 사문화 레포 → Public 전환 + 코드 없이 기술 문서/이슈 활용
   - 용아 자문 + 철창이 전략 기반

## 장기 로드맵

6. **works/ 자동 동기화** — rsync 세션 통합안 설계 필요
7. **포털 홈 블록 분리 리팩토링** — v4 Evolution Spec Phase 2~4
8. **어드민 블록 에디터 UI** — v4 Phase 6~7 (기안서 #4와 합류)
