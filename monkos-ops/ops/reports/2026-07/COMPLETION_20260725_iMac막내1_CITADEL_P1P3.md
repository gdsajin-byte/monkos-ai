---
type: completion
date: 2026-07-25
device: iMac
agent: 막내1
status: 마감
portfolio: PF_CITADEL
---

# COMPLETION — CITADEL P1~P3 (결함 수정 + 재발 방지)

**[2026-07-25 18:12 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260725_iMac쌍아_막내1_CITADEL_P1P3_결함수정.md](../../orders/2026-07/ORDER_20260725_iMac쌍아_막내1_CITADEL_P1P3_결함수정.md)
> 근거 조사: [PROPOSAL_20260725_막내1_CITADEL_스니펫장악_처방설계](../../proposals/PROPOSAL_20260725_막내1_CITADEL_스니펫장악_처방설계.md) (`368c1ac7`)
> prod 배포 승인: 2026-07-25 18:05 KST 작가님

---

## 1. 검증 결과 — 6/6 통과

| # | 항목 | 합격 기준 | 결과 |
|---|---|---|---|
| 1 | P1 서빙 실측 | 12슬러그×4언어 아이콘 1개 | ✅ **12/12** (dev·prod 양쪽) |
| 2 | P1 회귀 | 경고 배너 소실 0건 | ✅ **0건** |
| 3 | P2 301 | 2건 모두 1홉, 체인 0 | ✅ **4경로 전부 1홉** (대상이 2→4로 확대, §3) |
| 4 | P2 신규 URL | 200 · 사이트맵 · GSC 제출 | ✅ ko/ja/en **3종 200**, 사이트맵 반영·구 슬러그 0, GSC 제출 204 |
| 5 | P3 검증 동작 | URL 입력 거부·경고, 무음 통과 0 | ✅ 악성 7종 **전부 차단** + ERROR 로그 + 400 |
| 6 | P3 회귀 | 정상 슬러그 생성 유지 | ✅ 정상 7종 **전부 통과** |

**prod 리비전**: `monkos-portal-00537-q69` → **`monkos-portal-00538-lc5`**

---

## 2. P1 — `⚠️` 중복 아이콘 제거

- **처방대로 데이터만 수정, 코드 무변경.** `render-specs.js:625`가 아이콘을 공급하는 설계는 정상이므로 손대지 않았다.
- 착수 시 재스캔: 선두 `⚠️` **48건**(12슬러그 × `warning.{ko,en,ja,es}`) — 제안서 §4-3 실측분과 일치, 누락 없음.
- **문장 중간 `⚠️` 20건은 보존**(`details.{ko,en,ja,es}`, 5슬러그). 준수 조항 1 이행.
- 치환 규칙: 문자열 **선두**의 `⚠️` + 뒤따르는 공백만 제거. 정규식 `(:\s*")⚠️\s*` → `\1`. 파싱 후 슬러그 429개 불변·잔여 `⚠️` 20개 검증 후 기록.
- `specs-data.json` diff: **48줄 변경(+48/-48)**, 다른 필드 무변경.

**부수 확인**: `ph`·`br`·`pe`는 `onsite` 플래그라 배너 아이콘이 `📍`다. 기존에는 `📍` 옆에 `⚠️`가 붙어 **아이콘 2종 혼재**였고, 이번 수정으로 `📍` 단독이 됐다(더 정확해짐).

## 3. P2 — 깨진 슬러그 정본화 + 301

### 3-1. 실체는 2건이 아니라 **3문서 / 4경로**였다

착수 시 `reslug_blog.js --dry-run`으로 재확인한 결과, 같은 깨진 슬러그를 **ko·ja·en 3문서**가 공유하고 있었다. GSC에 ko 2행만 잡힌 것은 ja/en의 노출이 0이기 때문이다.

| 문서 (Firestore `blog_posts`) | 제목 | → 신규 |
|---|---|---|
| `https:monkosaiadminblog-edithtml-kr` | 여성 단발머리 취업사진 스타일 3종 | `womens-short-hair-job-photo-styles-kr` |
| `https:monkosaiadminblog-edithtml-ja` | 女性のボブヘア 就職活動写真スタイル3選 | `…-ja` |
| `https:monkosaiadminblog-edithtml-en` | 3 Professional Bob Haircut Styles for Job Application Photos | `…-en` |

301 맵은 접미사 변형까지 포함해 **6개 키**를 넣었다(접미사 정규화 1홉 + 맵 1홉 = 2홉 체인 방지). 실측 4경로 전부 **1홉**.

### 3-2. `reslug_blog.js` 보정 1건

기존 스크립트는 `slug`만 갱신하고 **`baseSlug`를 남겨뒀다**. `home.js:515`가 `p.baseSlug`로 블로그 카드 링크를 만들기 때문에, 미갱신 시 홈에 죽은 링크가 남는다. `baseSlug: newBase`를 함께 쓰도록 고쳤다(향후 리슬러그에도 적용되는 일반 보정).

### 3-3. 부수건 — 조치 불요로 판정

지시서가 지시한 `/blog?page=N&lang=ko` 6건 `noindex`/canonical 적용은 **이미 충족돼 있다.** 실측:

```
GET /blog?page=3&lang=ko → <link rel="canonical" href="https://monkos.ai/blog">
```

`render-blog.js:62`가 쿼리와 무관하게 canonical을 `/blog`로 고정한다. canonical이 있는 URL에 `noindex`를 더하는 것은 통합 신호를 흐리므로 **추가하지 않았다.**

### 3-4. ⚠️ 7일 관측 대상 (2026-08-01 재확인)

301 직후 순위 변동은 **즉시 판단 금지**(지시서 P2-4). 관측 항목:

