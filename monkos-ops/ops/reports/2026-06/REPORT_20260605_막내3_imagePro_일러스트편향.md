---
type: report
date: 2026-06-05
device: iMac
agent: 막내3
portfolio: PF_IDPHOTO
subject: "[INCIDENT P0] image_pro 일러스트 편향 — 3대 가설 raw 검증 + 원인 단정 (승인 게이트)"
status: 승인대기
---

# REPORT — [INCIDENT P0] image_pro 생성 품질 저하(일러스트체) 원인 추적

**[2026-06-05 18:58 KST] iMac/막내3 → 작가님**

> ⚠️ 이 INCIDENT에서 추론이 7회 빗나갔다. 본 보고는 **git·세션·보고서·코드 raw 인용만**. 미확인은 "미확인"으로, 한계는 "한계"로 명시. 단정은 raw 근거가 있을 때만.

---

## 0. 결론

| 가설 | 판정 | 한 줄 근거 |
|------|------|-----------|
| **A. enhancePrompt 리그레션** | 🟢 **지지 (유일하게 raw로 뒷받침)** | 3/31 P0 권고 `enhancePrompt:false`가 **코드에 단 한 번도 반영된 적 없음**(git -S=0). 현재 `/generate`는 enhancePrompt 미설정 → Vertex 기본값(Google 공식 인정 리그레션) 작동 |
| **B. Google 모델 의도적 저하** | ⚪ **미확인 (통제 불가)** | 우리 기록상 imagen-4.0 deprecation은 **미래(6/24~)**. 6/05 "품질 저하/의도적 다운" 통지·release note **근거 없음**. 입증·반증 모두 불가 |
| **C. monkosimagepro 삭제·세이프티 강화** | 🔴 **반박** | 3/31 보고: "세이프티 작동=일러스트 폴백 아닌 **완전 거부**". safety 파라미터 3/01 후 무변경. `/generate`는 **Vertex ADC** 경로라 삭제된 AI Studio 키(monkosimagepro)와 무관 |

**단정**: 현재 일러스트 편향의 우리측 통제 가능한 단일 원인은 **`/generate`에 `enhancePrompt:false`가 적용되지 않은 것**이다. 이는 신규 리그레션이 아니라 **3/31에 P0로 권고됐으나 끝내 코드에 머지되지 않은 미적용 상태**다.

---

## 1. 현재 /generate 생성 파라미터 전수 (코드 raw)

`apps/monk_imagen4/backend/server.js` (운영 리비전 00022-fx2, 3/30 배포)

**req.body 수신 (76~85行)**:
```
negativePrompt='', aspectRatio, style='photography', numberOfImages=1,
saveToGcs=false, seed, guidanceScale=7.0,
safetyFilterLevel='block_none', personGeneration='allow_all'
```
→ **`enhancePrompt`를 req.body에서 받지 않음.**

**Vertex 전송 parameters (117~126行)**:
```
aspectRatio, sampleCount, seed, guidanceScale,
safetyFilterLevel, personGeneration, outputMimeType='image/jpeg', outputCompression=95
```
→ **`enhancePrompt` 항목 자체가 없음** → Vertex Imagen 4 **기본값 적용**.

**모델 (99~101行)**: `imagen-4.0-ultra-generate-001`(ultra) / `imagen-4.0-fast-generate-001`(fast).

> 일러스트를 유발할 수 있는 파라미터 후보 중 **유일하게 "미설정→Google측 기본 동작"인 것이 enhancePrompt.** 나머지(safety=block_none, personGeneration=allow_all)는 명시값이며 일러스트와 무관(§3-C).

---

## 2. 가설 A — enhancePrompt (git+보고서 raw)

### 2-1. 3/31 보고서 원문 인용
`REPORT_20260331_막내2_Imagen4_커뮤니티+실전테스트.md`:
- **1-5 (line 68~76)**: "`enhancePrompt` 공식 리그레션 (Google 인정)" / 출처=Vertex AI Imagen API 공식문서 / 증상="복잡한 프롬프트 + enhanced prompts 사용 시 바람직하지 않은 결과 생성 가능" / **해결책=`enhancePrompt: false`** / **"우리 코드: enhancePrompt 미설정(기본값 사용 중 — 기본값 true일 경우 영향)"**
- **1-7 (line 86~93)**: "일러스트 변질은 안전필터 우회가 아닌 **모델 자체의 스타일 편향**"
- **권고 (line 162, 170)**: 1순위 원인=enhancePrompt 기본값 동작 / **P0 권고="`enhancePrompt: false` 추가 (server.js parameters에). Google 공식 권장 해결책"**

### 2-2. 그 fix가 코드에 반영됐는가 → **아니오 (git -S 확정)**
```
git log -S "enhancePrompt" -- apps/monk_imagen4/backend/server.js  →  결과 0건
```
- 백엔드 server.js에 enhancePrompt는 **역사상 단 한 번도 등장한 적 없음.**
- enhancePrompt가 등장한 커밋은 전부 **제안서·레거시(삭제된) 앱**: `f1ce943f`(3/31 민아 제안서), `744181f2`(삭제된 imagen3/MonkosChatApp/monk-ai-studio-pro), `e89390b9`/`904e5d24`(MONKOS Chat 레거시).
- → **3/31 P0 권고는 라이브 백엔드에 머지되지 않았다.** "리그레션(있었다 빠짐)"이 아니라 **"처음부터 미적용"**.

