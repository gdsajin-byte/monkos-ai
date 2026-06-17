---
type: report
date: 2026-06-17
device: 웹
agent: 민아
status: 마감
---

# 오전 TODO 실측 검수 — 쌍아 2차 정산(12:32) 교차 검증

> **[2026-06-17 12:38 KST] 웹/민아 → 작가님**
> 작가님 지시: 쌍아가 "✅ 완료"로 보고한 오전 TODO 전체를 민아가 독립 실측 검수.
> 방식: git diff·코드·PR·파일 직접 대조 + 4축 서브에이전트 병렬. read-only(감사=민아 본령 — 코더 자기보고는 자기 가정에 갇힘).

---

## 0. 검수 총평

| 등급 | 항목 | 수 |
|------|------|----|
| ✅ **검증 통과** | PF_PARTNER 신설 · PR #72/#76/#80 · 보안 노출표면 4건 | 3 |
| ⒝ **부분/결함** | Imagen 폐기 영향평가(누락 1건) · GEO hreflang(static 누락) | 2 |
| 🔴 **보고-실제 불일치** | AUTOPILOT 데이터 랙(표면 처리) | 1 |

쌍아 작업의 **실행 품질은 높으나**(보안 4건 완벽, PF·PR 정확), **영향범위 식별과 보고 워딩에 2건의 보정 필요**. 둘 다 운영 리스크와 직결되므로 시정 권고.

---

## 1. 항목별 검수 결과

### ✅ TODO2 — PF_PARTNER 신설 : 통과
- `monkos-ops/ops/portfolios/PF_PARTNER/README.md` 존재, frontmatter 정상(`id: PF_PARTNER`, `status: active`, leads 명기).
- 인덱스 등록 확인(`portfolios/README.md:37`). **쌍아 보고 정확.**

### ✅ TODO5 — PR 머지 정리 : 통과
- `#72` MERGED(03:11) · `#76` MERGED(03:11) · `#80` OPEN(유지). **쌍아 보고("#72·#76 머지, #80 유지") 정확.**

### ✅ 로드맵 — 보안 노출표면 4건 : 완전 통과 (모범)
커밋 `ba32dcea` + 완료보고 `f41e1cd4` 코드 100% 일치:
| 건 | 검증 | 결과 |
|----|------|------|
| `/health` 모델명·인증·엔진 노출 제거 (kr/jp/portal) | status+service+timestamp만 반환 | ✅ |
| `err.message` 직통 반환 제거 | 15곳 + runPreCheck 폴백 2곳 → 일반메시지+code | ✅ |
| `/api/info` styles(프롬프트 키) 노출 제거 | kr/jp 제거 | ✅ |
| portal admin API 프롬프트 응답 제거 | `ai.js` prompt 필드 제거 | ✅ |
- 3개 서비스 배포 리비전 명시(kr-00197 / jp-00122 / portal-00296). **막내2 보고 정확. 흠 없음.**

---

### ⒝ TODO1 — Imagen 폐기 영향평가 : 부분맞음 (★누락 1건)
쌍아 보고 "ai.js 직격, idphoto 안전"은 맞으나 **`monk_imagen4` 서비스를 누락**.

| 서비스 | 모델 | 폐기(8/17) 영향 |
|--------|------|----------------|
| portal CMS `ai.js:83` | `imagen-4.0-generate-001` | 🔴 직격 (쌍아 식별 ✅) |
| **`apps/monk_imagen4/functions/api/generate.ts:100`** | **`imagen-4.0-generate-001`** | 🔴 **직격 (쌍아 누락 ❌)** |
| idphoto-kr/jp | `gemini-3-pro-image-preview` | ✅ 안전(식별 정확) |
| studio | `gemini-3-pro-image-preview` | ✅ 안전 |

