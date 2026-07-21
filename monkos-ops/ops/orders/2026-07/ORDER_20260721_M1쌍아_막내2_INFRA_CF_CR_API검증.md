---
type: order
date: 2026-07-21
device: M1
agent: 쌍아
target: 막내2
portfolio: PF_INFRA
status: 발행
---

# 지시서 — 아키텍처 전환 Phase 0: monk.kr에서 CF→CR API 검증

**[2026-07-21 14:47 KST]** M1/쌍아 → 막내2

> 목표: CF Pages(monk.kr)에서 정적 HTML → CR(monkos.ai) API 호출이 정상 작동하는지 검증.
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md` §3
> 발단: 7/21 PSI 실측 → CR 모놀리스 비효율 → CF(서빙)+CR(API) 분리 설계 → Phase 0 검증

---

## ⚠️ 준수 조항

- **CR 코드 무변경**: 이 지시서는 monk.kr 쪽만 작업. portal server.js 수정 금지.
- **기존 monk.kr 페이지 무변경**: 신규 디렉토리에만 작업.
- **시크릿 비접촉**: API 키·토큰 코드 하드코딩 금지.
- **배포**: `wrangler pages deploy MONK_kr/` (기존 monk.kr CF 배포 경로)

---

## §1 테스트 페이지 생성

### 위치

```
MONK_kr/
  api_test/
    index.html      테스트 페이지
```

### 내용

정적 HTML 1장. 아래 검증 항목을 버튼으로 나열하고, 결과를 화면에 표시.

---

## §2 검증 항목 (5종)

### T1 — CORS 기본 호출

```javascript
fetch('https://monkos.ai/api/stats', { method: 'GET' })
```

- 기대: 200 응답 또는 CORS 에러
- CORS 에러 시: 정확한 에러 메시지 기록 (후속 CR CORS 헤더 추가 판단 재료)

### T2 — 파일 업로드

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
fetch('https://monkos.ai/api/idphoto/precheck', {
  method: 'POST',
  body: formData
})
```

- 기대: CORS 허용 시 정상 응답 / 불허 시 CORS 에러
- 파일: 테스트 이미지 1장 (정적 포함 또는 `<input type="file">`)

### T3 — IP 확인

```javascript
// monkos.ai에 IP 반환 엔드포인트가 없으므로, 외부 서비스로 CF Pages에서의 클라이언트 IP 확인
fetch('https://httpbin.org/ip')
```

- 기대: 클라이언트 실제 IP (CF 프록시 IP 아님)
- 이 결과와 CR 쪽 인식 IP 비교 → IP 소실 여부 판정 재료

### T4 — 쿠키 도메인

```javascript
document.cookie = 'test_cf=1; domain=.monkos.ai; path=/';
fetch('https://monkos.ai/api/stats', {
  credentials: 'include'
})
```

- 기대: `.monkos.ai` 쿠키가 CR로 전달되는지 확인
- monk.kr 도메인에서 monkos.ai 쿠키 설정 자체가 불가할 수 있음 → 그 결과도 기록

### T5 — 응답 시간 측정

```javascript
const t0 = performance.now();
const res = await fetch('https://monkos.ai/api/stats');
const t1 = performance.now();
console.log(`${t1 - t0}ms`);
```

- 5회 반복 → 평균·최대·최소 기록
- CF Pages 자체 로딩 시간도 측정 (navigation timing)

---

## §3 배포 및 실행

1. `MONK_kr/api_test/index.html` 작성
2. `wrangler pages deploy MONK_kr/` (기존 배포 명령)
3. 브라우저에서 `https://monk.kr/api_test/` 접속
4. 각 테스트 버튼 실행 → 결과 기록

---

## §4 부수 실측 — billing SKU 분해

GCP 콘솔 또는 CLI로 현재 Cloud Run 비용 실측:

```bash
# 최근 30일 billing 확인
gcloud billing accounts list
# 또는 billing export가 BQ에 있으면 조회
```

확인 대상:
- monkos-portal: 월 실비용
- monkos-portal-dev: 월 실비용
- crop-engine: 월 실비용 (쌍아 추정 ₩100K vs 7/18 실측 ₩10K 모순 해소)

> billing 접근 불가 시 작가님에게 요청.

---

## §5 완료 기준

- [ ] `MONK_kr/api_test/index.html` 배포 완료
- [ ] T1~T5 검증 결과 전량 기록
- [ ] billing SKU 분해 (가능한 범위)
- [ ] COMPLETION 보고서 — 검증 결과표 + 스크린샷
- [ ] PF_INFRA 히스토리 1행 어펜드

---

## §6 결과에 따른 분기

| T1 CORS | 후속 |
|---------|------|
| 통과 | Phase 1 직행 (CORS 무변경) |
| 차단 | CR server.js에 CORS 헤더 추가 지시서 발행 (쌍아) 또는 CF Workers 프록시 설계 |

| T3 IP | 후속 |
|-------|------|
| 실제 IP | IP 소실 크리티컬 해소 |
| CF IP | CF→CR 직접 호출 불가 → Workers 프록시 + CF-Connecting-IP 포워딩 필수 |

| T4 쿠키 | 후속 |
|---------|------|
| 전달됨 | 인증 체계 무변경 |
| 차단 | 서브도메인 전략 또는 Workers 프록시 필수 |
