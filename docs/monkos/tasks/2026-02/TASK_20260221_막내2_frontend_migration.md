# 지시서: idphoto-kr 프론트엔드 MPA 이식

```
[2026-02-21 19:10 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내2"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내1이 server.js를 동시 수정 중
> - **네 수정 범위**: `monkos_AI/idphoto-kr/public/` 디렉토리만

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | photolab MPA 프론트엔드 → idphoto-kr 이식 |
| **수정 대상** | `monkos_AI/idphoto-kr/public/` |
| **원본 소스** | `MONK_kr/ai_lab/photolab/` |
| **브랜치** | `develop` |
| **긴급도** | 높음 (이관 Phase 2) |
| **백업 태그** | `pre-migration-kr-20260221` |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **법률 제2장**: monk.js Store/Pipe 패턴 유지

## ⚠️ 파일 충돌 방지

- `server.js` 수정 금지 (막내1 담당)
- `MONK_kr/`, `functions/` 수정 금지
- `package.json` 수정 금지 (막내1 담당)

---

## 배경

monk.kr/ai_lab/photolab의 MPA 프론트엔드(5페이지 + 프레임워크)를 idphoto-kr/public/으로 이식한다.
기존 idphoto-kr의 SPA(index.html 96KB)는 `_legacy_spa/`로 보관한다.

### monkos.ai와 monk.kr은 별개의 세계

이것은 단순 복사가 아니다. **config.js의 API 경로와 인증 흐름이 변경**된다.
- CF Workers 상대경로 → Cloud Run 상대경로 (대부분 동일, 일부 경로명 차이)
- 크레딧 프록시(CF→Cloud Run→Portal) → Cloud Run 직접

---

## 현재 photolab 파일 목록 (이식 대상)

```
MONK_kr/ai_lab/photolab/
├── index.html        ← LP (랜딩)
├── prep.html         ← 준비실 (9스텝 퍼널)
├── camera.html       ← 촬영실 (카메라+코칭)
├── result.html       ← 분석실 (생성+다운로드)
├── thankyou.html     ← 수령처
├── app.css           ← 공통 스타일
├── config.js         ← 환경설정+상수
├── monk.js           ← 프레임워크 코어
├── shared.js         ← 공통 로직
├── prep.js           ← 준비실 로직
├── camera.js         ← 촬영실 로직
├── result.js         ← 분석실 로직
├── thankyou.js       ← 수령처 로직
└── options.js        ← 옵션 N 로직
```

---

## 작업 내역

### TASK 1: 기존 SPA 백업

```bash
mkdir -p monkos_AI/idphoto-kr/public/_legacy_spa
mv monkos_AI/idphoto-kr/public/index.html monkos_AI/idphoto-kr/public/_legacy_spa/
```

기존 `landing.html`, `privacy.html`, `refund.html`, `terms.html`, `monkos-icon.svg`, `og-image.png`은 그대로 유지.

### TASK 2: MPA 파일 복사

photolab의 프로덕션 파일을 `monkos_AI/idphoto-kr/public/`으로 복사:

```bash
# HTML 페이지 (index.html은 LP이므로 이름 변경 불필요 — landing.html이 이미 있음)
cp MONK_kr/ai_lab/photolab/prep.html monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/camera.html monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/result.html monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/thankyou.html monkos_AI/idphoto-kr/public/

# CSS
cp MONK_kr/ai_lab/photolab/app.css monkos_AI/idphoto-kr/public/

# JS 프레임워크
cp MONK_kr/ai_lab/photolab/monk.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/config.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/shared.js monkos_AI/idphoto-kr/public/

