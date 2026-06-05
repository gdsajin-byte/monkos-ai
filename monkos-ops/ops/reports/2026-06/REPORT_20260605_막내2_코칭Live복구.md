---
type: report
incident: true
date: 2026-06-05
device: iMac
agent: 막내2
status: 복구완료
portfolio: PF_IDPHOTO
priority: P0
subject: "[INCIDENT] 코칭 Gemini Live 모델 복구 — 2.5-flash 오변경 → 2.0-flash-live-preview-04-09 롤백 (KR+JP 배포)"
---

# REPORT — [INCIDENT] 코칭 Gemini Live 모델 복구

**[2026-06-05 17:20 KST] iMac/막내2 → 작가님**

> ✅ **복구 완료.** Live 모델 실측 검증 → KR+JP 수정 → prod 배포 → 재검증까지 마쳤다. 키/결제 무관(코칭=Vertex ADC 경로).

---

## 0. 한 줄 결론

코칭 Live 다운 원인은 **6/2 EOL 마이그레이션(`8e5b890e`) 때 `ai.live.connect` 모델을 일반 모델 `gemini-2.5-flash`로 싸잡아 바꾼 것**. **원래 Live 전용 모델 `gemini-2.0-flash-live-preview-04-09`로 롤백**해 복구했다(실측: 해당 모델 Vertex Live에서 정상 응답). KR+JP prod 배포 완료. precheck/generateContent의 2.5-flash는 **건드리지 않음**(EOL 대응이 올바른 부분).

---

## 1. Vertex Live 지원 모델 실측 (추론 금지 — 실제 round-trip)

> `onopen`(소켓 열림)만으로는 모델 유효성 판정 불가 → **메시지 전송 후 실제 `modelTurn` 응답 수신**으로 검증.

| 모델 | 실측 결과 |
|------|----------|
| **`gemini-2.0-flash-live-preview-04-09`** (원래) | ✅ **RESP_OK** — `{"serverContent":{"modelTurn":{"role":"model","parts":[{"text":"안녕하세요"}]}}}` 실제 응답 |
| `gemini-2.0-flash-exp` | ❌ CLOSED — "Publisher Model ... gemini-2.0-flash-exp" 미존재 |

→ **작가님 가설 적중**: "2.0 LLM은 죽었어도 2.0 **Live**는 살아있다" — 별개 모델. `gemini-2.0-flash-live-preview-04-09`는 generateContent용 2.0-flash(6/1 EOL)와 무관하게 **Vertex Live에서 생존·정상 응답**.
→ 2.5 라이브 계열은 **작가님 확정 금지**(늘 에러)라 검증 대상에서 제외. 1순위 2.0-live 롤백이 실측으로 성립하여 추가 탐색 불요.

---

## 2. 수정 (Live `ai.live.connect` 모델만)

| 파일 | 라인 | 변경 |
|------|------|------|
| `monkos_AI/idphoto-kr/server.js` | 332 | `ai.live.connect` model: `gemini-2.5-flash` → **`gemini-2.0-flash-live-preview-04-09`** |
| `monkos_AI/idphoto-jp/server.js` | 335 | `ai.live.connect` model: `gemini-2.5-flash` → **`gemini-2.0-flash-live-preview-04-09`** |

- `ai` = `new GoogleGenAI({ vertexai: true, project, location })` → **코칭 Live는 Vertex AI ADC 경로** (AI Studio 크레딧·키와 무관 → 결제 충전으로 안 풀린 이유).
- **미변경 보존 확인** (지시서 §2 준수):
  - KR `PRECHECK_MODELS = ['gemini-2.5-flash','gemini-2.5-flash-lite']` (라인 374) — 유지
  - JP `PRECHECK_MODELS = ['gemini-2.5-flash']` (라인 377) + `detectFace` generateContent `gemini-2.5-flash` (라인 459) — 유지
  - diff 총 **2줄**(파일당 1줄), Live 모델명만.

---

## 3. 배포 (deploy.sh 경유 — ch5 2조)

| 서비스 | deploy.sh | 결과 |
|--------|-----------|------|
| monkos-idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh prod` | ✅ rev **00191-dmd**, 100% 트래픽 |
| monkos-idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh prod` | ✅ rev **00118-g4l**, 100% 트래픽 |

- `gcloud run deploy` 직접 실행 안 함. deploy.sh의 `cd "$SCRIPT_DIR"`로 CWD 고정(06-02 오배포 재발 방지).
- `--update-env-vars`는 PROJECT_ID/LOCATION/GCS_BUCKET만 → **GEMINI_API_KEY 등 시크릿 보존**.

---

## 4. 검증 (실작동)

| 검증 | 결과 |
|------|------|
| KR 헬스 | HTTP 200, `status: healthy`, `imagen: active`, `preCheck: active (gemini-2.5-flash)` |
| JP 헬스 + 오배포 점검 | HTTP 200, **`service: monkos-idphoto-jp`**(JP 코드 정상 서빙 확인), preCheck 2.5 보존 |
| 배포 Live 모델 round-trip | ✅ **RESP_OK** — 운영과 동일 Vertex ADC 경로로 `gemini-2.0-flash-live-preview-04-09` 실제 코칭 응답 수신 |
| `[Gemini Live]` 에러 로그 | 배포 후 에러 없음 (WS는 사용자 코칭 시작 시 연결 — 실사용 시연 권고) |

---

## 5. 완료 기준 대조

- [x] Vertex Live 지원 모델 실측 (2.0-live 생존=RESP_OK 확인)
- [x] 코칭 Live 모델명 수정 (2.0-live 롤백, **2.5 회피**)
- [x] generateContent·precheck 미변경 확인 (Live만 수정, diff 2줄)
- [x] KR + JP 둘 다 적용
- [x] deploy.sh 경유 배포 (KR 00191-dmd / JP 00118-g4l)
- [x] 코칭 실작동 검증 (Live connect 정상 + 실제 응답 RESP_OK)

---

## 6. 잔여 권고

- **증명앱 코칭 단계 실 시연**(작가님/막내): 브라우저 WS 코칭 플로우 1회 실사용으로 end-to-end 최종 확인 권고. (서버측 모델 경로는 RESP_OK로 확증됨)
- **생성코어(AI Studio 결제)는 별건**: 본 건은 코칭(Vertex)만 복구. 증명사진 *생성*은 직전 보고(`REPORT_20260605_막내2_AIStudio결제복구.md`) — AI Studio 결제 복구 대기 중.

---

**[2026-06-05 17:20 KST] iMac/막내2 → 작가님**
✅ 코칭 Live 복구 완료 — `gemini-2.0-flash-live-preview-04-09` 롤백, KR(00191)+JP(00118) prod 배포, round-trip RESP_OK 검증. 2.5 라이브 회피·precheck 보존 준수. 생성코어는 AI Studio 결제 복구 대기(별건).
