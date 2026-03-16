---
name: project_pending_agenda
description: 미결 어젠다 — 즉시 실행 대기 / 기안 검토 대기 / 장기 로드맵 항목 (2026-03-16 18:49 갱신)
type: project
---

# 미결 어젠다

## 즉시 실행 대기

1. **FAQ EN/JA Firestore 시딩** — 번역본 준비 완료(`~/Desktop/works/portal_v4/`), 시딩 미실행
2. **GitHub Issue 자동 게시 (파이프라인 Phase 1)** — PAT 발급 후 translate.js에 GitHub API 연동. 가장 빠르게 착수 가능

## 기안 검토 대기

3. **콘텐츠 자동 배포 파이프라인** — `monkos-ops/ops/proposals/PROPOSAL_20260316_콘텐츠자동배포파이프라인.md`
   - "작가님은 한글로 한 번만 쓴다" → 6채널 자동
   - Phase 1: GitHub(즉시) → 2: Medium → 3: 티스토리 → 4: note.com → 5: X

4. **블록 에디터 통합** — `monkos-ops/ops/proposals/PROPOSAL_20260316_블록에디터통합_기안서.md`
   - Phase A: HTML 블록 템플릿 삽입 (Toast UI 유지, 단기)
   - Phase B: Editor.js 전환 (중기)
   - Phase C: 홈+블로그 통합 블록 시스템 (v4 Phase 6~7)

5. **GEO GitHub 공개 레포 전략** — `monkos-ops/ops/proposals/PROPOSAL_20260316_GEO_GitHub공개레포_전략.md`
   - monkos-ai Public 전환 완료 (2026-03-16)
   - 이슈 콘텐츠 시리즈 7건 + 정기 활동 검토 대기
   - 파이프라인 #3 Phase 1과 연동

## 장기 로드맵

6. **works/ 자동 동기화** — rsync 세션 통합안 설계 필요
7. **포털 홈 블록 분리 리팩토링** — v4 Evolution Spec Phase 2~4
8. **어드민 블록 에디터 UI** — v4 Phase 6~7 (기안서 #4와 합류)

## 완료 처리 (2026-03-16)

- ~~블로그 에디터 WYSIWYG 리뉴얼~~ → 에디터 1~4차 + 긴급 수정 완료 (리비전 00158)
- ~~카테고리 7개 교체~~ → 완료 + Firestore 마이그레이션
- ~~monkos-ai 레포 Public 전환~~ → 완료 (히스토리 클린)
- ~~JA 번역 이슈~~ → 프롬프트 수정 + 번역 검증 로직 추가
- ~~썸네일 미리보기~~ → WYSIWYG DOM 직접 파싱으로 수정
