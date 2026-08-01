---
type: completion
date: 2026-08-01
device: iMac
agent: 막내1
status: 마감
portfolio: PF_SPECS
---

# COMPLETION — 포털 prod 배포 (7/25 이후 적체 출고) + 선행 게이트 2건 확인

**[2026-08-01 17:25 KST]** iMac/막내1 → 작가님

> 작가님 직접 지시(경로②, 17:18) — "7/28 SPECS §10 '(prod 배포 중단)'이 §11로 해소됐는지 + 매팅 포털측 로직이 4060 현행과 정합인지 확인 후 prod 배포".

## 1. 결과

**prod `monkos-portal-00539-bmt` → `monkos-portal-00540-jvq` 트래픽 100%.** 게이트 2건 모두 통과 후 배포.

## 2. 게이트 ① — SPECS §10 "(prod 배포 중단)" 해소 여부 → ✅ 해소됨

- 표기 출처는 **7/25 커밋 `f5879f0a`** "[fix] SPECS §10 … (prod 배포 중단)". 7/28이 아니라 **7/25**다
- 중단 사유: §10-2 HEIC 미리보기가 재검증 3번 항목 불합격. prebuilt sharp 0.34.5에 HEVC 디코더가 없어(특허) 서버가 HEIC를 못 읽고, `normalizeImage()`가 원본으로 무음 폴백해 `측정성=true faces=null` **fail-open**이 생김
- 해소 경로: **§11이 §10-2를 대체**했다 — 미리보기를 붙이는 대신 HEIC를 확장자·MIME 정규식 양쪽에서 **제외**하고, 디코드 실패를 `degraded`로 실어 precheck·fit·generate 세 곳에서 명시 반려(+`fireRefundGate()` 선발화)
- 출고 실측: prod rev `00539-bmt` 생성 **2026-07-25 19:17 KST**, §11 커밋 `3cc9b5f7`(18:50) · 매팅 §5 `10a4e140`(19:08) 모두 그 이전 → **둘 다 이미 라이브**

**prod 번들 직접 실측** (`https://monkos.ai/js/specs-funnel.js`, 배포 전·후 동일)

```
ALLOWED_EXT = ['jpg','jpeg','jfif','png','webp']     ← heic·heif 없음
image\/(jpeg|png|webp)                                ← MIME 정규식에서도 제외
errDecode / DECODE_FAILED                             ← 디코드 실패 명시 반려 경로 존재
```

→ §10의 중단 조건은 **§11로 소멸했고 이미 prod에 반영되어 있었다.** 이번 배포의 선결 조건이 아니었다.

### 부수 정정

민아 08-01 세션로그(§128)의 *"매팅 인시던트 P0~P2 종결·SPECS 게이트 구제가 prod 미출고 적체"* 는 사실과 다르다.
`3cc9b5f7`·`10a4e140`은 7/25 `00539-bmt`에 이미 실려 있었다(리비전 생성 19:17 > 커밋 19:08). PF_SPECS README 마지막 행 기록이 정확하다.

## 3. 게이트 ② — 매팅 포털측 로직 ↔ 4060 현행 정합 → ✅ 정합

- **포털측은 무변경**: `portal/lib/matte.js`의 마지막 커밋이 `3cc9b5f7`(=prod에 이미 실린 것). 7/25 이후 포털 매팅 코드 변경 0
- **4060측은 5커밋 진행**: `3107e5f9`(외부 점유 감지) · `b4a9004a`(활성도 축) · `3cde0d5b`(잡별 텔레메트리·포화 상한) · `82b14b5a`(VRAM 축·유휴 반납) · `e2c7cc9a`(상태 시계열 로거)
- **계약면 대조 — 변화 없음**

| 축 | 포털 기대 (`lib/matte.js`) | 4060 현행 (`server.py`) | 판정 |
|----|--------------------------|------------------------|------|
| 프리플라이트 | `GET /health` (2.5s) | `@app.get("/health")` | ✅ |
| 본 호출 | `POST {url}/api/matte` | `@app.post("/api/matte")` (+`/matte`) | ✅ |
| 포화 신호 | `503` → 고장 아님, 줄서기 | 슬롯 미획득 시 `503` + **`Retry-After: 1`** | ✅ |
| 대기 예산 | Retry-After 준수, 상한 20s → 다음 엔드포인트 | `Retry-After: 1` 발행 | ✅ |
| 성공 바디 | `success` · `image` | 동일 | ✅ |