### 2-3. 왜 지금 발현됐나 (한계 동반)
- enhancePrompt 프롬프트 재작성은 **Google측·비결정적**. 동일 코드라도 Google 리라이터 동작 변화에 따라 출력 스타일이 흔들릴 수 있음(코드 무변경인데 증상 신규 발현과 정합 — 직전 §변경추적 보고: 코드/리비전 무변경 확정).
- **단 "Google 리라이터가 6/05에 바뀌었다"는 직접 raw는 없음** → 이 부분은 가설 B 영역과 겹치며 **미확인**. 확정 가능한 사실은 "우리가 enhancePrompt를 끄지 않아 Google 기본 리라이터에 노출돼 있다"까지.

---

## 3. 가설 B·C 검증

### 3-B. Google 모델 의도적 저하 — ⚪ 미확인
- `REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md` line 86: `imagen-4.0-generate-001` deprecation **2026-06-24 (D-37)**, 대체=gemini-3-pro-image-preview. → **종료는 미래**. 6/05 품질저하 근거 아님.
- `2026-06-05_iMac_쌍아.md` line 62: 쌍아가 "Imagen4 6/30 셧다운→교체"로 점프했다가 **작가님 정정** — "6/30 셧다운은 별개 중기과제, 오늘 원인 아님". (직전 ultra 장애의 실제 원인은 타임아웃/용량이었음)
- → "신모델 공개 전 의도적 저하"는 작가님 제기 가설이나 **우리 기록·release note에 raw 근거 없음.** 통제 불가 영역. 입증·반증 모두 불가 → **미확인으로 보류** (단정 금지).

### 3-C. monkosimagepro 삭제·세이프티 강화 — 🔴 반박
- **메커니즘 반박**: 3/31 보고 1-7 — "안전필터 작동 시 품질저하/일러스트 폴백이 **아니라 완전 거부**". 세이프티 강화면 일러스트가 아니라 **차단(거부)**이 나와야 함.
- **코드 반박**: `git blame` 83~84行 → `safetyFilterLevel='block_none'`, `personGeneration='allow_all'` 모두 **2026-03-01(`31e70a75`) 이후 무변경**. 최근 세이프티 강화 코드 없음.
- **경로 반박**: `/generate`는 **Vertex ADC**(`predictionClient.predict`) 경로. 삭제된 monkosimagepro(AI Studio API 키)는 `/generate`에 쓰이지 않음(키 쓰는 곳은 `/refine`뿐, 그건 정상). → 키 삭제가 생성 품질에 영향 줄 코드 경로 없음.

---

## 4. 실측 재현 — 한계 (정직 고지)

- **enhancePrompt A/B(false vs 기본) 라이브 격리 불가**: 배포된 `/generate`는 enhancePrompt를 **req.body로 받지도, parameters에 넣지도 않음**(§1). 즉 **코드 수정 없이는 enhancePrompt:false를 시험할 방법이 없다.** A/B는 코드 변경(승인 게이트) 후에만 가능.
- ultra 단독 생성 재현은 직전 보고의 RESOURCE_EXHAUSTED/타임아웃 간헐성 + Vertex 비용 발생 + 비결정적 리라이터로 인해 **단발 재현의 증거가치가 낮음**(추론 7회 빗나간 맥락에서 단발 결과로 단정하는 것은 위험). → 실측 단정 대신 **문서·코드 raw로 한정**.

---

## 5. 해결 권고 (코드 수정·배포는 작가님 승인 후 — 헌법 4조, deploy.sh 경유)

| 우선 | 처방 | 근거 | 비고 |
|------|------|------|------|
| **P0** | `/generate` parameters에 **`enhancePrompt: false`** 추가 (+ req.body 수신 옵션화, 기본 false) | 3/31 Google 공식 권장 미적용분 머지 | 코드 1~2줄. deploy.sh 경유 재배포 필요 |
| P1 | base 프롬프트에 **photoreal 강제** 프리픽스(예 "photorealistic passport photo, real human, no illustration/cartoon") | enhancePrompt:false면 자동확장 사라져 단문("한국여성 41세") 품질 보강 필요 | style='photography' 활용 |
| 참고 | enhancePrompt:false 적용 후 **ultra 실제 출력 1회 검증**(승인 후) | 처방 실증 | 비결정성 감안 복수 샘플 |

> ⚠️ 직전 INCIDENT(용량/타임아웃)·막내2 AI Studio 크레딧건과 **별개 처방**. 본 건은 **코드(enhancePrompt 미적용)** 문제이며, 충전·타임아웃 조정으로는 일러스트가 해소되지 않는다.

---

## 6. 검증 체크리스트 대조
- [x] 현재 /generate 파라미터 전수 (enhancePrompt 미설정·safety 명시값 확인)
- [x] 가설 A — enhancePrompt git 이력 (server.js에 역사상 0건 = 3/31 fix 미반영, "있었다 빠짐" 아님)
- [x] 가설 B — Google deprecation 우리 기록 적시 (6/24 미래, 6/05 저하 근거 없음 → 미확인)
- [x] 가설 C — safety blame 3/01 무변경 + /generate=Vertex ADC라 키삭제 무관 → 반박
- [x] 일러스트 원인 단정 (가설 A, raw) + 해결 권고 (enhancePrompt:false 머지)
- [x] 추론 배제(미확인은 미확인 명시)·키값 무노출 확인

---

**[2026-06-05 18:58 KST] iMac/막내3 → 작가님 · 추적 종료, enhancePrompt:false 머지 승인 대기**
