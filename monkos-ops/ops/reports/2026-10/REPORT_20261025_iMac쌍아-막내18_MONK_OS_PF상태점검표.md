---
type: report
date: 2026-10-25
device: iMac
agent: 쌍아-막내18
status: 완료 (결정 대기 — 작가님)
portfolio: PF_MONK_OS
order: monkos-ops/ops/orders/2026-10/ORDER_20261025_iMac쌍아_막내18_MONK_OS_PF상태점검표.md
---

**[2026-10-25 13:42 KST]** iMac/쌍아-막내18 → iMac/쌍아 (→ 작가님 결정)

# REPORT — active PF 상태 점검표

> 출처: 작가님 2026-10-25 13:38 KST iMac 쌍아 세션 사람 턴 "진행해" → 쌍아 지시서(위 `order:`). **읽기 전용 작업 — PF README·인덱스·status 필드 수정 0건.** 상태 변경 결정은 작가님.

## 요약

- **실측 active PF = 33개** (`PF_*/README.md` YAML `status: active`. 그 외 completed 2 = PHOTOPRO·BRIEF, draft 1 = FACTORY, 템플릿 1).
- **제안별 개수: active 유지 21 · paused 7 · completed 1 · 작가님 확인 4** (확인 4 = EVENT 시한 종료, PRESENTATION·VIDEO 범위 중복, STYLER 메타 유지 여부).
- **500줄 초과 PF README = 0개.** 최대 PF_CDP 465줄(임계 근접), 다음 PF_PORTAL 369·PF_AUTOPILOT 354. 히스토리 날짜 비표준 PF = 지시서의 6개 + 혼용 6개 + 경미 5개(§3).

## 1. 점검 방법

- **마지막 실제 활동** = 다음 넷 중 가장 늦은 날: ⓗ 히스토리 최신 행(`scripts/pf.sh query --status active`) / ⓖ `git log -1 -- PF폴더` / ⓓ `portfolio:`로 그 PF를 단 문서의 파일명 최신 날짜(monkos-ops·governance 전수 스캔, portfolios 폴더 제외) / ⓒ 관련 코드 경로 최신 커밋.
- **실제 활동이 아닌 커밋은 빼고 판정했다.** 일괄 작업 커밋(예: 09-01 배포 가드레일 G1~G6 일괄, 09-30 연락처 일괄 치환, 10-01 도구 전수조사 후속, 10-22 평문 env 제거)은 PF 작업이 아니라 전역 정리라서 근거로 쓰지 않았고, 비고에 따로 적었다. 10-14 웹 민아 세션 로그의 PF 언급은 Stop 훅 경고 집계(적체 목록)라서 활동으로 세지 않았다.
- 경과일 기준일 = 2026-10-25.

## 2. 점검표 (33행)

