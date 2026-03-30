---
type: INCIDENT
date: 2026-03-30
from: 작가님
to: iMac/쌍아
priority: 🔴 긴급 (프로덕션 다운)
status: 대기
---

# 🔴 긴급 — gemini-3-pro-image-preview 모델 폐기로 프로덕션 장애

**[2026-03-30 20:00 KST] 작가님 → iMac/쌍아**

---

## 1. 상황 요약

Google이 `gemini-3-pro-preview` 계열 모델을 **2026-03-09 폐기(deprecated)** 처리.
3월 26일 GitHub Changelog에 공식 공지.
현재 전 서비스에서 사용 중인 `gemini-3-pro-image-preview`가 **403 또는 품질 저하** 발생.

## 2. 영향 범위

| 서비스 | 파일 | 증상 | 심각도 |
|--------|------|------|--------|
| **증명사진 앱** (photolab) | `MONK_kr/ai_lab/photolab/engine/server.js:40` | **403 에러 — 서비스 다운** | 🔴 |
| **IMAGE PRO** 생성 | `functions/api/generate.js:37` | 사진→일러스트 변질 | 🟠 |
| **IMAGE PRO** I2I/업스케일 | `functions/api/refine.js:57` | 미확인 (동일 모델) | 🟠 |
| idphoto-jp (앱) | `apps/idphoto-jp-v079/server.js` | 미확인 | 🟡 |
| photo-coach (앱) | `apps/photo-coach/server.js` | 미확인 | 🟡 |

## 3. 근본 원인

- **변수명은 `IMAGEN_MODEL`이지만 실체는 Gemini LLM** (`gemini-3-pro-image-preview`)
- 실제 Imagen 엔진(imagen-3.0-generate-001, imagen-4 등)이 아닌 Gemini 멀티모달 모델 사용 중이었음
- Google이 3월 9일자로 해당 모델 폐기 → 403 또는 세이프가드 일러스트 우회 현상

## 4. 조치 필요사항

### 즉시 (P0)
- [ ] 대체 모델 확인: `gemini-2.5-pro` / `gemini-3.1-pro-preview` 이미지 생성 지원 여부 테스트
- [ ] 또는 실제 Imagen 엔드포인트로 전환: `imagen-4.0-generate-...` (모델명 확인 필요)
- [ ] 증명사진 앱 server.js L40 `IMAGEN_MODEL` 교체 → 배포
- [ ] IMAGE PRO generate.js / refine.js 모델명 교체 → 배포

### 확인 후 (P1)
- [ ] idphoto-jp, photo-coach 동일 패턴 점검
- [ ] B2B 서비스 영향 확인
- [ ] 향후 preview 모델 의존 탈피 방안 (안정 GA 모델 사용)

## 5. 참고 소스

- [Gemini 3 Pro deprecated — GitHub Changelog (2026-03-26)](https://github.blog/changelog/2026-03-26-gemini-3-pro-deprecated/)
- [403 Permission Denied 포럼 스레드](https://discuss.ai.google.dev/t/403-permission-denied-on-gemini-3-pro-image-preview-despite-active-billing-vertex-api/110806)
- [Gemini 3 Pro Preview 공식 문서](https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-preview)

## 6. 수정 대상 파일 목록

```
MONK_kr/ai_lab/photolab/engine/server.js          → L40 IMAGEN_MODEL
functions/api/generate.js                          → L37 모델명
functions/api/refine.js                            → L57 모델명
apps/idphoto-jp-v079/server.js                     → 확인 필요
apps/photo-coach/server.js                         → 확인 필요
```

## 7. 고정 프롬프트 병행 점검

generate.js에서 `Style: photography` 하드코딩 — 모델 교체 후에도 일러스트 나오면 프롬프트 강화 필요.
API Key 전달 방식 불일치 (query param vs header) — 통일 권장.

---

> ⚠️ 증명사진 앱은 매출 직결 프로덕션. 최우선 복구 대상.
