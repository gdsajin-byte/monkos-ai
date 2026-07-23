---
type: completion
date: 2026-07-24
device: iMac
agent: 민아
status: 완료
portfolio: PF_SPECS
---

# COMPLETION — 모바일 컨테이너 잘림 + 블로그 vol36 서식 (긴급 수선 2건)

**[2026-07-24 04:39 KST]** iMac/민아 → 작가님

> 지시서: [ORDER_20260724_iMac쌍아_민아_SPECS_모바일컨테이너_블로그서식.md](../../orders/2026-07/ORDER_20260724_iMac쌍아_민아_SPECS_모바일컨테이너_블로그서식.md)
> 배포: dev 검증 → **prod monkos-portal-00534-nbg** 트래픽 100%

---

## 건 1 — 모바일 잘림: 진범 재특정 (지시서 후보 2파일은 무혐의)

**실측 진단** (라이브 375px, uk-visa·홈·headshot 3페이지 오버플로 전수 스캔):
- 지시서 후보였던 `.v2-attire-cards`(2×2 그리드)와 spec-hero.js(이미지 없음)는 **무혐의**. 퍼널 전 단계(업로드→핏→결제, 실사진 구동 재현) 오버플로 0.
- **진범 = `header-nav` 오버플로** (전 셸 페이지 공통): 어제 Phase 4a 네비 개편 후 375px에서 nav가 455~479px까지 확장 — "ID Photo" 2줄 랩·Blog 잘림·Guide 소실.
- **증상 2건이 전부 이 한 버그인 메커니즘**: 크롬 에뮬은 `html{overflow-x:hidden}`이 캔버스를 375로 클립하지만, **iOS Safari는 body/html의 overflow-x:hidden을 무시하고 캔버스를 479px로 확장** → 페이지 전체가 우측 팬 되며 히어로 인물사진(도해)·카드류가 "우측으로 빠져 잘려" 보임. 작가님 아이폰 스크린샷의 두 증상은 이 캔버스 확장의 파생.

**처방** ([render-shell.js](../../../monkos_AI/portal/lib/cms/render-shell.js)):
1. `html, body { overflow-x: clip }` 추가 — clip은 iOS에서도 캔버스 확장을 원천 차단(스크롤 컨테이너 미생성이라 sticky 무영향). 이 한 줄이 **"한 요소의 오버플로가 페이지 전체를 깨는" 버그 계열 전체를 사이트 전역에서 봉쇄** (지시서의 "다른 기능 커버" 항).
2. 모바일(≤640px) 헤더: header-top 랩 허용 + 네비 랩 + 링크 nowrap/축소 — 로고 행 + 네비 행, **5항목 전부 가시**.

**검증** (지시서 기준: 375·390px 잘림 0):
| 게이트 | 결과 |
|--------|------|
| prod uk-visa 375px 오버플로 요소 | **0** (docW 375, headerScrollW 375) |
| prod 390px | **0** |
| 네비 5항목 가시성 | ID Photo:78 · Headshot:152 · Pricing:210 · Blog:255 · Guide:308 — 전부 뷰포트 내 |
| 회귀 — 데스크톱(1280) 헤더 | 단일 행 유지, 변화 없음 (스크린샷 확인) |
| 회귀 — 셸 소비 페이지 | /blog·/guide·/pricing·/specs 200 |
| 회귀 — 홈 | 자체 네비(mk-nav)로 무접촉 — 기존 정상 상태 유지 실측 |

## 건 2 — vol36: 라이브 실측으로 처방 재정렬 (지시서 전제 일부 낡음)

**착수 전 실측** — 지시서의 7/18 진단 이월분과 현재 라이브가 다름:
- **KO /blog/vol36은 이미 클린** (7/14 재작성 반영: 서식 정상·canonical·og:image=배너 v2·-kr 301 기완료). 지시서 처방 1·2·4는 KO에 대해 기이행 상태.
- **실제 깨진 문 3종 발견**: ① 중복 포스트 `can-i-wear-glasses-for-my-resume-photo`(ko/en/ja, 4/28 생성, vol36과 동일 제목, h6 핵 30개, published) — **작가님이 본 깨진 페이지의 실체** (SERP 4.5위 문) ② vol36-en/ja — h6 핵 30개씩 구서식 ③ EN/JA 전부 구 배너(구 타이틀 각인) 참조.

**처방 실행**:
1. **문 통합**: 중복 3건 unpublish + [redirects.js](../../../monkos_AI/portal/lib/cms/redirects.js) BLOG_REDIRECTS 6행(무접미 3 + 접미형 3, 체인 방지 직행) → **301 → vol36 (언어 보존)**. 사이트맵에서 중복 3 URL 소멸 실측.
2. **EN/JA 서식 기계 정정**: h6 핵 30건씩 → h3 (신규 스크립트 [fix_vol36_cluster.js](../../../monkos_AI/portal/scripts/fix_vol36_cluster.js), dry-run→apply, reslug_blog.js 전례 준용). 라이브 `######` 노출 3언어 전부 0 실측.
3. **lastmod 갱신**: vol36 3언어 updatedAt 갱신 → sitemap lastmod 2026-07-23(UTC) 반영 실측. (기존 4/27~4/28 정체 해소)
4. **GSC**: vol36 색인 실측 — PASS·정본 canonical 일치·최종 크롤 7/22. 사이트맵 API 재제출은 **403(권한)** — 작가님 UI 액션 1건으로 이관(아래).

**검증**: prod 301 4/4 (무접미 3언어 + -kr 직행) · vol36 3언어 200 + `######` 0 · 사이트맵 중복 0 · dev 게이트 선통과 후 prod.

## ⏳ 작가님 액션 (모바일에서 1분)

1. **GSC 색인 요청**: [Search Console URL 검사](https://search.google.com/search-console/inspect?resource_id=sc-domain:monkos.ai) → `https://monkos.ai/blog/vol36` → "색인 생성 요청" 탭. (API 미지원 — 1위+AI Overview 문서라 재크롤 가속 가치 큼)
2. 같은 화면에서 sitemap-blog.xml 재제출(선택 — lastmod 갱신으로 자연 재크롤도 동작).

## 별도 보고 — 배너 재제작 (지시서 ⚠️ 항)

- KO는 v2 배너 기적용. **EN/JA용 배너 2장**은 언어별 타이틀 각인이 필요한 이미지 생성 건 — 도구 즉시 가용치 않아 지시서 허용대로 별도 보고. 꾸/디자인 트랙 또는 이미지 생성 지시서로 처리 권요.

## 💡 관찰 (비차단)

- attire-picker 가로 스트립(`atp-strip`)은 스크롤바 은닉 + 부분 노출 카드 구조 — 의도된 스크롤 UX나 어포던스가 없어 "잘림"으로 오인될 소지. 다품목 국가(이력서류)에서 재현 여지 — 쉘/4b 시 엣지 페이드·스크롤 스냅 검토 권고.
- vol36-en/ja는 서식만 복구된 **구버전 본문**(3.6~5.7천자) — KO 7/14 재작성 수준의 EN/JA 재작성은 별도 콘텐츠 트랙.

## 변경 파일 · 산출물

| 구분 | 내용 |
|------|------|
| 코드 | render-shell.js (overflow clip + 모바일 헤더) · redirects.js (+6행) · scripts/fix_vol36_cluster.js (신규) |
| 데이터 | Firestore blog_posts 6건 (unpublish 3 · 서식+updatedAt 2 · updatedAt 1) |
| 배포 | dev 스모크 → **prod 00534-nbg** |
| 커밋 | `47615443` (+ 본 보고 커밋) |