| PF | 현재 status | 마지막 실제 활동(일자·근거) | 제안 | 근거 | 비고(형식·줄 수) |
|---|---|---|---|---|---|
| PF_ANCHOR | active | 10-20 ⓖ(PF_LITIGATION 분리 행) · ⓗ 10-20 | active 유지 | 사진관 엔드게임 정본, 2027-05 시한 진행 중 | MM/DD · 220줄 |
| PF_AUTOPILOT | active | 10-22 ⓗⓖⓓ(헤드리스 브리핑 2단계) | active 유지 | 10-22 launchd 설치, 첫 실기동 결과 미실측 | MM/DD · 354줄 |
| PF_CDP | active | 10-25 ⓗⓖ(tygem 사이트 카드) | active 유지 | 당일 활동 | MM/DD · **465줄(500 임계 근접)** |
| PF_CHATBOT | active | 06-02 ⓗⓖ(현행성 검증) · ⓒ chat-engine.js 05-31 | **completed** | Phase 표 전 항목 ✅(Workers/Gemma4+D1 전환·E2E), 잔여 3건은 "향후" 목록뿐, 145일 활동 0 | MM/DD · 261줄 |
| PF_CITADEL | active | 08-06 ⓖⓓ(엔티티 배선 지시·실측 정정) · ⓗ 07-26 | **paused** | Phase 0~2.4 ✅, 잔여(엔티티 SEO·CWV·간판 진단) 80일 정체. 10-01 민아 기록 "배포 대기·간판 진단 미결" | MM/DD 다수 + M/D 2행(7/19) + 비날짜 4행 · 193줄 |
| PF_CROP | active | 07-07 ⓗⓓ(BiRefNet-lite PoC) · ⓒ crop-app 04-30 | **paused** | Phase 1~2 ⏳·3 미착수, 110일 활동 0. crop-engine 09-01 커밋은 가드레일 일괄 | MM/DD + 첫 열 커밋 해시 4행 · 131줄 |
| PF_DESIGNLAB | active | 10-02 ⓗⓓ(소소 세션 시범 편성) · ⓖ 10-03 | active 유지 | 23일 전 시범 구성, Phase 전부 ⏳(착수 직후) | MM/DD · 106줄 |
| PF_DOCS | active | 05-06 ⓗ(HWPX 파이프라인 확립) · ⓖ 05-09 | **paused** | 172일 활동 0, 연결 문서 0. 파이프라인이 4060 경유인데 4060은 09-02부터 라인업 배제(메모리 기록, 이번 미실측) | MM/DD · 98줄 · 히스토리 2행 |
| PF_EVENT | active | 04-22 ⓗ(채널 에셋 실측) · ⓖ 05-15(폴더 구조 일괄) | **작가님 확인** (completed 후보) | 주제가 "5월 첫 결제 돌파" — 시한형이고 5월이 지났다. 186일 활동 0, 연결 문서 0. 결제 발생 여부는 이번에 대조하지 않음 | MM/DD · 116줄 |
| PF_FACEREAD | active | 08-02 ⓗⓖⓓⓒ(삼정 상대판정) | **paused** | Phase A ✅ prod(어드민 비공개), B는 작가님 톤 검수 대기·C는 공개 결정 대기. 84일 활동 0 | **MM-DD**(`07-24`) 11행 · 116줄 |
| PF_GO | active | 10-25 ⓗⓖ(PF 신설·31행 이관) | active 유지 | 당일 신설 | MM/DD · 86줄 · 아직 `portfolio:` 문서 0 |
| PF_IDPHOTO | active | 10-23 ⓗⓖⓓ(보정 적정성 판정기 제안) | active 유지 | 2일 전 활동 | MM/DD + 범위 표기 11행(`02/01~14`) · 291줄 · 히스토리 표가 6개로 나뉘어 pf.sh가 3행만 셈 |
| PF_IMAGE_PRO | active | 08-27 ⓗⓓ(Imagen4 폐지 복구·429 원인) · ⓖ 09-02 | active 유지 | 운영 중 서비스(image.monkos.ai, 꾸 상시 사용 — references.md). 개발 활동은 59일 없음. 코드 10-01 커밋은 전수조사 후속 | **YYYY-MM-DD** 16행 · 144줄 |
| PF_INFRA | active | 10-24 ⓗⓖⓓ(E11 시각 헤더 훅) | active 유지 | 1일 전 활동 | MM/DD · 271줄 |
| PF_KKU | active | 10-25 ⓗⓖ(인화 주문 수정) · ⓒ MONK_kr 10-25 | active 유지 | 당일 활동 | MM/DD · 273줄 |
| PF_LITIGATION | active | 10-20 ⓗⓖ(PF 신설·기록 열람) | active 유지 | 진행 중 소송(기일 대응) | **YYYY-MM-DD** 14행 + YYYY-MM 4행 + MM/DD 1행 혼용 — 히스토리에 사건 경과일(2020~)이 섞임 · 215줄 · `portfolio:` 문서 0 |
| PF_MARKET_EYE | active | 10-06 ⓗⓖⓓ(네이버 플레이스 세팅 자료) | active 유지 | 19일 전 활동 | MM/DD · 171줄 |
| PF_MONK_OS | active | 10-25 ⓗⓖⓓ(본 지시서) | active 유지 | 당일 활동 | **YYYY-MM-DD** 110행 · 300줄 |
| PF_MUSE | active | 09-30 ⓗⓓ(전략회의실 업계 현황 REPORT) · ⓒ debate 05-11 | active 유지 | 25일 전 REPORT, 결정 4건(M1~M4) 대기. 09-30 PF 폴더 커밋은 연락처 일괄 치환 | MM/DD + `01/~` 1행 · 145줄 |
| PF_OPUS | active | 10-22 ⓗⓖ(데일리 E2E 콘텐츠) | active 유지 | 3일 전 활동 | MM/DD · 258줄 |
| PF_PARTNER | active | 07-13 ⓗⓖ(인화 유통 카테고리 등재) · ⓓ 06-17 | **paused** | 인크루트 재회신 대기·엔타이틀먼트 단위 작가님 대기 등 외부·결정 대기만 남음, 104일 활동 0 | **YYYY-MM-DD** 13행 · 186줄 |
| PF_PORTAL | active | 09-26 ⓗⓖⓓ(리뷰 배지 분리 prod) · ⓒ portal 10-23(바둑 PoC 카드 — PF_GO 소관) | active 유지 | 운영 중 허브 서비스, 29일 전 PF 활동 | MM/DD + 첫 열 커밋 해시 5행 · 369줄 |
| PF_PRESENTATION | active | 05-17 ⓗⓖ(SwiftUI 애니메이션 인사이트) | **작가님 확인** (paused 또는 PF_VIDEO와 병합) | 161일 활동 0, Phase 표 항목 ✅. 5/17 히스토리 행이 PF_VIDEO와 사실상 동일(범위 중복). pt.monkos.ai 인프라 미상(references.md) | MM/DD · 273줄 · `portfolio:` 문서 0 |
| PF_PROFILES | active | **09-20 ⓒ**(headshot.js 결제 동선 수정) · ⓗⓖⓓ 06-22 | active 유지 | 헤드샷 라이브·09-20 결제 수정 커밋이 있으나 **PF 히스토리 미기재**. Phase 표는 아직 "⏳ 설계" 상태로 현행과 어긋남 → 현행화 필요 | MM/DD · 164줄 |
| PF_RETRIEVAL | active | **09-27 ⓒ**(임베딩 캐시 사이드카 수정) · ⓗⓓ 07-20 | active 유지 | 09-27 코드 활동(검색 스모크·OR 폴백 등 references.md 기재)이 **PF 히스토리 미기재**. 이번 세션에서 monk-retrieval MCP 연결 실패(CONNECTION_CLOSED) 관측 | MM/DD · 68줄 |
| PF_RND | active | 10-25 ⓗⓖⓓ(바둑 PF_GO 이관) | active 유지 | 당일 활동 | MM/DD · 190줄 |
| PF_SECURITY | active | 10-22 ⓗⓖⓓ(평문 시크릿 SM 전환 중단 보고) | active 유지 | 결정 4건 대기 중 | **YYYY-MM-DD 19행 + MM/DD 33행 혼용** · 191줄 |
| PF_SPECS | active | 10-08 ⓗⓖⓓ(캐나다 비자 규격 정정) | active 유지 | 핵심 운영 표면, 17일 전 활동 | MM/DD + `07/17-18` 1행 · 130줄 |
| PF_SPREAD | active | 10-24 ⓗⓖ(CDP 사이트 카드 방향) | active 유지 | 1일 전 활동 | MM/DD + M/D 1행(`5/10`) · 133줄 |
| PF_STUDIO | active | 06-17 ⓗⓓ · ⓖ 06-21 · ⓒ studio 10-22(env 일괄 제거 — 활동 아님) | **paused** | 모델 스왑·모드 분기 등 ⏳/❌ 다수, 130일 PF 활동 0 | **M/D 6행 + `3/6~7` 1행 + MM/DD 9행 혼용** · 154줄 |
| PF_STYLER | active | 07-12 ⓖⓓ(특허 기술 리서치) · ⓗ 07-10 | **작가님 확인** (메타 PF로 유지 또는 paused) | 증명→헤드샷→모델스→커머스 진화 로드맵 메타 PF. 하위 중 VTON·STUDIO 정지, 107일 활동 0. 메타 PF는 하위와 Phase 독립(ch4 9조 7항)이라 유지 판단은 작가님 | **YYYY-MM-DD** 6행 + `2026-01~` 등 2행 · 178줄 |
| PF_VIDEO | active | 05-17 ⓗⓖ(SwiftUI 애니메이션 인사이트 — PRESENTATION과 동일) | **작가님 확인** (paused 또는 PF_PRESENTATION과 병합) | 161일 활동 0, 연결 문서 0. 기술 자산 다수가 4060 PoC(SadTalker·LivePortrait) — 4060 배제 중 | **M/D 10행**(`4/26`) + MM/DD 1행 · 191줄 · `portfolio:` 문서 0 |
| PF_VTON | active | 10-01 ⓗ(RunPod pod 부재 실측) · ⓒ lib/vton 06-09 | **paused** | 파이프라인 전제가 4060 로컬 CatVTON인데 4060 배제(09-02 메모리), RunPod pod 0개(10-01 실측). 개발 활동 06월 이후 없음 | **YYYY-MM-DD** 10행 · 84줄 |