→ **마이그레이션 대상은 1개(portal)가 아니라 2개(portal + monk_imagen4).** monk_imagen4는 활성 프로덕션(`monk-image-engine`)이라 carry 시 동반 처리 필수. **영향평가 재발행 필요.**

---

### 🔴 TODO4 — AUTOPILOT 데이터 랙 : 보고-실제 불일치 (표면 처리)
커밋 `898ce5a7` 실측 결과, **GSC 수집 윈도우는 그대로**이고 **파일명·제목·메타데이터만 실행일 기준으로 전환**.

- 변경됨: 출력 파일명/제목 → `run_date`(오늘) 기준. 메타에 `data_date` 분리 + 본문에 "데이터 기준일/래그 감안" 명시.
- **변경 안 됨**: `target = date.today() - timedelta(days=3)` 오프셋 동일. `fetch_gsc()`의 `startDate/endDate` 동일(`daily_briefing.py:160-196, 478-506`).
- 즉 **데이터는 여전히 3일 후행.** 쌍아 보고 "데이터 랙 **원인 해소** 완료"는 **과장**.

> ⚖️ 단, 민아 판단: GSC는 Google 측 본질 래그(2~3일)라 `days`를 줄이면 데이터가 비는 위험이 있다. **"실행일 표기 + 데이터 기준일 명시"는 합리적 대응**이다. 문제는 *조치*가 아니라 *보고 워딩*과 *상태 정의*. 정확한 상태는 **"데이터 신선도는 GSC 본질 한계 → 투명 표기로 대응(원인 제거 아님), GSC 수집 윈도우 추가 점검은 carry"**.

---

### ⒝ 로드맵 — GEO P2 사이트맵 hreflang : 구현됐으나 결함
커밋 `94fd5b1f`, `render-sitemap.js`:
- ✅ 핵심 정합: `xmlns:xhtml` 선언, `<xhtml:link rel="alternate">` 형식, **specs 1,335 URL × 4 = 5,340 태그**(상호참조·self-ref·x-default 완비), blog 동적 588 태그.
- ⚠️ **결함 1**: `sitemap-static`의 다국어 URL(`/`, `/ja/`, `/en/` 등)에 hreflang **누락** → 3개 사이트맵 간 불균형, Google이 분리 페이지로 인식 위험.
- ⚠️ **결함 2(문서)**: 완료보고 "번역 존재 글만"은 부정확 — 실제 모든 ko 글이 ko+x-default 포함.
- 판정: 핵심 기능 정상, **마감 품질(static 일관성) 보강 권고.**

---

## 2. 시정 액션 (제안 — 실행은 작가님/쌍아 판단)

| 우선 | 항목 | 조치 | 담당 |
|------|------|------|------|
| 🔴 P0 | Imagen 영향평가 누락 | **monk_imagen4 포함 재발행** + 8/17 carry에 2개 서비스 마이그레이션 명시 | 쌍아 |
| 🟠 P1 | AUTOPILOT 상태 정정 | 보고/PF 상태를 "원인 해소"→"투명 표기 대응 + 윈도우 점검 carry"로 정정 | 쌍아 |
| 🟡 P2 | GEO hreflang 마감 | `sitemap-static` 다국어 URL에 hreflang 추가 + 완료보고 워딩 정정 | 막내 |

---

## 부록: 검증 방법
- 직접: `gh pr list`, `ls`/`grep`(PF·인덱스), `git log`(오늘 11커밋 매핑)
- 4축 서브에이전트: AUTOPILOT diff / 보안 4건 diff / GEO hreflang diff / Imagen 모델 대조
- 대상 커밋: `898ce5a7`(AUTOPILOT) `ba32dcea`+`f41e1cd4`(보안) `94fd5b1f`(GEO) `cd56a1bf`(PF_PARTNER)

> read-only 감사. 시정은 작가님 승인 후 쌍아→막내 경로. 내부 호칭·모델 내부정보는 외부 비노출(헌법 4조 3항).
</content>