# JS 페이지별
cp MONK_kr/ai_lab/photolab/prep.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/camera.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/result.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/thankyou.js monkos_AI/idphoto-kr/public/
cp MONK_kr/ai_lab/photolab/options.js monkos_AI/idphoto-kr/public/
```

### TASK 3: config.js 수정 — API 경로 조정

**원본 (monk.kr CF Workers 기준):**
```javascript
export const API = {
  PORTAL_URL: 'https://monkos.ai',
  PRECHECK: '/api/precheck',
  GENERATE: '/api/idgen',
  CREDIT_USE: '/api/idphoto-credit-use',
  COACHING: 'https://monkos.ai/api/coaching',
  QC: 'https://monkos.ai/api/qc',
};
```

**변경 (Cloud Run 기준):**
```javascript
export const API = {
  PORTAL_URL: 'https://monkos.ai',
  PRECHECK: '/api/precheck',           // 동일 (막내1이 라우트 추가)
  GENERATE: '/api/idgen',              // 동일 (막내1이 라우트 추가)
  CREDIT_USE: '/api/credit/use',       // 변경! CF 프록시 → Cloud Run 직접
  COACHING: '/api/coaching',            // 변경! 절대URL → 상대경로 (같은 서버)
  QC: '/api/qc',                       // 변경! 절대URL → 상대경로 (같은 서버)
};
```

변경 포인트 3개:
1. `CREDIT_USE`: `/api/idphoto-credit-use` → `/api/credit/use` (Cloud Run 네이티브 경로)
2. `COACHING`: `https://monkos.ai/api/coaching` → `/api/coaching` (같은 서버에서 서빙)
3. `QC`: `https://monkos.ai/api/qc` → `/api/qc` (같은 서버에서 서빙)

### TASK 4: shared.js 수정 — Pipe 엔드포인트 일치 확인

shared.js의 Pipe 설정 (줄 79-87)에서 `creditUse` 경로가 config.js API.CREDIT_USE와 일치하는지 확인.

현재:
```javascript
creditUse: { method: 'POST', url: API.CREDIT_USE },
```

config.js의 `CREDIT_USE`를 변경했으므로 Pipe에서 자동 반영됨. **추가 수정 불필요 — 확인만.**

### TASK 5: navigateTo() 경로 패턴 확인

현재 navigateTo는 `.html` 확장자를 사용:
```javascript
navigateTo('camera.html')  // → location.href = 'camera.html'
```

Cloud Run의 Express는 `express.static`으로 `.html` 파일을 직접 서빙하므로, `camera.html` 경로 그대로 동작한다.

**변경 불필요 — 확인만.**

단, MPA 라우트(`/camera`)와 정적 파일(`/camera.html`) 양쪽 다 동작하도록 막내1이 server.js에 라우트를 추가함.

### TASK 6: HTML 내 외부 링크 확인 및 조정

각 HTML 파일에서 `monkos.ai` 관련 외부 링크가 올바른지 확인:

1. **파비콘/OG 이미지**: `https://monkos.ai/favicon-32.png`, `https://monkos.ai/og-image.png`
   - idphoto-kr/public/에 `og-image.png`이 이미 있으므로 상대경로로 변경 가능
   - 하지만 절대경로도 동작하므로 **우선 유지**

2. **토스페이먼츠 SDK**: `<script src="https://js.tosspayments.com/v2/standard"></script>`
   - **그대로 유지** (외부 CDN)

3. **Google Fonts**: `fonts.googleapis.com`
   - **그대로 유지** (외부 CDN)

### TASK 7: 캐시 버스터 확인

각 HTML의 JS 로딩 태그에서 캐시 버스터 버전 확인:

```html
<!-- 예: result.html -->
<script type="module" src="result.js?v=20260221b"></script>
```

monkos.ai 이관 후 새 버전으로 갱신:
- 모든 JS 로딩의 `?v=` 파라미터를 `?v=migration01`로 통일

---

## 금지 사항

- `server.js` 수정 금지 (막내1 담당)
- `package.json` 수정 금지 (막내1 담당)
- `landing.html` 수정 금지 (기존 LP 유지)
- `privacy.html`, `refund.html`, `terms.html` 수정 금지
- API 키 하드코딩 금지
- `.html` 확장자 기반 navigateTo 패턴 변경 금지

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | `develop` 브랜치에 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | `main` 머지 + 배포 | **금지** — 작가님 별도 지시 시에만 |

### 커밋 메시지 형식

```
[migration] photolab MPA 프론트엔드 → idphoto-kr/public/ 이식

지시서: TASK_20260221_막내2_frontend_migration.md
```

---

## 완료 조건

1. 기존 SPA가 `_legacy_spa/`로 백업됨
2. MPA 14파일이 `public/`에 배치됨 (4 HTML + 1 CSS + 9 JS)
3. config.js의 API 경로 3개 변경 완료 (CREDIT_USE, COACHING, QC)
4. navigateTo 패턴 호환 확인
5. 캐시 버스터 통일
6. develop 커밋 + push 완료
7. 완료 보고 발신
