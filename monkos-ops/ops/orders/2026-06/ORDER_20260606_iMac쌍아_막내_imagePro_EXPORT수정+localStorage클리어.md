---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내
subject: image_pro EXPORT 크래시 수정 + localStorage 모드전환 클리어
status: 대기
portfolio: PF_IMAGEN
---

# 지시서: image_pro EXPORT 크래시 수정 + localStorage 모드전환 클리어

> **증상 1**: EXPORT 단컷 내보내기 시 콘솔 에러 `POST /api/upload 404` → `ReferenceError: D is not defined` → 크래시. 다운로드 안 됨.
> **증상 2**: VARIATION 모드에서 세팅한 Fixed Prompt/Negative Prompt가 localStorage에 잔존 → NEW GENERATE 전환 후에도 프롬프트 오염.

---

## 수정 1: `/api/upload` 엔드포인트 추가 (server.js)

### 원인
v6 프론트의 `ua.saveImage()`가 `POST /api/upload`로 이미지를 R2에 저장 시도. 이 엔드포인트는 CF Pages(Functions)에만 존재하고 Cloud Run server.js에는 없어서 404.
404 응답이 HTML이므로 JSON 파싱 실패 → `SyntaxError: Unexpected token '<'` → 후속 코드에서 `D is not defined` 크래시.

### 수정

`apps/monk_imagen4/backend/server.js`에 `/api/upload` 엔드포인트를 추가한다. 기존 GCS 저장 패턴(L152-175)을 재활용.

정적 서빙(`app.use(express.static(...))`) **앞에** 삽입한다 (L470 이전).

