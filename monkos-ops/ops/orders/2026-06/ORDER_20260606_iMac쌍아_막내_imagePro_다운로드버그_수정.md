---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내
subject: image_pro 다운로드 버그 수정 — VARIATION 모드에서 원본 이미지 다운로드되는 문제
status: 대기
portfolio: PF_IMAGEN
---

# 지시서: image_pro 다운로드 버그 수정

> **증상**: T2I로 이미지 생성 → I2I(VARIATION)로 변주 → 다운로드 시 변주 결과가 아닌 원본 T2I 이미지가 다운로드됨. 내보내기(EXPORT) 단컷도 동일. "모두 받기"에서만 변주 이미지가 정상 다운로드됨.
> **수정 대상**: `apps/monk_imagen4/backend/public/app/assets/index-v6.js` (프로덕션 v6 빌드 번들 직접 패치)

---

## 1. 원인 분석

### 다운로드 함수 `gi()` (v6 번들 내 minified)

```javascript
const gi = async () => {
  const z = Z.find(Y => Y.id === Tl);   // Z = history 배열, Tl = 현재 선택된 이미지 ID
  const B = b || z?.url;                  // b = 확대/refine 이미지 URL, z.url = history의 URL
  if (B) {
    // ... cloud save 시도 ...
    const Y = document.createElement("a");
    Y.href = B;                           // ← 여기서 B가 결정
    Y.download = `MONK_ARTIFACT_${Date.now()}.png`;
    Y.click();
  }
};
```

**문제**: `b` 변수가 이중 역할을 한다.
1. 이미지 클릭으로 확대(expand) 시 → `b`에 원본 URL 세팅
2. refine(VARIATION) 결과 수신 시 → `b`에 변주 결과 URL 세팅

T2I 생성 → 이미지 클릭(확대) → VARIATION 실행 시, `b`가 **확대 시점의 원본 URL**로 남아있고, refine 결과가 `b`를 덮어쓰지 못하면 원본이 다운로드됨.

### 배치 내보내기 `vi()` — "모두 받기"가 정상인 이유

```javascript
const vi = async () => {
  for (let z = 0; z < Z.length; z++) {
    const B = Z[z];
    Y.href = B.url;   // ← history 배열의 url을 직접 참조
  }
};
```

history 배열 `Z`에는 refine 결과가 새 항목으로 추가되므로, 순회 시 변주 이미지가 포함됨. 그래서 "모두 받기"에서는 정상.

---

## 2. 수정 방안

### 수정 포인트 1: refine 결과 수신 후 `b` 갱신 보장

v6 번들에서 refine 호출 후 결과를 처리하는 부분을 찾아, `b` (확대 이미지 변수)를 refine 결과 URL로 갱신되도록 한다.

**찾는 방법**: v6 번들에서 `refineImage` 호출 후 처리 블록을 검색:
```
Kf.refineImage(
```
이 호출의 `.then()` 또는 결과 처리 블록에서 `D(결과URL)` (= `setExpandedImage`에 해당하는 setter)이 호출되는지 확인.

- 호출되지 않으면 → `D(결과URL)` 추가
- 호출되는데 조건부로 빠지면 → 조건 수정

### 수정 포인트 2: 단컷 다운로드 `gi()`에서 최신 이미지 우선 참조

현재: `const B = b || z?.url`
- `b`가 있으면 `b` 사용 → 이게 stale일 때 문제

수정 방안: refine 결과가 history `Z`에 추가된 경우, 가장 최근 history 항목의 URL을 우선 사용하도록 변경하거나, `gi()` 내에서 현재 화면에 표시된 이미지를 직접 참조.

### 수정 포인트 3: 모드 전환 시 `b` 초기화

T2I → I2I 전환 시 `b`를 null로 초기화하여, stale URL이 남지 않도록:
```javascript
// 모드 전환 핸들러에서
D(null);  // b = null 초기화
```

