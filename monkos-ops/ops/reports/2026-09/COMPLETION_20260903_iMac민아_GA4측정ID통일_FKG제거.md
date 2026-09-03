---
type: completion
date: 2026-09-03
device: iMac
agent: 민아
subject: "GA4 측정 ID 정본 통일 — 고아 ID G-FKG0CPTC14 제거, idphoto-kr JPZ 복귀 (prod 3 + 엣지)"
incident: INCIDENT_20260903_idphoto-kr_GA4측정ID_고아
portfolio: PF_IDPHOTO
related: PF_ANCHOR(G-M1), PF_PORTAL, PF_SPECS
status: prod 반영 완료 · 수신 실측 정합(실시간 도달 확인)
---

**[2026-09-03 12:35 KST]** iMac/민아 → 작가님

> [예외: 경로③] 작가님 12:28 "진행해"(새 사용자 턴) → 민아 직접 구현·배포. 규정 계층(references.md) 수정 포함 — 쌍아 사후 추인·개정 청구 대상.

## ✅ 원인 (INCIDENT 요약)
G-FKG0CPTC14는 작가님 계정 어디에도 없는 ID(09-03 관리 UI 실측: 계정 1·속성 1·Google 태그 3 = JPZ·C2H9·AW). 03-14 외부 분석 추정 삽입 → 06-14 KR 단독화 → **06-14~09-03 81일 idphoto-kr 이벤트 소실**(속성 실측 5월 667u → 8월 2u). 작가님 가설(구 구글 계정 잔재)은 열려 있음 — 다른 로그인·Google Ads 연결 확인은 작가님 잔여.

## ✅ 구현 — 커밋 `e4a791a5` (31파일)
| 대상 | 변경 |
|---|---|
| idphoto-kr 12 HTML | 로더 `gtag/js?id=` + `gtag('config')` + user_id config 3곳 → **G-JPZWSJ3323** |
| studio 11 HTML · portal 6 HTML | `gtag('config','G-FKG0CPTC14')` 라인 삭제 (JPZ 로더·config 유지) |
| `portal/lib/cms/render-shell.js` | FKG config 세그먼트 제거, AW(`GOOGLE_ADS_CONVERSION_ID`) 템플릿 연속 보존 |
| `portal/lib/payments.js:1012` | 죽은 `/toss-success` HTML 내 FKG config 제거 |
| `.claude/rules/references.md` | **GA4 측정 ID 정본** 섹션 신설(속성·스트림·태그 3·FKG 고아·실측 규칙) |

소스 잔여 FKG **0**(`specs-ssg/dist` 2,580파일은 산출물 → 엣지 재배포로 갱신). 이중 로더 0. jest 64/64(사전 실패 3 suite 동일, 별건).

## ✅ 배포 · 라이브 판정 (2회 히트 2차, 대조군 = 배포 전 FKG 잔존)
| 표면 | 배포 전 | 배포 후 | rev |
|---|---|---|---|
| idphoto-kr `/` · `/result.html` | FKG 5 · JPZ 0 | **FKG 0 · JPZ 로더 1** | `monkos-idphoto-kr-00207-dr4` |
| studio `/index.html` | FKG 1 | **FKG 0 · JPZ 2** | `monkos-studio-00025-bcg` |
| portal `/credits` | FKG 1 | **FKG 0 · JPZ 2** | `monkos-portal-00559-n4f` |
| 정적 specs `/specs/passport/kr` · `/en/specs/passport/us` | FKG 1 | **FKG 0 · JPZ 2** | 엣지 해시 cc934b93, 스모크 4/4 + 어서션 3/3 |
| **portal 홈 `/`** | FKG 1 | 엣지 캐시 구본 **FKG 1**(오리진 직행 0) | CMS SWR 10분 TTL 경과 후 자연 갱신 → **FKG 0 · JPZ 2** 확인(2026-09-03 12:42 KST) |

health 3/3 200. portal deploy.sh 드리프트 없음(SSG rev e4a791a5).

## ✅ 수신 실측 (204가 아니라 속성 도달로 판정)
- 브라우저 페인 실방문 2회(idphoto-kr `/`, `/prep.html`, webdriver=false): 로더 JPZ + `collect tid=G-JPZWSJ3323`, dataLayer config JPZ 단독, FKG 발화 0
- 속성 실시간: 브라우저 페인 방문분은 실시간·당일 리포트에 미도달(페인 네트워크 격리로 판정 — collect 엔트리 status 0·transfer 0, 도구 한계이지 코드 문제 아님). 대체 실측 = **합성 page_view 1건**(tid=JPZ, dl=idphoto-kr.monkos.ai, dt=GA_RECEPTION_TEST_idphoto-kr) curl 송신 204 → **실시간 리포트 `GA_RECEPTION_TEST_idphoto-kr` 1행 도달**(2026-09-03 12:37 KST, 양성 대조군 monkos.ai 타이틀 3행 병존). 즉 JPZ 태그 + idphoto-kr 호스트 조합이 속성 521406894에 수신됨. 실고객 이벤트는 익일 브리핑 host별 표로 최종 확인

## ⏳ 잔여
1. ~~FKG 정체 확인~~ ✅ 2026-09-03 12:50 KST — Ads 자동 생성 계정 382573166의 속성 527549580 확정, SA 뷰어 부여, 81일치 회수 실측(generate_click 28u·purchase 2). INCIDENT 정정 추기
2. ~~portal 홈 엣지 캐시 재확인~~ ✅ 2026-09-03 12:42 KST FKG 0
3. 익일 브리핑 host별 퍼널 표에 `idphoto-kr.monkos.ai` 행 복귀 확인
4. 쌍아 사후 추인: 경로③ 실행 + references.md 규정 계층 수정 개정 청구

## 💡 교훈 (메모리 `project_ga4_measurement_id_canon` 반영)
- 식별자는 관리 UI·Admin API 실측 전 코드 삽입 금지. 외부 분석(철창이)의 ID는 후보일 뿐
- collect 204 ≠ 수신. 수신 속성 실데이터가 유일한 증거
- 감사 보고서의 "확인 TODO" 미이행 상태에서 수정을 실행하면 감사가 사고를 확정한다