> "제안 = paused" 7건: CITADEL·CROP·DOCS·FACEREAD·PARTNER·STUDIO·VTON. "completed" 1건: CHATBOT.

## 3. 히스토리 날짜 형식 차이 (고치지 않음)

표준 = `| MM/DD |`. pf.sh query에서 마지막 날짜가 `08-02`(FACEREAD)·`5/17`(VIDEO)처럼 연도 없이 나와 경과일이 `—`가 되는 원인이 이것이다.

- **지시서 명시 6개**
  - PF_FACEREAD — `MM-DD`(하이픈) 11행 전부
  - PF_IMAGE_PRO — `YYYY-MM-DD` 16행 전부
  - PF_MONK_OS — `YYYY-MM-DD` 110행 전부
  - PF_PARTNER — `YYYY-MM-DD` 13행 전부
  - PF_STYLER — `YYYY-MM-DD` 6행 + `2026-01~` 같은 범위 2행
  - PF_VTON — `YYYY-MM-DD` 10행 전부
- **추가 발견 6개(혼용·부분) + 경미 5개**
  - PF_VIDEO — `M/D`(0 없음) 10행 + MM/DD 1행
  - PF_STUDIO — `M/D` 6행 + `3/6~7` 1행 + MM/DD 9행
  - PF_SECURITY — `YYYY-MM-DD` 19행 + MM/DD 33행
  - PF_LITIGATION — `YYYY-MM-DD` 14행 + `YYYY-MM` 4행 + MM/DD 1행 (사건 경과일과 PF 활동이 한 표에 섞임)
  - PF_CITADEL — `M/D` 2행 + 날짜 아닌 첫 열 4행
  - PF_IDPHOTO — 범위 표기(`02/01~14`) 11행, 히스토리 표가 6개로 나뉨(pf.sh가 마지막 표 3행만 셈)
  - 경미 — PF_SPREAD `5/10` 1행 · PF_SPECS `07/17-18` 1행 · PF_MUSE `01/~` 1행 · PF_CROP 4행·PF_PORTAL 5행은 첫 열이 커밋 해시