v6 번들에서 모드 전환 코드:
```
onClick:()=>{U(bl.id),et(null)}
```
여기에 `D(null)` 추가:
```
onClick:()=>{U(bl.id),et(null),D(null)}
```

---

## 3. 작업 절차

### Step 1: v6 번들 백업

```bash
cp apps/monk_imagen4/backend/public/app/assets/index-v6.js \
   apps/monk_imagen4/backend/public/app/assets/index-v6.js.bak
```

### Step 2: refine 결과 → b 갱신 확인

v6 번들에서 `Kf.refineImage` 호출 후 결과 처리 블록을 찾는다:
```bash
grep -oP '.{0,300}refineImage.{0,500}' apps/monk_imagen4/backend/public/app/assets/index-v6.js
```

결과 처리에서 `D(` (= b setter) 호출 여부 확인. 없으면 refine 결과 URL을 `D()`에 세팅하는 코드 추가.

### Step 3: 모드 전환 시 b 초기화

v6 번들에서 모드 전환 핸들러를 찾는다:
```
onClick:()=>{U(bl.id),et(null)}
```
→ 수정:
```
onClick:()=>{U(bl.id),et(null),D(null)}
```

### Step 4: 로컬 검증

```bash
cd apps/monk_imagen4/backend && node server.js
```
브라우저에서 `localhost:8080/app/` 접속 → T2I 생성 → VARIATION → 다운로드 → 변주 이미지가 내려오는지 확인.

### Step 5: 배포

```bash
cd apps/monk_imagen4/backend && ./deploy.sh production
```

---

## 4. ⚠️ 준수 조항

- **v6 번들 백업 필수**: 수정 전 `.bak` 백업. 문제 시 즉시 롤백 가능하도록.
- **minified JS 수정 시 주의**: 세미콜론, 콤마 하나가 전체를 깨뜨림. 수정 후 `node -c index-v6.js`로 문법 검증.
- **ch5 배포**: deploy.sh 경유 필수.
- **헌법 4조 1항**: API 키 하드코딩 금지.

---

## 5. 참조

| 용도 | 경로 |
|------|------|
| v6 번들 (수정 대상) | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` |
| 백엔드 server.js | `apps/monk_imagen4/backend/server.js` |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |
| 막내3 구조 보고서 | `monkos-ops/ops/completions/2026-06/COMPLETION_20260606_막내3_imagePro_코드구조_전수조사.md` |

### v6 번들 주요 변수 매핑 (minified → 의미)

| minified | 의미 |
|----------|------|
| `Z` | history 배열 (생성된 이미지 전체) |
| `Tl` | 현재 선택된 이미지 ID |
| `b` | 확대/refine 이미지 URL |
| `D` | `b`의 setter (`D(null)` → 초기화) |
| `Ll` | 현재 배치 URL 배열 |
| `gi` | 단컷 다운로드 함수 |
| `vi` | 전체 내보내기 함수 |
| `Pn` | 현재 배치 내보내기 함수 |
| `Kf.refineImage` | I2I/VARIATION API 호출 |
| `Kf.generateBatch` | T2I 생성 API 호출 |
| `Kf.analyzeImage` | 이미지 분석(리버스 프롬프트) API 호출 |
| `Gf` | API 베이스 URL (`"https://image.monkos.ai"`) |

---

## 6. 완료 기준

- [ ] v6 번들 백업 완료 (.bak)
- [ ] refine 결과 → `b` (D setter) 갱신 확인/수정
- [ ] 모드 전환 시 `D(null)` 초기화 추가
- [ ] `node -c index-v6.js` 문법 검증 통과
- [ ] 로컬 테스트: T2I → VARIATION → 단컷 다운로드 → 변주 이미지 확인
- [ ] deploy.sh production 배포
- [ ] 커밋: `[fix] image_pro 다운로드 버그 — VARIATION 결과 다운로드 정상화`
