---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: Gemini 2.5 → 3.x 텍스트 모델 이전 (기한 10-20 경과, 원장 187)
status: 발행
portfolio: PF_INFRA
---

# ORDER — Gemini 2.5 → 3.x 이전

> 출처: 작가님 2026-10-22 21:45 (iMac 쌍아 세션 사람 턴) "네가지 권고안 모두 처리해" — 쌍아 21:42·21:43 권고 일괄 승인.
> 근거: Google 통지 "Migrate Gemini 2.5 model traffic … before Oct 20, 2026"(Gmail 07-29·08-03). 10-22 21:4x 실측: 모델 관련 ERROR 0(대조군 전체 ERROR 16), 챗봇 정상 — 아직 미차단, 시점 미상. 원장 (187).

## 1. 대상 (10-22 grep 실측)
- `monkos_AI/portal/lib/shared/config.js` CALLSCOPE_MODEL · `portal/server.js` 917·919·1407(챗봇 등) · `portal/lib/idphoto-generate.js` 176~179(`gemini-2.5-flash` → `gemini-2.5-flash-image` 매핑, REGIONAL_MODELS)
- `monkos_AI/idphoto-kr/server.js` PRECHECK_MODELS(2.5-flash·2.5-flash-lite) · `idphoto-jp/server.js` 297·379 · `studio/server.js` 392
- `portal/tools/t1-prompt-harness.mjs`(도구, 낮은 우선)

## 2. 절차
1. **대체 모델 실측 확정** — 모델 ID 추정 금지. Vertex(현 클라이언트 `vertexai: true`, 리전은 각 deploy.sh 정본)에서 3.x 텍스트 flash급 후보를 실호출 1회로 확인(`/model-check` 절차 참고). 이미지 매핑의 `gemini-2.5-flash-image`는 이미 쓰는 `gemini-3.1-flash-image` 등으로 대체 가능 여부 확인.
2. 모델 ID를 서비스별 상수 1곳으로 모으고(이미 있는 상수 재사용), 하드코딩 로그 문자열은 상수에서 파생.
3. 출력 계약 회귀: 챗봇 응답·사전분석 JSON 스키마·콜스코프 판독이 2.5와 같은 형식인지 dev에서 양성 3건씩.
4. dev 배포(각 `deploy.sh dev`) → 기능 스모크 → **prod는 서비스별로 쌍아 경유 작가님 사람 턴 승인 후**(이 지시서는 prod 승인 아님).

## 3. 범위
**허용**: 위 파일 수정 · dev 배포 · Vertex 실호출 스모크(소량).
**금지**: 프롬프트 내용 변경(모델 교체만) · 이미지 생성 모델(3-pro-image 등) 변경 · 승인 없는 prod.

## 4. 판정
| # | 기준 |
|---|------|
| 1 | 대체 모델 실호출 성공 기록(모델 ID·리전·응답 요약) |
| 2 | 코드 내 `gemini-2.5` 0건(도구 제외 시 명기) |
| 3 | dev 기능 스모크 서비스별 양성 3·출력 형식 동일 |
| 4 | prod 승인 요청용 판정표 |

## 5. 반환
COMPLETION + 브랜치·SHA(원격 대조) + dev 판정표 + 원장 (187) resolve는 prod 반영 후.
