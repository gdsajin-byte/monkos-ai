---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내9
status: dev 완료 · prod 승인 대기
portfolio: PF_INFRA
subject: "Gemini 2.5 → 3.5 텍스트 모델 이전 — dev 완료 (ORDER_20261022 INFRA)"
---

# COMPLETION — Gemini 2.5 → 3.5 텍스트 모델 이전 (dev)

**[2026-10-22 22:16 KST]** iMac/쌍아-막내9 → iMac/쌍아

> 지시서: [ORDER_20261022_iMac쌍아_막내_INFRA_Gemini25_3x이전.md](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_Gemini25_3x이전.md)
> 투입 출처: 작가님 2026-10-22 21:45 iMac 쌍아 세션 사람 턴 "네가지 권고안 모두 처리해" → 쌍아 직접 전달(막내9 기동 프롬프트). prod 승인 아님.

✅ **결론**: 포털·idphoto-kr·idphoto-jp·studio 텍스트 경로를 `gemini-3.5-flash`(Vertex **global**)로 옮겨 dev 4개 서비스에 배포, 서비스별 양성 3건 통과. prod는 서비스별 작가님 승인 대기.
⚠️ prod 판단 전에 볼 것: 3.5-flash@global에서 **429 1회 + 200초 넘는 지연 2회**(약 60콜 중) — 아래 §5.

## 1. 대체 모델 실측 (판정 1)

모델 ID는 추정하지 않고 Vertex `generateContent` 실호출로 정했다(프로젝트 monkos, 10-22 21:5x).

| 모델 | us-central1 | global | 비고 |
|------|------|------|------|
| gemini-2.5-flash (현행) | 200 | 200 | 기준 |
| **gemini-3.5-flash** | 404 | **200** `"OK"` modelVersion=gemini-3.5-flash | **채택** (2.5-flash 대체) |
| **gemini-3.5-flash-lite** | 404 | **200** | **채택** (idphoto-kr 폴백 2.5-flash-lite 대체) |
| gemini-3-flash-preview · 3.1-pro-preview | 404 | 200 | 프리뷰라 제외 |
| gemini-3.1-flash-lite | 404 | 200 | 3.5 계열이 있어 제외 |
| gemini-3-flash · 3.1-flash · 3.5-flash-preview · 3-pro · 3.1-pro | 404 | 404 | 부재 |

→ **3.x 텍스트 GA 모델은 global에만 있다.** 그래서 각 서비스의 텍스트 클라이언트(`ai`)를 `location: 'global'`로 바꿨다. `ai`는 4개 서비스 모두 텍스트 호출에만 쓰인다(grep 확인). `LOCATION` 환경변수(us-central1)는 그대로 두었다 — 로그 표시 외 사용처 없음.

## 2. 변경 (커밋 `c15534fb` · `ff00ca47`, 브랜치 `worktree-makne9-gemini3x`)

| 파일 | 변경 |
|------|------|
| `portal/lib/shared/config.js` | `ai` → global · **`TEXT_MODEL = 'gemini-3.5-flash'` 정본 신설** · `CALLSCOPE_MODEL = TEXT_MODEL` |
| `portal/lib/cms/ai.js` · `translate.js` · `slug.js` | 하드코딩 `'gemini-2.5-flash'` 5곳 → `TEXT_MODEL` |
| `portal/lib/cms/slug.js` | `thinkingConfig: { thinkingLevel: 'MINIMAL' }` 추가 (§4) |
| `portal/lib/callscope/extract.js` | `thinkingBudget: 0` → `thinkingLevel: 'MINIMAL'` (§4) |
| `portal/server.js` | 기동 로그 `챗봇: gemini-2.5-flash` → `텍스트 모델(CMS·콜스코프): ${TEXT_MODEL} @global` (챗봇은 실제로 CF 워커 경유라 이 로그와 무관했음) |
| `idphoto-kr/server.js` | `ai` → global · `TEXT_MODEL` · `PRECHECK_MODELS = [TEXT_MODEL, 'gemini-3.5-flash-lite']` · 로그 파생 |
| `idphoto-jp/server.js` | `ai` → global · `TEXT_MODEL` · 사전분석·`detectFace` 모델 → 상수 · 로그 파생 |
| `studio/server.js` | `ai` → global · `TEXT_MODEL` · `PRECHECK_MODELS = [TEXT_MODEL]` · 로그 파생 |

프롬프트 문구는 바꾸지 않았다. 이미지 생성 모델(3-pro-image·3.1-flash-image)도 그대로다.

## 3. 판정 2 — 코드 내 `gemini-2.5` 잔존 (대상 4서비스)

