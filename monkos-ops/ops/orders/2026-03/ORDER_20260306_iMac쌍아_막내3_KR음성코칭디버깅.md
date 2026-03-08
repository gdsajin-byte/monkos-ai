---
type: order
date: 2026-03-06
from: iMac/쌍아
to: iMac/막내3
status: completed
---

# [지시서] KR 음성 코칭 미작동 디버깅 + QC 폴백

> **[2026-03-06 14:59 KST] iMac/쌍아 → iMac/막내3**
> 작가님 E2E 지적 #7. JP는 음성 코칭 정상, KR은 전부터 음성이 안 나옴. QC도 묻혀버림.
> **최우선 디버깅 과제.**

---

## 현상

- JP: gemini-2.0-flash-live-preview-04-09 모델로 일본어 코칭 정상 작동
- KR: 동일 모델·동일 구조인데 음성 코칭이 안 나옴 (이전부터 지속)
- QC 결과도 사용자에게 전달되지 않는 것으로 보임

## 아키텍처 비교 (조사 완료)

| 항목 | JP (정상) | KR (미작동) |
|------|----------|------------|
| Gemini Live 모델 | gemini-2.0-flash-live-preview-04-09 | 동일 |
| 인증 | Vertex AI ADC | 동일 |
| WebSocket 코칭 | `WS /` | 동일 |
| 사전분석 모델 | gemini-3-flash-preview → 2.0-flash 폴백 | gemini-2.0-flash 단일 (폴백 없음) |
| QC 모델 | gemini-3-flash-preview → 2.0-flash 폴백 | gemini-2.0-flash 단일 (폴백 없음) |
| I2I 엔드포인트 | /api/generate | /api/idgen |

## 관련 코드

| 파일 | 핵심 위치 | 역할 |
|------|----------|------|
| `monkos_AI/idphoto-kr/server.js` | 라인 360-395 (Gemini Live), 729-813 (WS) | 서버 코칭 |
| `monkos_AI/idphoto-kr/public/camera.js` | 라인 25-74 (TTS), 111-195 (WS 클라이언트) | 클라이언트 코칭 |
| `monkos_AI/idphoto-kr/public/config.js` | 라인 17 (`COACHING: '/api/coaching'`) | 엔드포인트 설정 |
| `monkos_AI/idphoto-jp/server.js` | 라인 281-286, 352-393 | JP 정상 참조 |

---

## 디버깅 작업

### Phase 1: Cloud Run 로그 조사

```bash
gcloud run services logs read monkos-idphoto-kr --region us-central1 --limit 100 2>&1 | grep -E "코칭|Gemini Live|WS|세션|에러|fail|error"
```

확인 포인트:
1. `[WS][cN] 코칭 세션 연결` — WebSocket 연결 성공 여부
2. `[Gemini Live][cN] 세션 초기화 완료` vs `세션 실패` — Gemini Live 연결 여부
3. `[코칭][cN] {텍스트}` — 코칭 응답 수신 여부
4. `[프레임][cN]` — 프레임 전송 여부

### Phase 2: 원인별 대응

**A. Gemini Live 모델 연결 실패 시**:
- 모델명 `gemini-2.0-flash-live-preview-04-09` 유효성 확인
- Vertex AI ADC 인증 상태 확인 (환경변수 PROJECT_ID, LOCATION)
- JP와 동일 리전(us-central1)에서 동일 모델 사용 중인지 확인

**B. WebSocket 연결 자체가 안 되는 경우**:
- Cloud Run의 WebSocket 지원 설정 확인
- 클라이언트 `getWsUrl()` (camera.js 라인 115-117)이 올바른 WSS URL 생성하는지 확인

**C. 코칭 응답은 오지만 클라이언트에서 TTS가 안 되는 경우**:
- camera.js `speakKo()` 함수 (라인 38-51): `store.voiceEnabled` 상태 확인
- `initVoice()` (라인 27-36): 한국어 음성 초기화 성공 여부
- 모바일 브라우저의 user gesture 요구사항 확인

### Phase 3: QC 폴백 메커니즘 추가

JP처럼 QC에 폴백 모델을 추가:

**현재 KR** (server.js 라인 625):
```javascript
model: 'gemini-2.0-flash'  // 단일 모델
```

**JP 참조 패턴** (server.js 라인 352-393):
```javascript
const QC_MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];
// 첫 모델 실패 시 다음 모델로 재시도
```

KR server.js에도 동일한 폴백 구조 적용:
- 사전분석(precheck)에도 동일 적용
- 에러 로그에 어느 모델에서 실패했는지 명시

---

## ⚠️ 준수 조항

- **헌법 2조**: 완료 보고 필수. 특히 **로그 조사 결과를 보고서에 포함**
- **헌법 6조**: API 키/프로젝트 ID 생성·추측 금지. 환경변수 확인만
- **헌법 8조**: 파괴적 명령 금지
- **헌법 10조**: 프록시 금지. 근원 해결 우선
- **법률 6장**: 커밋 메시지 `[fix] KR 음성 코칭 디버깅 + QC 폴백 추가`

---

## 보고서

- 디버깅 결과를 `monkos-ops/ops/reports/REPORT_20260306_막내3_KR음성코칭디버깅.md`에 작성
- Cloud Run 로그 핵심 발췌 포함
- 원인 확정 + 수정 내역 + 검증 결과

## 배포

- 코드 수정 시 idphoto-kr Cloud Run 재배포
- `gcloud run deploy monkos-idphoto-kr --source . --region us-central1 --allow-unauthenticated`