| 관측 | 기준선(90일, 2026-04-25~07-24) |
|---|---|
| 신규 URL `/blog/womens-short-hair-job-photo-styles` 노출·순위 | 구 URL 합계 **275노출 / 8클릭 / 평균 6.4위** |
| 구 URL 2건 노출 감소 추이 | 색인 이전 완료 시 0으로 수렴 예상 |
| 색인 상태 | GSC `index_inspect`로 신규 URL 색인 확인 |

**주의**: 이 작업은 **클릭 증가 작업이 아니다**(지시서 준수 조항 3). 목적은 관리자 URL의 검색 노출 제거 = 브랜드 신뢰다. 단기 순위 하락이 나와도 처방 실패로 보지 말 것.

## 4. P3 — 슬러그 입력 검증 (재발 방지)

- `slug.js`에 **`isUrlLikeSlug()` 신설** — 경로 구분자·스킴(잔해 포함)·도메인·파일확장자 4종 판정.
- `blog.js` 생성 경로에서 `body.slug`가 URL 형태면 **ERROR 로그 + HTTP 400**. 무음 통과 없음(도구 3요건의 "실패 가시화").
- **정규화 규칙은 건드리지 않았다** — 검증만 추가(지시서 P3 조항).
- 갱신 경로(`handleBlogUpdate`)는 `allowedFields`에 `slug`가 없어 슬러그 변경 자체가 불가 → 입구는 생성 경로 1곳뿐임을 확인했다.

**회귀 테스트 실측**

| 구분 | 입력 | 결과 |
|---|---|---|
| 차단 | `https://monkos.ai/admin/blog-edit.html`, `http://x.com/a`, `https:monkosaiadminblog-edithtml`, `//cdn.x.io/p`, `monkos.ai/blog`, `blog-edit.html`, `mailto:a@b.co` | **7/7 차단** |
| 통과 | `womens-short-hair-job-photo-styles`, `vol36`, `id-photo-background-color`, `men-s-id-photo-know-this-and-you-wont-fail`, `post-20260519030356`, `ai-kr`, `20-year-photographer-creates-id-photos-with-ai-monkos-ai` | **7/7 통과** |

---

## 5. ⚠️ 사고 기록 — prod 404 약 35분 (막내1 과실)

**무슨 일**: P2 리슬러그(Firestore 문서 이름 변경)를 dev 검증 전에 실행했다. **Firestore는 dev/prod 공용**이므로 prod 콘텐츠가 즉시 바뀌었고, 짝이 되는 301 리다이렉트는 **코드**라서 배포 게이트 뒤에 있었다. 그 사이 prod에서 구 URL 2건이 **404**가 됐다.

| 시각 | 상태 |
|---|---|
| 17:29경 | 리슬러그 실행 → prod 구 URL 404 시작 |
| 17:34 | 작가님께 즉시 보고 + 선택지 2안 제시(원복 / prod 조기배포) |
| 17:31~33 | dev 배포·검증 6/6 통과 → 권고를 **원복 → prod 배포**로 변경(미검증 사유 해소) |
| 18:05 | 작가님 배포 승인 |
| 18:09 | prod `00538-lc5` — **404 → 301 1홉 해소 확인** |

**원인**: 공용 DB에서 **데이터 변경과 코드 변경의 배포 시점이 어긋났다.** 올바른 순서는 ① 리다이렉트 코드 prod 배포 → ② 리슬러그 실행이다. 착수 전에 "Firestore가 환경 공용인가"를 확인하지 않았다.

**영향**: 해당 URL 노출은 90일 275건 = 일 약 3건. 35분 노출 손실은 1건 미만으로 추정한다(추정치, 실측 아님). 색인 영향은 §3-4에서 관측한다.

**교훈 (일반화)**: 공용 데이터스토어를 건드리는 작업은 **dev 검증 게이트로 격리되지 않는다.** 데이터·코드가 짝을 이루는 처방은 배포 순서를 지시서 단계에 명시해야 한다.

---

## 6. 변경 파일

| 파일 | 변경 |
|---|---|
| `monkos_AI/portal/lib/cms/specs-data.json` | `warning.*` 선두 `⚠️` 48건 제거 (P1) |
| `monkos_AI/portal/lib/cms/redirects.js` | `BLOG_REDIRECTS` 6키 추가 (P2) |
| `monkos_AI/portal/lib/cms/slug.js` | `isUrlLikeSlug()` 신설·export (P3) |
| `monkos_AI/portal/lib/cms/blog.js` | 생성 경로 URL 슬러그 거부 + ERROR 로그 (P3) |
| `monkos_AI/portal/scripts/reslug_blog.js` | RESLUG_MAP 교체 + `baseSlug` 동시 갱신 보정 (P2) |
| Firestore `blog_posts` | 3문서 리슬러그 (P2, 코드 아님) |

## 7. 범위 밖 — 손대지 않음

P4~P6, §6-1 인텐트 집중 트랙, `/en|ja/blog/` 한글 슬러그 9건(hreflang), 구 1-segment specs 슬러그 3종(PF_SPECS 이관 대상), specs 본문 콘텐츠(꾸 관할) — 전부 미접촉.

## 8. 조사 중 발견 (조치 안 함 · 보고)

`de-passport`의 `details.en`에 한국어가 섞여 있다: `"Follows ICAO 9303 standard. **회색** background, …"`. 또 `details.ko`는 "회색 배경", `details.ja`는 "白背景"(흰 배경)으로 **언어 간 내용이 어긋난다**(독일은 회색이 맞다). specs 콘텐츠 소관이라 손대지 않았고, 목록만 남긴다.
