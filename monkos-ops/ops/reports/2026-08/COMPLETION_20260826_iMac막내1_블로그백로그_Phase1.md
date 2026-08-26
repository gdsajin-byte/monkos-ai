---
type: completion
date: 2026-08-26
device: iMac
agent: 막내1
status: 마감
portfolio: PF_OPUS
---

# 완료 보고 — 블로그 백로그 Phase 0·1

**[2026-08-26 15:11 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260826_iMac쌍아_막내1_블로그백로그_Phase1.md](../../orders/2026-08/ORDER_20260826_iMac쌍아_막내1_블로그백로그_Phase1.md)
> 설계 정본: [DESIGN_20260826_블로그백로그_트리아지.md](../../../tech/designs/2026-08/DESIGN_20260826_블로그백로그_트리아지.md)
> 지시서 보정: 2026-08-26 15:02 쌍아 회신 → 작가님 구두 전달 (옵션2 + H1 축소 규칙 + us-visa 포함 26건 + vol36 접촉 금지 + 슬러그 전건 보존)

---

## 1. 결과 요약

| 항목 | 결과 |
|---|---|
| 발행 | **26건** (C군 에세이 25 + us-visa 소급 교정 1) |
| 라이브 200 검증 | **26/26 통과** |
| 제목 1회 노출 검증 | **26/26 통과** |
| sitemap ko URL | **79 → 104 (+25)** |
| sitemap en / ja | 72 / 75 — **불변** (ko 단독 발행 원칙 준수) |
| sitemap 총량 | 226 → 251 |
| 계약 위반 건 | **0건** |

---

## 2. 지시서 대비 편차 — 발행이 아니라 초안 활성화였다

지시서는 C군 25건을 **신규 발행**으로 전제했다. 실측 결과 **25건 전부가 Firestore에 `published:false` 초안으로 이미 존재**했다.

| 실측 항목 | 값 |
|---|---|
| `blog_posts` 문서 존재 | 25/25 |
| `published` | 전건 `false` |
| `lang` | 전건 이미 `ko` |
| `createdAt` = `updatedAt` | 전건 일치 — 생성 후 무갱신 |
| 발행 전 sitemap 등재 | **0/25** (대조군 `us-visa-photo-rejection-guide` 등재 확인 → 조회 유효성 배제) |

지시서 §3 "`--update` 금지 / 기존 문서 덮어쓰기 상황이 나오면 보고 후 대기" 조항이 발동해 **Task 3을 정지하고 보고**했다.

판정 근거로 **원본 md 본문 vs Firestore 초안 본문을 25건 전수 대조**했다. 해시는 전건 불일치였으나 실차이는 **H1 제목 1줄 + 빈 줄 + 말미 개행뿐**이고 본문 문단은 동일했다(`honesty-as-search-strategy` unified diff 실측). 즉 `--update`는 **다른 글로 덮어쓰는 행위가 아니라 같은 글의 초안 활성화**다. 이 판정과 함께 승인을 받아 재개했다.

> `132건 published:false`(제안서 모집단)와 `78건 미발행 원본`(설계서 모집단)의 교집합이 실재했다는 뜻이다. 설계서 §1의 두 모집단 분리는 옳았으나, **C군이 양쪽에 동시 속한다는 점은 설계 시점에 잡히지 않았다.** Phase 2(B군)·Phase 3(A군) 착수 전 동일 확인이 필요하다.

---

## 3. Task 1 — `publish.mjs` lang 별칭 정규화

`monkos_AI/portal/tools/blog-publish/publish.mjs`

1. `LANG_ALIAS` + `normalizeLang()` 신설 — frontmatter 파싱 직후 호출. **등록 별칭만 흡수**하고 미등록 값은 원값을 유지해 `validate`가 그대로 튕긴다 (무음 폴백 금지).
2. `validate` lang 분기 분리 — 필드 부재 시 `'lang 없음'` 명시 에러 (종전 `lang 부적합: undefined`).
3. 계약 주석에 별칭 허용 범위 반영.

**실증** (픽스처 8건 dry-run):

| 입력 `lang` | 결과 |
|---|---|
| `KR` / `kr` / `ko` | ✅ ko 정규화 통과 |
| `JP` / `ja` | ✅ ja 정규화 통과 |
| `EN` / `en` | ✅ en 정규화 통과 |
| `de` | ❌ `lang 부적합: de (ko\|en\|ja)` |
| `ZH` | ❌ `lang 부적합: ZH (ko\|en\|ja)` |
| (필드 부재) | ❌ `lang 없음` — 추정 없이 튕김 |

파일명 접미사(`_KR` 등)는 판정에 미사용. frontmatter가 정본.

---

## 4. 제목 이중노출 결함 — 자기 도구가 만든 결함의 소급 교정

**원인**: `publish.mjs`가 H1을 `content`에 포함시킨다. 템플릿(`render-blog.js:525`)이 `post.title`을 이미 `<h1>`으로 출력하고, `blogRenderer`(`render-shell.js:9`)가 본문 헤딩을 1단계 강등하므로 **선두 H1이 `<h2>`로 재노출**된다. 08-26 발행분 `us-visa-photo-rejection-guide` 라이브에서 실측 확인했다.

**적용 규칙 (의도적 축소판 — 쌍아 지정 문구)**:
> 본문의 첫 비어있지 않은 줄이 H1이고, 그 텍스트가 추출된 title과 동일할 때만 그 한 줄을 제거한다. 그 외 위치의 `#` 헤딩은 불가침. `validate`의 title 추출 로직은 본 범위에서 변경하지 않는다.