- 신설된 5커밋의 산출물(VRAM·외부 점유·활성도·시계열)은 **`/health` 관측 필드일 뿐 거절 판정에 관여하지 않는다** — `_acquire_slot()`은 `MAX_CONCURRENT` 세마포어 단일 조건. 포털이 몰라도 되는 정보다
- 신설 **`507`(GPU VRAM 부족)** 은 포털이 "포화(503)"가 아닌 "고장"으로 분류해 다음 엔드포인트로 넘긴다 — OOM은 "곧 빈다"가 아니므로 **올바른 처리**
- **4060 라이브 실측**: `status ok / model loaded / inflight 0 / max_concurrent 1 / rejected_503_total 0`, 샘플러 정상(`sampler_status ok`) → 최신 server.py가 실제로 가동 중

> ⚠️ 관측 메모(배포와 무관): 확인 시점 4060에 **외부 GPU 점유 100%**(`foreign_saturated:true`, `foreign_procs:1`)가 잡혔다. 매팅 거절 판정에는 안 쓰이지만 실행 지연 요인은 된다. 최근 매팅 완료가 22시간 전(`last_completed_age_sec 81158`)이라 현재 영향 없음.

## 4. 동반 출고분 — 실측

민아 보고의 "11커밋·42파일"은 레포 전체 기준이며, **prod 이미지에 실제로 실리는 포털 코드 변경**은 3커밋뿐이다.

| 커밋 | 내용 | prod 영향 |
|------|------|----------|
| `612e4c7d` | `portal/deploy.sh` 1행 — preview 환경 `MIN_INSTANCES 1→0` | **없음** (preview 전용 분기, prod 블록 무수정) |
| `3819809d` | `public/proto/hero-demo.html` + 히어로 이미지 10장(webp ~3.5MB) | 정적 파일 신설 |
| `a6b2ed18` | FACEREAD Phase A — 어드민 리포트 + 사주 엔진 + API 2종 + `server.js` +5행 | 어드민 전용 |

- 나머지 8커밋은 전부 `monkos-ops/` 문서(로그·브리핑·제안서)로 이미지에 포함되지 않는다
- **선탑승 점검**(7/25 사고 재발 방지): 배포 직전 `git status -- monkos_AI/portal/` **변경 0건** 확인. 워킹트리의 미커밋 파일은 전부 타 에이전트의 `monkos-ops/` 문서

## 5. 배포 후 라이브 검증

| 표면 | 결과 |
|------|------|
| `/health` | 200 (0.39s) |
| `/` | 200 (1.54s) |
| `/specs/passport/kr` | 200 (0.44s) |
| `/js/specs-funnel.js` §11 회귀 | 200 — `ALLOWED_EXT` heic 없음 · MIME `jpeg\|png\|webp` · `DECODE_FAILED` 존재 |
| `/credits` · `/pricing` | 200 · 200 |
| `/admin/gwansang.html` · `/api/admin/gwansang/data` | **401** (미인증 차단 정상) |
| 4060 `/health` | ok · model loaded |
| `idphoto-kr.monkos.ai` | 200 |

`/idphoto` 404는 회귀가 아니다 — 포털에 해당 라우트가 없고 증명사진 표면은 별도 서비스(`idphoto-kr.monkos.ai`)다.

## 6. ⏳ 보고 후 대기 — 지시 범위 밖이라 손대지 않은 건

**`https://monkos.ai/proto/hero-demo.html`이 지금 공개 상태다** (200 실측).
`noindex` 메타가 없고 `robots.txt`에도 `/proto` 제외가 없다. 사이트맵에는 없어 크롤러 발견 가능성은 낮지만, 링크가 생기면 미완성 프로토타입이 색인될 수 있다.
쌍아·꾸 산출물이라 임의 수정하지 않았다. 필요하시면 둘 중 하나로 1행이면 닫힌다 — ① `robots.txt`에 `Disallow: /proto` ② `hero-demo.html`에 `<meta name="robots" content="noindex, nofollow">`.

## 7. 롤백

```
gcloud run services update-traffic monkos-portal --region us-central1 \
  --to-revisions monkos-portal-00539-bmt=100
```