이전 전 21건 → **이전 후 7건**. 남은 7건은 모두 지시서 금지 범위·도구다:

| 위치 | 내용 | 남긴 이유 |
|------|------|------|
| `portal/lib/idphoto-generate.js` 101·176·179 + `portal/server.js` 917·919 | 내부 별칭 `'gemini-2.5-flash'` → **이미지 모델 `gemini-2.5-flash-image`** (specs 유료, 매팅 실패 시 무보정 배경제거 경로) | **이미지 생성 모델 변경 금지**(지시서 §3). 대체 가능 여부만 확인: `gemini-3.1-flash-image`는 global 200 / us-central1 404, `gemini-2.5-flash-image`는 아직 양쪽 200. 교체 시 클라이언트를 global로 옮겨야 하고 **정체성 보존 품질 게이트(헌법 1조 3항)**가 필요해 별도 지시서 사안 |
| `portal/tools/t1-prompt-harness.mjs` 33·38 | 도구(낮은 우선) | 지시서상 도구 — 제외 명기 |

**대상 밖에서 발견한 2.5 사용처** (지시서 목록에 없음, 무변경):
- `monkos_AI/image-pro/backend/server.js` 418·504 — `monk-image-engine`, generativelanguage API `gemini-2.5-flash` (꾸 상시 사용 서비스)
- `functions/api/translate.js` 39 · `analyze.js` 40 — monk.kr CF Pages Functions, generativelanguage API `gemini-2.5-flash` (배포 = monk.kr 버튼, 작가님 승인 사안)
→ 쌍아 판단 필요: 같은 기한 대상이다. 후속 지시서 권고.

## 4. 출력 계약 회귀에서 잡은 것 2건 (수정 완료)

1. **콜스코프 400** — 실모듈(`extractFromImage`) 호출이 3.5-flash에서 `"Thinking budget is not supported for this model."` 400으로 3/3 실패. 3.x는 `thinkingBudget` 대신 `thinkingLevel`을 받는다 → `MINIMAL`로 바꾸고 합성 캡처 3/3 정상 판독(키 구성 동일, 거리·요금·결제 태그 일치). 기존 주석의 의도("사고 끔 — 응답만 늦어진다")를 그대로 유지한 설정.
2. **슬러그 잘림** — `maxOutputTokens: 64`를 사고 토큰이 잠식해 `finish=MAX_TOKENS`로 `passport-photo`·`us-visa`·`how-to`처럼 잘린 슬러그가 나왔다(3자 이상이라 그대로 채택될 수 있음). `MINIMAL` 적용 후 3/3 `finish=STOP`, 전체 슬러그 생성.
   - 참고: **현행 2.5에서도** 같은 이유로 빈 응답(`finish=MAX_TOKENS`, 사고 60토큰) → 타임스탬프 슬러그 폴백 중이었다. 이번 수정으로 함께 해소된다.

## 5. dev 판정표 (판정 3)

| 서비스 | dev 리비전 | 스모크 | 결과 |
|------|------|------|------|
| monkos-idphoto-kr-dev | `00003-f7m` | `POST /api/precheck` 이미지 3종 | ✅ 3/3 HTTP 200, 키 `suitable·score·face_detected·issues·suggestion` 동일, 4.4~5.5s. dev 로그 `[사전분석] 모델 시도: gemini-3.5-flash` 확인 |
| monkos-idphoto-jp-dev | `00002-js8` | 같음 + `detectFace` 실프롬프트(server.js에서 읽어 동일 호출, 로컬) | ✅ 사전분석 3/3 200(3.9~4.2s, 일본어 응답) · 얼굴좌표 3/3 0~1 정규화 범위(2.5와 같은 형식) |
| monkos-studio-dev | `00001-f2f` (**신규 생성** — 이전에 dev 서비스가 없었다) | `POST /api/precheck` 3종 | ✅ 3/3 200, 키 동일, 5.2~10.9s |
| monkos-portal-dev | `00193-82r` → **`00194-mgq`**(§4 수정 반영) | 기동 로그 + 실모듈 로컬 스모크(워크트리 `callscope/extract.js` import, 슬러그는 slug.js 동일 호출) | ✅ `/health` 200 · 기동 로그 `텍스트 모델(CMS·콜스코프): gemini-3.5-flash @global` · 콜스코프 3/3 · 슬러그 3/3 · CMS 번역형 JSON(`en`·`ja`) 하네스 동일 형식 |

- 포털 CMS·콜스코프 엔드포인트는 어드민 인증 뒤라 dev HTTP로는 두드리지 않았다(어드민 토큰 미사용). 같은 모듈·같은 설정의 로컬 실호출로 대체.
- 포털 단위 테스트 13 스위트 136/136 통과.
- 2.5 대조(같은 설정, us-central1): 사전분석·얼굴좌표·스키마·번역 모두 같은 JSON 형식.