**"선두 H1 제거"로 넓히면 안 되는 이유 — 실측 확인**: `blog_20260714_vol36-glasses-jobphoto-rich_KR.md`는 첫 줄이 HTML 주석이고 `#` 8개가 **전부 섹션 헤더**다(`# 👓 안경 쓰고 찍어도 되는 경우` 등). 넓은 규칙이면 섹션 헤더가 잘려나간다. 현재 26건에 해당 사례는 없으나 도구는 남는다.

**음성 대조**: vol36 투입 시 `frontmatter 없음`으로 거부됨을 실증(내용 무접촉).
**양성 확인**: 26건 전부 규칙 발동, 미발동 0건.

---

## 5. `ogImage` 소멸 방지 — set() 덮어쓰기 손실 차단

`--update`는 `set()`이라 **미기재 필드를 지운다.** 라이브 문서 `us-visa-photo-rejection-guide-kr` 필드 전수 조회 결과, publish.mjs가 쓰지 않는 **`ogImage` 1건이 소멸 대상**이었다.

`ogImage`는 `blog.js` `generateOgImage()` 산출물로 `render-blog.js:387/390`의 `og:image`·`twitter:image`에 쓰인다. 소멸 시 `thumbnail` 폴백으로 **강등**된다(즉시 파손은 아니나 OG 카드 상실).

기존 `createdAt`·`viewCount` 보존 로직과 같은 자리에 **`ogImage` 명시 보존**을 추가했다.

**발행 후 실측**: `og:image` = `…/og_us-visa-photo-rejection-guide.jpg` (생성 OG 카드 유지, thumbnail 폴백 아님). `viewCount`·`createdAt`도 보존됨.

> 나머지 25건은 소멸 대상 필드 0건이었다. us-visa의 `thumbnail`·`category`·`cta_*`·`tags`·`summary`는 원본 md frontmatter가 전부 보유해 `set()`으로 동일 복원된다(사전 대조 완료).

---

## 6. 검증 실측

```
발행:        26/26 ✅
라이브 200:  26/26 ✅   (200 아닌 건 0)
제목 1회:    26/26 ✅   (동일 문구 h2 잔존 0)
sitemap ko:  79 → 104   (+25, C군 25건 전건 등재)
sitemap en:  72 → 72    (불변)
sitemap ja:  75 → 75    (불변)
```

> 발행 직후 1차 점검에서 us-visa 1건이 제목 중복으로 잡혔으나, Firestore 실측(`content` H1 미시작, 길이 2193) 및 재조회 결과 **정상**이었다. 발행 직후 응답을 잡은 것으로, 데이터 이상 아님.

---

## 7. 범위 준수

| 항목 | 상태 |
|---|---|
| A군(해외 국가 규격 17건) | 미착수 ✅ |
| B군(국내 실용 34건) | 미착수 ✅ |
| D군(로컬 2건) | 미착수 ✅ |
| vol36 접촉 | **없음** ✅ (음성 대조 1회 — 도구가 거부, 파일 무수정) |
| 슬러그 변경 | **없음** ✅ 전건 보존 |
| 원본 md 본문·제목 수정 | 없음 ✅ |
| 전역 CTA 토글 조작 | 없음 ✅ (꺼진 상태로 발행 — 나중에 켜면 서버 렌더라 소급 반영) |
| 원본 md 삭제 | 없음 ✅ (A군 폐기는 Phase 3 소관) |
| 배포 | 없음 ✅ (ch5 2조 — Firestore 쓰기이며 포털 재배포 불요) |

---

## 8. 변경 파일 / 커밋

| 커밋 | 내용 | 롤백 단위 |
|---|---|---|
| `dea039ed` | `[fix] publish.mjs lang 별칭 정규화` | 도구 — 언어 계약 |
| (본 커밋) | `[fix] publish.mjs 제목 이중노출 제거 + ogImage 보존` | 도구 — 렌더/데이터 보존 |
| (본 커밋) | `[log] 블로그 백로그 Phase1 발행 결과 기록` | 기록 |

변경 파일: `monkos_AI/portal/tools/blog-publish/publish.mjs` (유일한 코드 변경)
배포 rev: **없음** — 배포 미수반 작업.

---

## 9. 후속 필요 (범위 밖 — 보고만)

1. **Phase 2·3 착수 전 초안 중복 확인 의무화.** B군 34건·A군 17건도 `published:false` 초안이 선존할 개연성이 높다. "신규 발행" 전제로 지시서를 쓰면 같은 정지가 재발한다.
2. **`ogImage` 미생성.** `publish.mjs`는 OG 카드를 만들지 않는다. 이번 25건은 `thumbnail`도 없어 `og:image`가 기본 `og-image.png`로 나간다. 공유 시 26건이 동일 이미지다.
3. **전역 CTA 토글 미결.** 25건이 CTA 카드 없이 발행됐다(설계서 §5 작가님 결정 대기 항목). 켜는 시점에 소급 반영되나, 포스트별 `cta_link`가 비어 있어 전역 기본값으로만 걸린다.
4. **자동번역 미연동.** ko 단독 발행이라 en·ja는 불변이다(원칙대로). 번역 경로 위상은 Phase 4 소관.

---

✅ Task 1 lang 정규화 — 별칭 3계열 통과·미지원 3건 튕김 실증
✅ Task 2 C군 25건 dry-run — 계약 위반 0건, 초안 선존 발견·보고
✅ Task 3 26건 발행 — 라이브 200 26/26, sitemap ko +25 실측
✅ 제목 이중노출 제거(축소 규칙) + us-visa 소급 교정 + `ogImage` 보존
💡 초안 선존은 Phase 2·3에서도 재발한다 — 지시서 전제 보정 필요
⏳ 전역 CTA 토글·OG 카드 생성은 미결(범위 밖)
📁 `publish.mjs` / 세션로그 / PF_OPUS / 본 보고서
🔀 도구 2커밋 + 기록 1커밋 (롤백 단위 분리)
