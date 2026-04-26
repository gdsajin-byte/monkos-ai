---
type: report
date: 2026-04-14
from: iMac/막내3
to: iMac/쌍아
subject: monkos-portal 배포 전 사전 점검 결과 — d6d9fed
order_ref: ORDER_20260414_iMac쌍아_막내_포탈배포전_사전점검.md
verdict: GO
---

# monkos-portal 배포 전 사전 점검 결과

**[2026-04-14 19:25 KST] iMac/막내3 → iMac/쌍아**

**대상 커밋**: `d6d9fed` (hreflang 조건부 생성 + blogRedirects 3건 추가)
**변경 파일**: `monkos_AI/portal/lib/cms/render.js`, `monkos_AI/portal/server.js`
**점검 환경**: 로컬 `PORT=8090`, ADC(application_default_credentials), Firestore prod(monkos) 조회
**원복 상태**: 측정 종료 후 `git checkout HEAD --` 로 d6d9fed 상태로 복원 확인

---

## 1-1. hreflang 조건부 생성 시나리오

| # | 시나리오 | 테스트 URL | 결과 | 판정 |
|---|---------|----------|-----|-----|
| A | KO-only | `/blog/vol24-20-ai-monkosai` | `ko + x-default`만 출력 (ja/en 없음) | ✅ |
| B | 3-lang | `/blog/claudemax-20x-2개월-실사용-후기` | `ko + ja + en + x-default` 전부 출력 | ✅ |
| C | JA-only(KO 슬러그 부재) | `/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth` | `ja`만 출력 (x-default 억제) | ✅ |
| C'| JA 3-lang 직접 접근 | `/ja/blog/claudemax-...` | `ko + ja + en + x-default` | ✅ |
| D | 존재하지 않는 글 | `/blog/nonexistent-slug-xyz` | 404 (기존과 동일) | ✅ |
| E | published=false | **코드 리뷰 대체** — `d.exists && d.data().published ? p : null`로 published 필드 엄격 체크. 실데이터 unpublish 수행은 서비스 영향으로 회피 | ✅ (정적) |

**요약**: A~D 로컬 실측 전부 통과. E는 로직 정적 검증으로 대체.

## 1-2. 301 리다이렉트 신규 3건 + 타겟 200

| # | 원본 | Location | 타겟 상태 | 판정 |
|---|------|---------|---------|-----|
| 1 | `/en/blog/vol17-vs` | `/en/blog/korea-vs-japan-interview-attire-whats-the-difference` | 200 | ✅ |
| 2 | `/en/blog/vol18-ai-vs` | `/en/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo` | 200 | ✅ |
| 3 | `/ja/blog/vol24-20-ai-monkosai` | `/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth` | 200 | ✅ |

**주**: 오더 원안 6건 중 JA vol17/18/19 3건은 **타겟 JA 번역본 부재(404 확인)**로 d6d9fed 커밋 단계에서 이미 제외되어 있음. 해당 3건의 장기 해소는 건 1(hreflang 조건부 생성)이 담당.

## 1-3. 회귀 R1~R6

| # | 기능 | 경로 | 응답 | 판정 |
|---|------|-----|------|-----|
| R1 | 블로그 메인 | `/blog` | 200 OK | ✅ |
| R2 | 블로그 목록 렌더 | `/blog` | 200 OK, `blog-card` DOM 10개 노출 | ✅ |
| R3a | 기존 301 (KO) | `/blog/vol23-qa-5` → `/blog/vol24-20-ai-monkosai` | 301 ✅ | ✅ |
| R3b | 기존 301 (EN) | `/en/blog/vol21-ai-monkosai` → `.../ai-id-photo-created-by-a-20-year-photographer-monkos-ai` | 301 ✅ | ✅ |
| R3c | 기존 301 (JA) | `/ja/blog/vol20-vs` → `.../korea-vs-japan-job-photo-hair` | 301 ✅ | ✅ |
| R4 | 루트 | `/` | 200 OK | ✅ |
| R5 | `/idphoto` | `/idphoto` | 404 | ⚠️ |
| R6 | `/admin` | `/admin` | 404 (trailing slash 미부착 시) | ⚠️ |