## 4. 500줄 초과 PF (ch4 9조 아카이브 트리거)

- **README 기준 0개.** 근접: PF_CDP 465 · PF_PORTAL 369 · PF_AUTOPILOT 354.
- 폴더 안 다른 파일 최대: PF_CROP/ARCHIVE_PHASES.md 490 · PF_CDP/SPREAD_DEPLOY_MANUAL.md 475 · PF_SPREAD/SPREAD_DEPLOY_MANUAL.md 473 (CDP·SPREAD에 같은 이름 매뉴얼이 따로 있음 — 정본 단일 원칙(헌법 3조 4항) 대조 대상, 이번엔 내용 비교 안 함).

## 5. 함께 본 것 (결정 재료)

- **PF 히스토리 미기재 실제 활동 2건**: PROFILES(09-20 headshot.js 결제 수정), RETRIEVAL(09-27 retrieval 수정). active 유지 제안은 이 코드 활동이 근거다.
- **확인 못 한 것**: EVENT의 목표(첫 결제) 달성 여부, 4060 현재 상태(메모리 09-02 기록만 인용, 이번 미실측), CDP·SPREAD 매뉴얼 중복의 내용 차이.
- **자동 링크**: 이 보고서는 `portfolio: PF_MONK_OS`를 달았기 때문에 Write 훅이 PF_MONK_OS 히스토리에 링크 1행을 자동으로 붙일 수 있다(ch4 9조 원장 도구 규정). 내가 손으로 고친 PF README는 없다.

## 6. 작가님 결정 항목

1. paused 7건(CITADEL·CROP·DOCS·FACEREAD·PARTNER·STUDIO·VTON) 일괄 전환 여부
2. CHATBOT completed 전환 여부
3. 확인 4건: EVENT(completed?) · PRESENTATION+VIDEO(병합? 각각 paused?) · STYLER(메타로 유지? paused?)
4. 날짜 형식 12개 PF(경미 5개 제외) 정규화를 별건 지시로 낼지(쌍아 판단)
