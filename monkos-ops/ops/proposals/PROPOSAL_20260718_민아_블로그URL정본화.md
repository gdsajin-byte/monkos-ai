---
type: proposal
date: 2026-07-18
device: iMac
agent: 민아
status: 제출
---

# PROPOSAL — 블로그 URL 정본화 (레코드 하나·문 두 개 봉합)

**[2026-07-18 19:02 KST]** iMac/민아 → 작가님, iMac/쌍아

> 어젯밤(07-18 01:34~01:43) 발견·원인 확정분의 실행 방안. 오늘 GSC 전수 실측으로 표면 확정.

## 1. 진단 (실측 완료)

**기전** — [render-blog.js:257-261](../../..//monkos_AI/portal/lib/cms/render-blog.js) blogPostFragment ko 경로:
```js
const docId = lang ? `${slug}-${lang}` : `${slug}-kr`;   // ① 레거시 -kr 키 조회
let doc = await blogCollection.doc(docId).get();
if ((!doc.exists || …) && !lang) doc = await blogCollection.doc(slug).get();  // ② 원형 폴백
```
- 레거시 레코드(docId `{slug}-kr`)는 문이 둘: `/blog/{slug}`(①) + `/blog/{slug}-kr`(②). 각자 self-canonical → 구글 분산 색인.
- 변종: `/blog/{slug}-en|-ja`도 ②가 해당 언어 레코드를 ko 경로로 서빙 (en 1건 색인 실증).
- 부수 실증: SEO_TITLE_OVERRIDES 키가 변형 슬러그(`vol38-ai-kr`·`ai-kr`)로 걸려 있음 — 변형 문을 전제로 한 패치 이력.

**표면** — GSC 28일(06-20~07-18) `/blog/.*-(kr|en|ja)$` 전수: **색인·노출 변형 URL 19건, 노출 253·클릭 6, 순위 5~16** (정본과 경합. glasses 건은 변형이 정본보다 상위였음). 특수 1건: `https:monkosaiadminblog-edithtml-kr` — **오염 레코드가 색인·클릭까지 발생** (별도 처분 필요).

## 2. 처방 — render-blog.js 소패치 1파일

| # | 조치 | 상세 |
|---|------|------|
| P1 | **변형 301** | ko 경로에서 slug가 `-(kr\|en\|ja)$` 매치 시 클린 베이스 레코드 존재 확인 후 301 — `-kr`→`/blog/{base}`, `-en/-ja`→`/{lang}/blog/{base}`(해당 언어 published 시, 아니면 ko 정본). 존재 확인 후 리다이렉트라 자연 슬러그 오탐 안전 |
| P2 | 폴백 존치 | ② 폴백은 raw 키 ko 레코드 서빙용으로 유지 — suffix형은 P1이 선차단 |
| P3 | 오버라이드 키 정정 | SEO_TITLE_OVERRIDES를 클린 슬러그 키로 |
| P4 | 오염 레코드 처분 | `https:monkosaiadmin…` 실체 스캔 후 unpublish/삭제 판정 (작가님 확인) |
| P5 | 캐노니컬 이중 방어 | 렌더 캐노니컬을 레코드 클린 슬러그 기준으로 (301 후 사실상 접근 불가하나 방어선) |

**+ 데이터 스캔**(실행자): blog_posts 전 docId 목록 — `-kr/-en/-ja` 키 분포·raw 키·오염 레코드 전수 (콘텐츠 데이터 — ch4 10조 비대상, 서비스 코드 경유).

## 3. 재색인

- 301 배포 후 변형 19건은 재크롤 시 자연 이관 (사이트맵은 변형 미포함이라 무작업).
- 가속: 작가님 원탭 재색인 요청 (크리덴셜 읽기 전용 — API 재제출 403 실측 07-18 01:16). GSC 쓰기 스코프는 별도 큐.

## 4. 검증 (민아)

① 변형 19건 전수 curl → 301 + Location 정본 ② 정본 200·콘텐츠 무회귀 ③ en·ja 경로 무회귀 ④ raw 키 포스트 정상 ⑤ jest → prod 스모크 → GSC 주간 관찰(변형 노출 소멸 추이).

## 5. 잔여 블로그 묶음 (이 제안 밖 — 내일)

배너 vol.36 재제작 / `######`·h6 렌더 정정 / **수정 시 lastmod 갱신 배선** / GSC 쓰기 스코프 검토 / T1 배경 재채색(작가님 내일 지정).

## 6. 라우팅 권고

실행 = 막내2 6차 지시서 (쌍아 발행, 소요 ~30분 규모). 검증 = 민아. 승인 시 즉시 가능.
