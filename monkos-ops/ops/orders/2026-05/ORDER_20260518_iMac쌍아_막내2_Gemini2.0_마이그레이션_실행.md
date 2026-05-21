---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내2
status: 발행
portfolio: PF_PORTAL
priority: 긴급 (D-14)
---

# 지시서: Gemini 2.0 모델 마이그레이션 — 대안 테스트 + 비용/성능 비교

## 배경

gemini-2.0-flash 계열이 **2026-06-01 shutdown (D-14)**. 두 트랙으로 분리하여 실행.
- **Track A**: 텍스트 모델 (2.0-flash → 2.5-flash) — 리스크 낮음, 즉시 교체
- **Track B**: Live 모델 (2.0-flash-live-preview → 3.1-flash-live-preview) — 이전 롤백 이력 있음, 충분한 테스트 필수

⚠️ gemini-3-pro-image-preview (나노바나나 프로)는 본 지시서 대상 아님. 현행 유지.

---

## Track A: 텍스트 모델 교체 (gemini-2.0-flash → gemini-2.5-flash)

### A-1. 대상 (9개소 프로덕션 + 2개소 Workers)

| # | 파일 | 용도 | 서비스 |
|---|------|------|--------|
| 1 | portal/server.js:78,397 | 챗봇 health | monkos-portal |
| 2 | portal/lib/chat-engine.js:221,265 | 챗봇 대화 엔진 | monkos-portal |
| 3 | portal/lib/cms/blog.js:25 | 블로그 AI | monkos-portal |
| 4 | portal/lib/cms/translate.js:16,112 | CMS 번역 | monkos-portal |
| 5 | idphoto-kr/server.js:374 | 사전분석 (얼굴좌표) | monkos-idphoto-kr |
| 6 | idphoto-jp/server.js:377,459 | 사전분석 + QC 폴백 | monkos-idphoto-jp |
| 7 | studio/server.js:337 | 사전분석 | monkos-studio |
| 8 | functions/api/translate.js:39 | 번역 | CF Workers |
| 9 | functions/api/analyze.js:40 | 분석 | CF Workers |

### A-2. 실행 절차

1. **코드 변경**: 위 9개소 모델명 `gemini-2.0-flash` → `gemini-2.5-flash` 문자열 교체
2. **로컬 테스트** (배포 전):
   - 챗봇: 한국어/일본어 대화 3턴 이상 → 응답 톤/정확도 확인
   - 번역: 한→영, 영→한, 한→일 각 1건 → 품질 비교
   - 사전분석: 테스트 사진 3장 (정면/측면/다인) → 좌표 출력 비교 (2.0 vs 2.5)
3. **비용 비교**: 2.0-flash vs 2.5-flash 토큰 단가 비교표 작성
4. **성능 비교**: 응답 속도(ms), 토큰 수, 결과 품질 A/B 테이블

### A-3. 산출물

- 비교 테이블 (비용 + 성능 + 품질)
- 코드 변경 diff (커밋은 대기 — 작가님 승인 후 배포)

---

## Track B: Live 모델 교체 (gemini-2.0-flash-live-preview → ?)

### B-0. 중요 맥락

**이전에 2.5 Live 모델로 여러 번 시도했으나 문제 발생으로 롤백한 이력 있음.**
따라서 단순 문자열 교체가 아니라 **대안 모델 후보군 전수 테스트** 필요.

### B-1. 대상 (2개소)

| # | 파일 | 용도 | 서비스 |
|---|------|------|--------|
| 1 | idphoto-kr/server.js:332 | Live 촬영 코칭 (한국어 음성) | monkos-idphoto-kr |
| 2 | idphoto-jp/server.js:335 | Live 촬영 코칭 (일본어 음성) | monkos-idphoto-jp |

### B-2. 대안 모델 후보군

| 후보 | 모델명 | 세대 | 비고 |
|------|--------|------|------|
| ① | `gemini-3.1-flash-live-preview` | 3.1 | Google 공식 권장 대체 |
| ② | `gemini-3-flash-live-preview` | 3.0 | 존재 시 테스트 |
| ③ | `gemini-2.5-flash-live-preview` | 2.5 | 이전 롤백 대상 — 현재 상태 재확인 |
| ④ | 기타 발견 모델 | — | Live API 지원 모델 전수 확인 |

### B-3. 테스트 항목 (후보별 전부 실행)

| 항목 | 테스트 방법 | 비교 기준 |
|------|-----------|----------|
| **연결 안정성** | Live WebSocket 세션 10회 연결/해제 → 성공률 | 현행 2.0 대비 |
| **한국어 음성 품질** | 코칭 시나리오 3건 (정면유도/턱위치/조명) → 음성 출력 확인 | 자연스러움, 지연시간 |
| **일본어 음성 품질** | 동일 시나리오 일본어 → 음성 출력 확인 | 자연스러움, 지연시간 |
| **레이턴시** | 이미지 전송 → 첫 응답까지 시간 (ms) | 현행 대비 |
| **세션 유지** | 30초+ 연속 세션 안정성 | 끊김 여부 |
| **API 호환성** | voiceConfig, systemInstruction, responseModalities 파라미터 동작 확인 | 파라미터 누락/변경 여부 |
| **에러 패턴** | 10분 연속 가동 → 에러 로그 수집 | 현행 대비 신규 에러 |
| **비용** | 토큰 단가 + 세션당 예상 비용 | 현행 대비 |

### B-4. 이전 롤백 이력 조사

- **필수**: git log에서 Live 모델 관련 변경/롤백 이력 추적
- 이전에 어떤 문제로 롤백했는지 원인 정리 (커밋 메시지, 세션 로그, PF 히스토리)
- 해당 문제가 현재 후보 모델에서 해결되었는지 확인

### B-5. 산출물

- **후보별 비교 테이블**: 연결성공률 / 음성품질 / 레이턴시 / 비용 / 호환성 / 총평
- **이전 롤백 원인 정리 + 현재 해결 여부**
- **최종 추천**: 어떤 모델로 교체할지, 또는 교체 불가 판단 시 대안 (Live 기능 임시 비활성화 등)
- 코드 변경은 대기 — 작가님 승인 후 진행

---

## ⚠️ 준수 조항

- **배포 금지**: 코드 변경은 작성까지만. 배포는 작가님 승인 후 deploy.sh 경유 (헌법 4조, ch5)
- Track A, B 결과를 **하나의 보고서**에 통합 제출
- 비용은 **USD 기준** (Google 공식 pricing page 출처)
- 테스트 결과는 **실측값** 기재. 추정 금지
- 이전 롤백 이력 조사: `git log --all --grep="live" --grep="2.5" --grep="rollback"` 등 실측 기반
- 완료 후 세션 로그 어펜드 + 커밋
