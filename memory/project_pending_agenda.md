---
name: project_pending_agenda
description: 미결 어젠다 — 즉시 실행 대기 / 기안 검토 대기 / 장기 로드맵 항목 (2026-03-18 12:41 갱신)
type: project
---

# 미결 어젠다

## 즉시 실행 대기

1. **FAQ EN/JA Firestore 시딩** — KO 13건 완료, EN/JA 번역 파일 준비 완료(`~/Desktop/works/portal_v4/`), **시딩 스크립트 EN/JA 확장 + 실행 필요**
2. **GitHub Issue 자동 게시 (파이프라인 Phase 1)** — PAT 미발급, translate.js에 GitHub API 코드 0건, 가장 빠르게 착수 가능
3. **블로그 카드 버그 확인** — 에디터 리뉴얼에 흡수 추정이나 data-slug 수정 + /blog 라이트 테마 적용 여부 별도 점검 필요 (코웍이 3/15 지시)
4. **크롤링 파이프라인 네이버 실행** — `importer/naver.js` 코드 존재, note.com 완료, **네이버 4카테고리 미실행**

## 기안 검토 대기

5. **콘텐츠 자동 배포 파이프라인** — `monkos-ops/ops/proposals/PROPOSAL_20260316_콘텐츠자동배포파이프라인.md`
   - 작가님 결정 4건 미응답 상태
   - Phase 1~5 설계 완료, 코드 0건

6. **블록 에디터 통합** — `monkos-ops/ops/proposals/PROPOSAL_20260316_블록에디터통합_기안서.md`
   - Phase A~C, 코드 0건, 현행 Toast UI 유지

7. **GEO Phase 2+** — `monkos-ops/ops/proposals/PROPOSAL_20260316_GEO_GitHub공개레포_전략.md`
   - ~~Phase 1~~ 완료 (출입증 6건, `portal-00163`)
   - Phase 2: 이슈 콘텐츠 7건 미게시 (1건만 존재) + 정기 활동 미착수

8. **에피소드 카탈로그 + 연구노트 체계** — 막내3 카탈로그 v1 완료 (**42건** 추출)
   - 3중 활용: ① 블로그 ② GitHub 소재 ③ 연구개발서
   - 보고서: `REPORT_20260317_에피소드카탈로그_v1.md`
   - 쌍아 직접수정 프로토콜 법체계 반영 필요 (별도)

9. **MINA PROJECT** — 코웍이 종합기획서 클론 완료, **작가님+용아 검토 대기**

10. **문서 체계 v2 — 통합 스키마 + 프로젝트 코드 체계** — 기안서급 설계 필요
   - **파일명 스키마**: `TYPE_DATE_[PROJECT]_수발신_내용.md` — 코드 유무로 탐색/실행 단계 구분
   - **YAML frontmatter**: type, project, from, to, date, scope, version, status 통일
   - **프로젝트 코드 라이프사이클**: 어젠다(코드없음) → 기안서 → 코드 발번 심사(신규코드 or 기존 브랜치 귀속) → 실행 문서에 코드 삽입
   - **문서 유형**: ORDER, REPORT, PROPOSAL, CONFIRM, BRIEFING, SESSION, CATALOG
   - **세션로그 연동**: 세션 내 project 태그로 역추적
   - **팀웍스 동일 스키마**: 코웍이·한·꾸 문서도 통합 필터
   - **법률 ch4 개정 연동**
   - 함께 처리: 세션 시작/마감 프로토콜 갱신, 쌍아 직접수정 프로토콜 법률 반영

## 장기 로드맵

11. **팀웍 레포 분리 + 데몬 세팅** — works/ 서브레포 분리, fswatch 데몬, 현행 클론 안정 후. ⚠️ symlink 불가(코웍이 마운트 제약), rsync 양방향 머지만 허용(--delete 금지, 2026-03-18 사고)
12. **포털 홈 블록 분리 리팩토링** — Phase 0~1 완료 (CSS 1280px, 갤러리 Firestore), **Phase 2~7 미착수**
13. **어드민 블록 에디터 UI** — v4 Phase 6~7, #6과 합류
14. **크롭앱 특허 출원** — FaceMesh 기반 ICAO 규격 자동 검증 + 클라이언트 전용 처리. **기술 명세서 초안 완료** (`works/crop/SPEC_20260318_MONKOS_크롭앱개발기.md`) → 변리사 연결. 디딤돌 R&D 연동
15. **내부 스튜디오 앱** — idphoto-kr 기반 독립 배포 (`monkos_AI/studio/`). **v2 Phase A 완료** (SPA 3컬럼+퍼널 복원). 영유아 프롬프트 95%/5% 확립 — 케이스별 이터레이션 계속 필요. Phase B(T2I→I2I 듀얼) 미착수
16. **영유아 I2I 프롬프트 세밀화** — 95%/5% 방향 확립 (v2), 성인 정본 클론 후 idphoto-kr 반영 예정. 케이스별 결과 편차 큼 → Studio에서 지속 테스트

## 완료 처리 (2026-03-18)

- ~~Search Console 404 해소~~ → /pricing 정적페이지 + /guide SSR + /crop sitemap 등록 (커밋 `6d6eb86`, dev 배포 완료, **prod 배포 승인 대기**)
- ~~크롭앱 개발기 명세서~~ → `works/crop/SPEC_20260318_MONKOS_크롭앱개발기.md` 작성 완료 (블로그+특허 기초)
- ~~works 공유 채널 통일~~ → MEMORY 규정화 완료, 로컬 클론 동기화 규정 제정

## 완료 처리 (2026-03-17)

- ~~블로그 에디터 WYSIWYG 리뉴얼~~ → 에디터 1~4차 완료 (리비전 00158)
- ~~카테고리 7개 교체~~ → 완료 + Firestore 마이그레이션
- ~~monkos-ai 레포 Public 전환~~ → 완료 (히스토리 클린)
- ~~JA 번역 이슈~~ → 프롬프트 수정 + 번역 검증 로직 추가
- ~~썸네일 미리보기~~ → WYSIWYG DOM 직접 파싱으로 수정
- ~~GEO Phase 1 출입증 6건~~ → M1/막내1 완료 (portal-00163)
- ~~어드민 Google 로그인 + 포털 복귀 버튼~~ → 쌍아 직접수정 + 막내1 배포 (portal-00164)
- ~~증명앱 SEO hreflang+JSONLD~~ → 실코드 전수 확인 완료 (idphoto-kr/jp 양쪽)
- ~~magcard 썸네일 + 메인 썸네일~~ → 포털버그 3건에 통합 처리 (portal-00162)