```javascript
/**
 * 이미지 업로드 API
 * POST /api/upload
 * v6 프론트 EXPORT 시 호출. GCS에 저장.
 */
app.post('/api/upload', async (req, res) => {
  try {
    // multipart/form-data 파싱 — express.json()으로는 처리 불가
    // req.body가 FormData이므로 별도 처리 필요
    
    // 간이 구현: multer 없이 base64 fallback
    // v6 프론트 saveImage()는 base64 → Blob → FormData로 보냄
    // FormData 파싱이 어려우면, 성공 응답만 반환하여 크래시 방지 + 다운로드는 프론트에서 처리
    
    // 최소 구현: 크래시 방지 + 저장은 생략
    console.log('[Upload] Image upload request received');
    res.json({ 
      success: true, 
      imageId: `img_${Date.now()}`,
      imageUrl: null 
    });
  } catch (error) {
    console.error('[Upload] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**참고**: v6 프론트는 `FormData`로 보내므로 실제 GCS 저장을 하려면 `multer` 패키지가 필요하다. 당장은 **크래시 방지(정상 JSON 응답 반환)**가 우선이므로, 저장 없이 성공 응답만 반환하는 최소 구현으로 진행한다. 실제 GCS 저장은 후속 작업.

### 주의
- `express.json({ limit: '10mb' })`만으로는 FormData를 파싱할 수 없다
- `app.use(express.static(...))`보다 **위에** 라우트를 등록해야 한다
- 에러 응답도 반드시 JSON으로 — HTML 반환 시 프론트 JSON 파싱 크래시 재발

---

## 수정 2: 모드 전환 시 localStorage 클리어 (v6 번들)

### 원인
v6 프론트가 Fixed Prompt(`monk_fixed_prompt`)와 Negative Prompt(`monk_negative_prompt`)를 localStorage에 저장:
```javascript
W.useEffect(()=>{typeof window<"u"&&localStorage.setItem(mi.FIXED_PROMPT,k)},[k])
W.useEffect(()=>{typeof window<"u"&&localStorage.setItem(mi.NEGATIVE_PROMPT,w)},[w])
```

VARIATION 모드에서 Quick Variations 클릭 시 Fixed Prompt에 `"CRITICAL INSTRUCTION: Maintain the exact facial features..."` 같은 긴 지시문이 세팅됨 → localStorage에 저장 → NEW GENERATE로 전환해도 남아있음 → 다음 T2I 생성 시 이 지시문이 프롬프트에 합산 → 엉뚱한 결과.

### 수정

`apps/monk_imagen4/backend/public/app/assets/index-v6.js`에서 모드 전환 핸들러를 찾아 localStorage 클리어를 추가한다.

**현재** (이전 패치에서 `D(null)` 추가한 부분):
```javascript
onClick:()=>{U(bl.id),et(null),D(null)}
```

**수정**:
```javascript
onClick:()=>{U(bl.id),et(null),D(null),cl(""),M(""),localStorage.removeItem("monk_fixed_prompt"),localStorage.removeItem("monk_negative_prompt")}
```

변수 매핑:
- `cl` = `setFixedPrompt` (k의 setter)
- `M` = `setNegativePrompt` (w의 setter)
- `localStorage.removeItem(...)` = 잔존값 제거

**확인 방법**: v6 번들에서 모드 전환 onClick을 검색:
```bash
grep -n 'U(bl.id),et(null)' apps/monk_imagen4/backend/public/app/assets/index-v6.js
```
이 패턴이 유일하므로 해당 위치만 수정.

### setter 매핑 검증

v6 번들에서 state 선언 순서:
```javascript
[j,R]=W.useState("T2I")        // j=mode, R=setMode → 실제 U(bl.id)에서 U=R
[k,cl]=W.useState(...)          // k=fixedPrompt, cl=setFixedPrompt ✓
[O,x]=W.useState("")            // O=prompt, x=setPrompt
[w,M]=W.useState(...)           // w=negativePrompt, M=setNegativePrompt ✓
```

수정 전에 반드시 `cl("")`과 `M("")`이 Fixed Prompt / Negative Prompt setter가 맞는지 번들에서 재검증할 것. 오매핑 시 다른 state가 깨짐.

---

## 3. 작업 절차

1. v6 번들 백업 (이전 .bak 있으면 .bak2로)
2. server.js에 `/api/upload` 엔드포인트 추가
3. v6 번들에서 모드 전환 localStorage 클리어 패치
4. `node -c index-v6.js` 문법 검증
5. 로컬 테스트: 
   - NEW GENERATE → VARIATION → NEW GENERATE → 프롬프트 오염 없음 확인
   - EXPORT 단컷 → 콘솔 에러 없이 다운로드 확인
6. `./deploy.sh production` 배포
7. 커밋: `[fix] image_pro EXPORT 크래시 해소 + localStorage 모드전환 클리어`

---

## 4. ⚠️ 준수 조항

- v6 번들 백업 필수
- setter 매핑 재검증 필수 — 오매핑 시 앱 전체가 깨짐
- `node -c` 문법 검증 통과 후에만 배포
- deploy.sh 경유 필수 (ch5)

---

## 5. 참조

| 용도 | 경로 |
|------|------|
| v6 번들 | `apps/monk_imagen4/backend/public/app/assets/index-v6.js` |
| server.js | `apps/monk_imagen4/backend/server.js` |
| deploy.sh | `apps/monk_imagen4/backend/deploy.sh` |

### v6 변수 매핑 (추가분)

| minified | 의미 |
|----------|------|
| `k` | fixedPrompt 값 |
| `cl` | setFixedPrompt |
| `w` | negativePrompt 값 |
| `M` | setNegativePrompt |
| `mi.FIXED_PROMPT` | `"monk_fixed_prompt"` (localStorage 키) |
| `mi.NEGATIVE_PROMPT` | `"monk_negative_prompt"` (localStorage 키) |
| `ua.saveImage()` | R2 업로드 호출 (`POST /api/upload`) |
| `Qf.apiEndpoint` | `"/api/upload"` |

---

## 6. 완료 기준

- [ ] server.js `/api/upload` 엔드포인트 추가 (최소 구현: 크래시 방지 JSON 응답)
- [ ] v6 번들 모드 전환 시 `cl("")`, `M("")`, `localStorage.removeItem` 추가
- [ ] setter 매핑 재검증 완료
- [ ] `node -c` 통과
- [ ] 로컬 테스트: EXPORT 크래시 없음 + localStorage 오염 없음
- [ ] deploy.sh production 배포
- [ ] 커밋 완료