**R5/R6 분석 (⚠️ → 회귀 아님)**:
- `/idphoto`: prod(https://monkos.ai/idphoto)도 404. **변경 전후 동일**. 증명사진 서비스는 별도 도메인 `idphoto-kr.monkos.ai`/`idphoto-jp.monkos.ai` (portal_seo.md 서비스 도메인 맵 기준).
- `/admin`: trailing slash 없는 경로 404는 정적 파일 서빙 특성. `/admin/` 또는 `/admin/index.html`은 200 OK. **변경 전후 동일**.
- 두 건 모두 d6d9fed의 변경(render.js hreflang, server.js blogRedirects)과 **논리적 무관**. 회귀 아님.

## 1-4. 성능 P1/P2

### 방법
동일 환경(로컬 8090, ADC, Firestore prod)에서 **baseline(836401d)** vs **신규(d6d9fed)** 대조 측정. 3-lang 글 `/blog/claudemax-20x-2개월-실사용-후기` 기준 각 5회.

### P1. 블로그 글 응답 시간

| 커밋 | 회차별(s) | 평균(s) | 중앙값(s) |
|------|---------|--------|----------|
| 836401d (baseline, hreflang 무조건 4개) | 0.757, 0.568, 0.584, 0.594, 0.430 | 0.586 | 0.584 |
| d6d9fed (hreflang 조건부 + Promise.all 3건) | 0.615, 0.804, 0.636, 0.589, 0.606 | 0.650 | 0.615 |
| **증분** | | **+64ms** | **+31ms** |

- **기준 통과**: 오더 "기존 대비 +100ms 이내" → 평균 +64ms, 중앙값 +31ms로 충족.
- Promise.all 병렬 Firestore 3건 추가의 예상 오버헤드(~50-100ms)와 정합.

### P1b. KO-only 글(vol24-20-ai-monkosai) — 3회

- 0.563s, 0.419s, 0.586s → 평균 ~0.523s
- 3-lang 대비 소폭 낮음(Firestore 병렬 조회는 동일하게 발생하지만 doc 본문 크기가 다를 가능성).

### P2. 301 리다이렉트 응답 시간 — 3회

- 0.000483s, 0.000523s, 0.000530s → 평균 **~0.5ms**
- blogRedirects 객체 lookup만 거치고 즉시 301 반환. DB 조회 없음. 500ms 한계 대비 3자리수 여유.

## 1-5. 정적 분석 — 구현 리뷰

### render.js L417~439 (blogPostFragment)
- **Firestore 에러 격리**: 각 doc 조회를 개별 `try/catch`로 감싸 특정 언어 조회 실패가 다른 언어에 영향 없음. 실패 시 해당 언어만 hreflang에서 누락, 렌더 전체는 정상 완료.
- **x-default 안전성**: `hasKo` 체크 추가로 KO 부재 시 x-default 자동 억제 → **오더 원안의 잔여 유령URL 패턴 차단**(별도 발견·보정, 막내3 세션로그 `2026-04-14_iMac_막내3.md` 참조).
- **성능 오버헤드**: Promise.all 병렬 3건 조회. Firestore 단건 get ~20-50ms × 병렬 → 측정 결과(+31~64ms)와 일치.

### server.js L226~250 (blogRedirects)
- 기존 10건 + 신규 3건 = 총 13건. 객체 리터럴 lookup은 O(1), 지연 없음.
- 신규 3건 모두 타겟 200 OK 실존 확인.

## 2. 발견 사항 💡

- **⚠️ → 회귀 아님**: `/idphoto`, `/admin`(no-slash) 404는 **기존 동작**. 이번 변경과 무관. 단, `/admin` 카노니컬 라우팅(trailing slash 강제 혹은 리다이렉트) 추가 논의는 별도 어젠다 후보.
- **오더 원안 잔여 버그 보정 사실**: d6d9fed는 오더 원안 대비 `hasKo` 체크를 추가한 보정본. JA/EN-only 글의 x-default 유령URL 차단.
- **JA vol17/18/19 미해결**: 번역본 실존 시 blogRedirects 추가 예정. 현재 구조에서는 hreflang 조건부 생성(건1)이 신규 유령URL 생산을 차단 → GSC 캐시 자연 해소 대기.

## 3. 판정

### 🔀 배포 가부: **GO**

**근거**:
1. hreflang 시나리오 A/B/C/C'/D 실측 전부 통과. E는 정적 검증 통과.
2. 301 신규 3건 + 타겟 200 OK 전부 통과. 기존 10건 회귀 3건 샘플 전부 통과.
3. 성능 증분 평균 +64ms (기준 +100ms 이내).
4. 변경 코드의 에러 격리·x-default 안전성 확보.
5. R5/R6의 404는 변경 무관 기존 동작.

### 후속 권고

| 단계 | 액션 |
|------|-----|
| 1 | 작가님 배포 최종 승인 |
| 2 | `cd monkos_AI/portal && ./deploy.sh prod` (법률 ch5 2조 준수) |
| 3 | 배포 직후 prod 스모크: `curl -sI https://monkos.ai/en/blog/vol17-vs` 등 301 확인 |
| 4 | GSC Search Console에서 일주일 후 hreflang 유령URL 감소 추이 모니터 |
| 5 | JA vol17/18/19 번역본 작성 시 blogRedirects에 추가(별건 오더) |

## 4. 보고 체크

```
✅ 1-1 hreflang 시나리오 A~D 실측 통과, E 정적 통과
✅ 1-2 301 신규 3건 + 타겟 200 전부 통과
✅ 1-3 회귀 R1~R4 통과, R5/R6는 기존 동작 확인 (회귀 아님)
✅ 1-4 성능: P1 +64ms(평균), P2 ~0.5ms — 기준 통과
💡 오더 원안 x-default 잔여 버그는 d6d9fed에서 이미 보정됨
📁 본 보고서: monkos-ops/ops/reports/2026-04/REPORT_20260414_iMac막내_포탈배포전_사전점검.md
🔀 배포 가부: GO
```

**끝.**