### 지연·쿼터 관측 (prod 판단 자료)

| 측정 | 결과 |
|------|------|
| 3.5-flash@global 텍스트 16콜(기본 8·MINIMAL 8, 60s 타임아웃) | 0.9~3.2s, 1건 8.1s, 실패 0 |
| 2.5-flash@us-central1 같은 조건 8콜 | 0.9~3.0s (참고: 2.5는 `thinkingLevel` 미지원 400 — 2.5로 되돌릴 때 MINIMAL 설정도 같이 되돌려야 함) |
| 이상 사례 | **429 1회**(슬러그 호출) · **200초 넘는 응답 2회**(콜스코프 1건 204s, 스키마 하네스 1건 2분+ 무응답) — SDK의 429 재시도 대기로 추정, 미확정 |

→ idphoto 사전분석은 마지막 모델까지 실패하면 `suitable: true`로 통과시키는 구조라 실패는 막히지 않지만, **지연은 고객이 그대로 기다린다.** prod 전에 ① 쿼터 실측(global 3.5-flash RPM, 콘솔 quota unit) ② 사전분석 호출 타임아웃 여부를 쌍아가 판단하길 권고. 이번 지시서 범위(모델 교체만)라 타임아웃은 넣지 않았다.

## 6. prod 승인 요청 판정표 (판정 4)

| 서비스 | 변경 | dev 근거 | 롤백 | 권고 |
|------|------|------|------|------|
| monkos-idphoto-kr | 사전분석 3.5-flash → 3.5-flash-lite 폴백 | 3/3 | 직전 prod 리비전 `--to-revisions` | 승인 가능 (지연 관측 유의) |
| monkos-idphoto-jp | 사전분석·얼굴좌표 3.5-flash | 3/3 + 3/3 | 동 | 승인 가능 (지연 관측 유의) |
| monkos-studio | 사전분석 3.5-flash | 3/3 | 동 | 승인 가능 (내부용) |
| monkos-portal | CMS·콜스코프 3.5-flash, 사고 설정 2곳 | 로컬 실모듈 3/3·3/3 + dev 기동 | 동 | 승인 가능 — 단, prod 배포 시 다른 대기 변경 동승 여부(main 대비) 확인 필수 |

**공통 위험 (쌍아 22:2x 요청으로 표에 덧붙임)**

| 항목 | 값 |
|------|------|
| 관측 횟수 | 약 60콜 중 이상 3회 — 429 1회(슬러그, 22:0x) · 204,685ms 1회(콜스코프 이미지 입력) · 2분+ 무응답 1회(텍스트 스키마 하네스, 수동 중단) |
| 정상 지연 | 텍스트 0.9~3.2s(16콜) · 이미지 사전분석 3.9~10.9s(dev 9콜) |
| 리전 모델 대체 후보 | **없음** — us-central1에서 3.x 텍스트 전 후보 404(3-flash·3.1-flash·3.1-flash-lite·3.5-flash·3.5-flash-lite·3-pro·3.1-pro 등). 3.x는 global 전용 |
| 그 외 대체 후보 | ① `gemini-3.5-flash-lite`@global (텍스트·사전분석 형식 동일, 단 얼굴좌표를 픽셀값으로 준 사례 1건 — 짧은 프롬프트 기준, jp `detectFace`엔 부적합 가능) ② 2.5-flash@us-central1 유지(현재도 200, 차단 시점 미상 — 만료 리스크) |
| 권고 | prod 전 global 3.5-flash 쿼터(콘솔 quota unit) 실측 + 사용자 대면 사전분석의 호출 타임아웃 여부 결정 |

- prod 배포는 main 브랜치 게이트 — 이 브랜치가 main에 들어간 뒤 메인 체크아웃에서 실행.
- 원장 (187) resolve는 prod 반영 후.

## 위임 기록 (ch3 1조)
- 하위 주체 없음. Vertex 실호출 약 70회(텍스트 위주, 이미지 입력 소형).

📁 산출: 본 COMPLETION · 코드 커밋 2건 · 세션 로그 `sessions/2026-10/2026-10-22_iMac_쌍아-막내9.md` · PF_INFRA 1행
🔀 쌍아 판단: ① 브랜치 main 반영 ② 서비스별 prod 승인 요청 ③ 대상 밖 2.5 사용처(image-pro·monk.kr functions) 후속 지시 ④ 이미지 경로 `gemini-2.5-flash-image` 처리 방침
