---
type: order
id: ORDER_20260302_iMac쌍아_막내3_v5_Wave2C_충전페이지
date: "2026-03-02 17:24 KST"
from: 쌍아
to: 막내3
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
  - monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달.md
---

# 지시서: v5 Wave 2-C — 충전 페이지 (charge.html 신규 + 호출부 수정)

> **[2026-03-02 17:24 KST] iMac/쌍아 → 막내3**

## 역할 선언
> **너는 "막내3"이다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내3 → iMac/쌍아` 형식

---

## 배경

Wave 1 완료. v5 퍼널에서 충전 UI가 모달 오버레이 → 풀페이지로 변경된다.

현행: `ChargeModule.show()` → 모달 오버레이 (charge.js)
v5: `navigateTo('charge.html?return=result&action=download')` → 별도 페이지

**병렬 작업 중**: 막내1(prep.js), 막내2(server.js) 동시 진행.

---

## 임무

1. `charge.html` 신규 페이지 생성
2. `result.js`의 ChargeModule 호출부를 페이지 이동으로 교체
3. `shared.js`의 `showChargeModal()` 함수를 페이지 이동으로 교체

---

## 변경 1: charge.html 신규 생성

`monkos_AI/idphoto-kr/public/charge.html` 생성.

### 페이지 구조

```
[헤더] MONKOS 크레딧 충전
[현재 잔액 표시] 현재 {credits}c

[패키지 카드 3종]
  📸 증명사진 1장  — 80c / ₩3,900
  📸📸 증명사진 2장 — 160c / ₩6,900
  📸📸📸📸 4장 + 풀샷 — 340c / ₩12,900

[소액 충전 스테퍼]
  - / + 버튼, 10c 단위 (10c~100c)

[결제 버튼]
  "₩{금액} 결제하기" → buyCreditsKR(amount, credits)

[돌아가기 버튼]
  → return 파라미터로 복귀
```

### 핵심 로직

```javascript
import { store, Monk, sharedInit, buyCreditsKR, initFromTossResult, navigateTo } from './shared.js';

async function init() {
  await sharedInit();

  // 토스 결제 완료 복귀 처리
  // (successUrl이 charge.html로 돌아오므로 여기서 처리)
  // initFromTossResult()는 sharedInit 내에서 이미 호출됨

  // URL 파라미터로 복귀 경로 파악
  const params = new URLSearchParams(location.search);
  const returnPage = params.get('return') || 'result';
  const returnAction = params.get('action') || '';

  // 결제 완료 후 자동 복귀 (크레딧 갱신 확인 시)
  // 토스 결제 성공 → sharedInit → initFromTossResult → credits 갱신
  // → 돌아가기 버튼 또는 자동 복귀

  renderChargePage(returnPage, returnAction);
}
```

### 토스 결제 연동

현행 `buyCreditsKR()` (shared.js)의 `successUrl`이 `window.location.pathname`을 사용하므로, charge.html에서 호출하면 자동으로 charge.html로 리다이렉트된다. **수정 불필요.**

결제 완료 후 "돌아가기" 버튼:
```javascript
function goBack() {
  const params = new URLSearchParams(location.search);
  const returnPage = params.get('return') || 'result';
  navigateTo(`${returnPage}.html`);
}
```

### HTML 기본 구조

기존 prep.html의 `<head>` 섹션(메타, 폰트, 스타일시트, 토스스크립트)을 그대로 복사. body만 신규.

---

## 변경 2: server.js 라우트 추가

`server.js`의 페이지 라우트 섹션에 charge 페이지 추가:

```javascript
app.get('/charge', (req, res) => res.sendFile(join(publicDir, 'charge.html')));
```

**주의**: 막내2가 server.js를 동시 수정 중. 이 라우트 1줄은 다른 라우트 근처에 추가하되, 막내2의 /api/idgen 수정과 충돌하지 않는 위치에 추가하라. 라우트 정의 섹션 (GET 라우트들이 모여있는 곳) 에 추가.

---

## 변경 3: result.js — ChargeModule 호출부 교체

### 현행 호출 패턴 (8곳)
```javascript
ChargeModule.show();
```

### v5 교체
```javascript
navigateTo('charge.html?return=result&action=download');
```

**구체적 수정 위치** (result.js):
| 라인 | 현행 | 변경 |
|------|------|------|
| L16 | `import { ChargeModule } from './modules/charge.js'` | 삭제 |
| L278 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=generate')` |
| L348 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=download')` |
| L371 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=download')` |
| L482 | `ChargeModule.mountInline(mount)` | 인라인 충전 버튼 → charge.html 링크로 교체 |
| L540 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=crop')` |
| L555 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=crop')` |
| L581 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=full')` |
| L610 | `ChargeModule.show()` | `navigateTo('charge.html?return=result&action=full')` |

### result.js import 수정
`navigateTo`가 이미 shared.js에서 import되고 있는지 확인. 안 되어 있으면 추가.

---

## 변경 4: shared.js — showChargeModal 교체

### 현행 (L111-114)
```javascript
export async function showChargeModal() {
  const { ChargeModule } = await import('./modules/charge.js');
  ChargeModule.show();
}
```

### v5 변경
```javascript
export function showChargeModal() {
  navigateTo('charge.html?return=' + encodeURIComponent(location.pathname.replace('.html', '').replace('/', '')));
}
```

이렇게 하면 헤더 크레딧 배지 클릭 시에도 charge.html로 이동하되, 현재 페이지로 복귀할 수 있다.

---

## 변경하지 않는 것

| 파일 | 이유 |
|------|------|
| modules/charge.js | 삭제하지 않는다 (일본 서비스에서 참조 가능). 비활성 상태로 유지 |
| prep.js / prep.html | 막내1 영역 |
| config.js | Wave 1 완료 — 변경 금지 |
| camera.js | Wave 3 영역 |

---

## 수정 범위

| 파일 | 작업 |
|------|------|
| **charge.html** (신규) | 충전 풀페이지 생성 |
| **result.js** | ChargeModule 호출 8곳 → navigateTo 교체 |
| **shared.js** | showChargeModal() 1곳 교체 |
| **server.js** | GET /charge 라우트 1줄 추가 |

---

## 검증 체크리스트

| # | 점검 항목 |
|---|----------|
| 1 | charge.html 파일 존재 + 브라우저에서 렌더링 가능 |
| 2 | charge.html에서 3패키지 + 소액스테퍼 표시 |
| 3 | charge.html "돌아가기" 버튼 → return 파라미터 기준 복귀 |
| 4 | result.js에서 `ChargeModule` import 제거됨 |
| 5 | result.js에서 `ChargeModule.show()` 0건 (grep) |
| 6 | result.js에서 `navigateTo('charge.html` 존재 |
| 7 | shared.js showChargeModal이 charge.html로 이동 |
| 8 | server.js `/charge` 라우트 존재 |
| 9 | `node --check` result.js, shared.js — 문법 오류 없음 |

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: 토스 키 기존 값 그대로 유지
- 헌법 8조: charge.js 삭제 금지 (비활성 유지)
- **정본**: SCHEMA_v5_확정.md + 기획안 §충전 섹션. 충돌 시 SCHEMA 우선.
- **prep.js, camera.js, config.js 수정 금지**

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | charge.html(신규) + result.js + shared.js + server.js(라우트 1줄) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
