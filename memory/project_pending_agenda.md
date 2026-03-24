---
name: project_pending_agenda
description: 미결 어젠다 — 즉시 실행 대기 / 기안 검토 대기 / 장기 로드맵 항목 (2026-03-23 14:55 갱신)
type: project
---

# 미결 어젠다

## 즉시 실행 대기

1. **FAQ EN/JA Firestore 시딩** — KO 13건 완료, EN/JA 번역 파일 준비 완료(`~/Desktop/works/portal_v4/`), **시딩 스크립트 EN/JA 확장 + 실행 필요**
2. **GitHub Issue 자동 게시 (파이프라인 Phase 1)** — PAT 미발급, translate.js에 GitHub API 코드 0건, 가장 빠르게 착수 가능
3. **블로그 slug 버그** — Phase 0에서 AI 자동생성(한국어→Gemini 영문 slug) 도입. /blog 라이트 테마 적용 여부 별도 점검 필요
4. **크롤링 파이프라인 네이버 실행** — `importer/naver.js` 코드 존재, note.com 완료, **네이버 4카테고리 미실행**

## 기안 검토 대기

5. **콘텐츠 자동 배포 파이프라인** — `monkos-ops/ops/proposals/PROPOSAL_20260316_콘텐츠자동배포파이프라인.md`
   - 작가님 결정 4건 미응답 상태
   - Phase 1~5 설계 완료, 코드 0건

6. **블록 에디터 통합** — `monkos-ops/ops/proposals/PROPOSAL_20260316_블록에디터통합_기안서.md`
   - ~~Phase 0~~ ✅ 완료 (`a6f63d5`, 2026-03-23) — 15블록 Firestore 데이터 레이어 + 어드민 편집 UI + i18n 52% 경량화
   - **Phase 1 방향 탐색 중** — 블록 내 스타일 프리셋 강화 (글래스모피즘, 호버 이펙트, 매거진풍 등 원클릭 적용). 피그마/캔바/아임웹 벤치마킹으로 아이디어 축적 → #11에 수렴
   - 사파리 Reader Mode 이슈 해결 (FAQ 프리뷰 80자 truncate)
   - 우측 사이드바, SNS 공유카드 등 블록 추가 잔여

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

11. **블록 에디터 Phase 1+ 아이디어 축적** — 피그마/캔바/아임웹 등 벤치마킹 → 가닥 잡히면 Phase 1 설계 착수
    - **[UX]** 피그마형 자유 배치 ❌ → 박스 구조 유지 + 블록 내부 풍성화 ✅ (작가님 방향 확정)
    - **[스타일]** CSS 프리셋 내장 — 전문가 결과물을 버튼 하나로 ("즉시 효능감")
    - **[자산화]** 꾸 피그마 학습 완료 시 → 블록별 Figma 컴포넌트 정리 → 외부 납품용 시안 메뉴판
    - **[블록]** 우측 사이드바, SNS 공유카드, 프라이싱 테이블 등 블록 유형 확장
    - **[납품]** 홈페이지 제작 업무 시 Figma 시안 납품 체계 필요 (꾸 담당)
    - 태그 분류: `[스타일]` `[인터랙션]` `[블록]` `[UX]` 로 수집
12. **~~팀웍 레포 분리~~+ 데몬 세팅** — ✅ monkos-works 완료 (2026-03-19). **잔여**: M2 Claude Desktop+uv+MCP (접속 후), M1 origin-works 등록 (귀가 후), fswatch 데몬 (안정화 후)
13. **포털 홈 블록 분리 리팩토링** — ~~Phase 0~1~~ → #6 Phase 0에 통합 완료 (15블록 전환). **잔여 Phase 2~7**: 개별 블록 고도화
14. **~~어드민 블록 에디터 UI~~** — #6 Phase 0에 흡수 (layout.html 카테고리 탭 4개 + 14블록 편집 모달 완성)
15. **크롭앱 특허 출원** — FaceMesh 기반 ICAO 규격 자동 검증 + 클라이언트 전용 처리. **기술 명세서 초안 완료** (`works/crop/SPEC_20260318_MONKOS_크롭앱개발기.md`) → 변리사 연결. 디딤돌 R&D 연동
16. **내부 스튜디오 앱** — idphoto-kr 기반 독립 배포 (`monkos_AI/studio/`). **v2 Phase A 완료** (SPA 3컬럼+퍼널 복원). 영유아 프롬프트 95%/5% 확립 — 케이스별 이터레이션 계속 필요. Phase B(T2I→I2I 듀얼) 미착수
17. **영유아 I2I 프롬프트 세밀화** — 95%/5% 방향 확립 (v2), 성인 정본 클론 후 idphoto-kr 반영 예정. 케이스별 결과 편차 큼 → Studio에서 지속 테스트

## 완료 처리 (2026-03-23)

- ~~블록 에디터 Phase 0~~ → 15블록 Firestore 데이터 레이어 + 어드민 편집 UI 완성 (`a6f63d5`). index 400줄 이하, 엔진 분리 양호
- ~~사파리 Reader Mode 이슈~~ → FAQ 프리뷰 80자 truncate로 해결 (Phase 0 핫픽스)
- ~~포털 홈 i18n 전면 보강~~ → FAQ·사이드바·크레딧·푸터·태그 다국어 대응 (`0e67f4d`)
- ~~pricing SSR 전환~~ → KR/JP/EN 리전별 통화·가격 다국어 (`07500af`)
- ~~FAQ 프리뷰 컬렉션명 + 태그 regex 핫픽스~~ → `2531feb`
- ~~i18n 섹션 타이틀 밀림 버그~~ → 인덱스→ID 기반 매핑 전환 (`ac89bc3`)
- ~~메인페이지 리디자인~~ → 서비스카드 강화 + FAQ/게시판 추가 + 기안서 v2 (`82d1a99`)
- ~~YouTube 리브랜딩 + 5채널 배포 파이프라인~~ → 민아 3/22 완료
- ~~어드민 블록 에디터 UI (#13)~~ → #6 Phase 0에 흡수 완료

## 완료 처리 (2026-03-19)

- ~~monkos-works 레포 생성 + subtree 연결~~ → M1 새벽 완료
- ~~M4(한) works 클론 + 코웍이 세팅~~ → PAT 공유, 클론+전역지침 완료. 코웍이 세션 로그 push 확인
- ~~M2(꾸) works 클론~~ → PAT 세팅+클론 완료. 전역지침 push 완료
- ~~mk-push/pull 스크립트~~ → `scripts/mk-push.sh`, `scripts/mk-pull.sh` 작성+iMac 세팅 완료
- ~~works subtree 운용 규정~~ → MEMORY 규정화 완료 (삭제 금지, 스크립트, 명령체계)
- ~~M1 git MCP 연결~~ → 코웍이 본진 직접 조회 가능 (M1 새벽)

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
