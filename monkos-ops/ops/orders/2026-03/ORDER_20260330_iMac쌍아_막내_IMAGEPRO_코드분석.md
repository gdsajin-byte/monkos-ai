---
type: order
from: iMac/쌍아
to: 막내
date: 2026-03-30
priority: 🟠 높음
subject: MONKOS IMAGE PRO 코드 전수 분석 — 모델·키·API 정합성 점검
---

# 지시서: MONKOS IMAGE PRO 코드 전수 분석

**[2026-03-30 21:24 KST] iMac/쌍아 → 막내**

---

## 배경

프로덕션(idphoto-kr/jp)은 API Key 교체로 복구 완료.
그러나 **IMAGE PRO(photolab)** 및 **CF Workers(functions/)** 에는 동일한 `gemini-3-pro-image-preview` 모델 + 별도 키(`IMAGEN_API_KEY`)가 사용되고 있어 점검 필요.
또한 작가님 보고: IMAGE PRO에서 **사진이 일러스트로 변질**되는 현상 감지.

---

## 분석 대상 파일 (3파일)

| 파일 | 역할 |
|------|------|
| `MONK_kr/ai_lab/photolab/engine/server.js` | IMAGE PRO 백엔드 — 코칭/사전분석/생성/QC |
| `functions/api/generate.js` | CF Workers — T2I/I2I 생성 |
| `functions/api/refine.js` | CF Workers — 업스케일/리파인 |

---

## 분석 항목

### 1. 모델 사용 현황 전수 파악

각 파일에서 사용하는 모델명을 전수 추출:
- `IMAGEN_MODEL` (L40) — 현재 `gemini-3-pro-image-preview`
- `COACHING_MODEL` (L37) — `gemini-2.5-flash`
- `PRECHECK_MODEL` (L38) — `gemini-2.5-flash`
- `QC_MODEL` (L39) — `gemini-2.5-flash`
- generate.js L37 — 하드코딩
- refine.js L57 — 하드코딩

### 2. API 키 사용 패턴 분석

- `IMAGEN_API_KEY` vs `GEMINI_API_KEY` — 어떤 키를 쓰는지
- 키 전달 방식 — query param vs header vs SDK
- `.env` 참조인지 하드코딩인지

### 3. API 호출 패턴 비교

- `imagenAI.models.generateContent()` (SDK 방식 — photolab)
- `fetch(URL?key=)` (raw fetch — functions/)
- idphoto-kr/jp의 호출 패턴과 비교하여 차이점 분석

### 4. 일러스트 변질 원인 추정

- generate.js의 프롬프트에 `Style: photography` 하드코딩 여부 확인
- `responseModalities` 설정 여부
- 모델 동작 변화 가능성 (세이프가드 강화로 인물 사진 → 일러스트 우회)
- 프롬프트 구조 분석 — I2I vs T2I 분기

### 5. 키 유출 경로 점검

- `IMAGEN_API_KEY`가 git 히스토리에 커밋된 적 있는지
- 현재 `.gitignore`에 `.env`가 포함되어 있는지 재확인
- `docs/corpus/legacy/20260111_REBOOT_BACKUP.md` 내 키 노출 확인
- `apps/MonkosChat/public/_expo/static/js/web/` 번들 내 키 노출 확인

---

## 산출물

마크다운 보고서 1건:
- 모델별 사용처 테이블
- API 키 사용 패턴 테이블
- 호출 방식 차이 비교표
- 일러스트 변질 추정 원인 + 해결 방안
- 키 유출 경로 전수 목록

---

## ⚠️ 준수 조항

- **코드 수정 하지 말 것** — 분석만 수행
- 헌법 제4조 1항: API 키 값을 보고서에 포함하지 말 것. 변수명과 마스킹된 끝4자리만
- 완료 보고 형식: `✅❌💡⏳📁🔀`
