---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내9
status: dev 완료 · prod 승인 대기
portfolio: PF_INFRA
subject: "Gemini 3.5 이전 + 텍스트 호출 타임아웃·건너뛰기 가드 — dev 완료 (ORDER_20261022 Gemini35_타임아웃가드)"
---

# COMPLETION — Gemini 3.5 타임아웃 가드 (dev)

**[2026-10-22 23:44 KST]** iMac/쌍아-막내9 → iMac/쌍아

> 지시서: [ORDER_20261022_iMac쌍아_막내_INFRA_Gemini35_타임아웃가드.md](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_Gemini35_타임아웃가드.md) (main `c2ccd7d4`)
> 투입 출처: 작가님 2026-10-22 23:26 iMac 쌍아 세션 사람 턴 "모두 실행해" → 쌍아 세션 간 메시지 전달. prod 승인 아님.
> 선행: [COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini25_3x이전.md](COMPLETION_20261022_iMac쌍아-막내9_INFRA_Gemini25_3x이전.md)

✅ **결론**: ①의 3.5 이전 커밋 2개를 현 main 위로 다시 올리고 가드를 넣어 dev 4개 서비스에 배포했습니다. 서비스별로 정상 3건과 강제 초과 1건이 모두 통과했습니다. 시험 중에 **실제 429가 1회 발생**했고, 가드가 그 요청을 "생략"으로 넘기는 것까지 실증됐습니다. prod는 작가님 승인을 기다립니다.

## 1. 브랜치·커밋

브랜치 **`makne9-gemini35-guard`** (origin/main `c2ccd7d4` 기준)
- `80556810` (← `c15534fb`) 텍스트 모델 3.5-flash·global 전환 — 충돌 없이 cherry-pick
- `d8e412ce` (← `ff00ca47`) 콜스코프·슬러그 `thinkingLevel MINIMAL`
- `a7f6d68f` **타임아웃·건너뛰기 가드** (이번 작업)
- deploy.sh는 손대지 않았다 — main 값(시크릿 2차 반영·MATTE 체인) 그대로.

## 2. 가드 설계

| 서비스 | 호출 | 상한 | 초과·429 동작 |
|------|------|------|------|
| idphoto-kr · jp · studio | 사전분석 `runPreCheck` | **15s** (`PRECHECK_TIMEOUT_MS`) | 재시도·폴백 없이 즉시 `{suitable:true, score:0, skipped:true, reason, note:'사전분석 생략'}` + 로그 `[Precheck-Skip] reason=timeout\|429 model=…` (WARNING) |
| idphoto-jp | 얼굴 좌표 `detectFace` (생성 중 크롭용) | 15s | 기존대로 `null` → 폴백 크롭. 로그에 사유 표기 |
| portal | 콜스코프 `extractFromImage` | **30s** (`CALLSCOPE_TIMEOUT_MS`, config.js 정본) | 명시 오류 `판독 시간 초과 (N초)` / `판독 요청 한도 초과 (429)` → 기존 502 `extract_failed` 경로 |

- **15s 근거**: 3.5-flash@global 이미지 사전분석 실측 dev 18콜 3.3~10.9s(p95 ≈ 11s), 이번 dev 12콜 3.2~6.0s. 이상 사례는 약 60콜 중 429 1·200s+ 2. 상한을 p95보다 약간 넉넉하게 잡았다.
- **고객 흐름**: 클라이언트(`idphoto-kr/public/result.js` 205~219행)는 `suitable:true`면 그대로 생성으로 넘어간다. 과금·생성권 소모 규칙은 생성 단계 소관이라 바꾸지 않았다. 생략 응답은 "사전분석 OK (0점)"으로 보이는 표시상 흠이 있으나, 지시서상 클라이언트는 범위 밖이라 그대로 두었다.
- **구현**: SDK `config.abortSignal = AbortSignal.timeout(ms)` 사용. 로컬 실측에서 1ms·300ms는 중단되고 15s는 정상이었다.
  - ⚠️ SDK가 송신 중 중단을 `"exception AbortError: … sending request"`라는 **일반 Error로 감싸 올리는** 경우가 있다. 처음엔 콜스코프 강제 초과 3/3이 이름 판별을 빠져나갔고, 메시지 판별을 추가해 해결했다(4개 서비스 공통).
- **강제 초과 시험 수단**: dev에서만 `X-Precheck-Timeout-Ms` 헤더를 읽는다(`K_SERVICE`가 `-dev`로 끝날 때만, prod는 무시). 인프라 env를 건드리지 않으려고 이 방식을 택했다.
- 정리: kr·jp에 남아 있던 미사용 `GEMINI_API_KEY` 선언 2줄을 삭제했다(env는 ②에서 이미 제거됨).

## 3. dev 판정표

| 서비스 | dev 리비전 | 정상 3 | 강제 초과 1 (헤더 1ms) | 로그 |
|------|------|------|------|------|
| idphoto-kr | `00005-mx7` | ✅ 3/3 200, 98점 | ✅ 200 `skipped:true reason:timeout` 0.27s | `[Precheck-Skip] reason=timeout` ✅ |
| idphoto-jp | `00004-dh5` | ✅ 3/3 200 (1차 시도 3번째가 **자연 429 → `skipped reason:429` 4.4s**, 재시험 3/3 정상) | ✅ 200 `reason:timeout` 0.27s | `reason=429` 1·`reason=timeout` 2 ✅ |
| studio | `00003-27r` | ✅ 3/3 200 | ✅ 200 `reason:timeout` 0.27s | ✅ |
| portal | `00199-4pj` (첫 시도 `00198-g98`은 Cloud Run "Container import failed" 일시 장애, 재시도 1회 성공) | ✅ 콜스코프 실모듈 3/3(3.3~5.2s, 판독값 일치) · `/health` 200 · 기동 로그 `텍스트 모델: gemini-3.5-flash @global` · SM 참조 유지(KAKAO·LINE·TELEGRAM) | ✅ `CS_TIMEOUT_MS=1` → 3/3 `판독 시간 초과 (0초)` 명시 오류 | — |

- 포털 콜스코프는 어드민 인증 뒤에 있어 dev HTTP 대신 같은 모듈을 로컬에서 실호출했다(①과 같은 방식). 포털 단위 테스트는 136/136 통과.
- **"생성 완주"는 코드 근거까지만**: 생략 응답 → 클라이언트가 생성 단계로 진행(result.js). 실제 생성은 로그인·크레딧 소모가 필요해 dev에서 돌리지 않았다(고객·크레딧 데이터 미접촉).

## 4. 관측 — 429는 드물지 않다

- 3.5-flash@global의 429가 이번 세션 누적 약 80콜 중 **2회**(22:0x 슬러그, 23:39 jp 사전분석). 가드가 없었다면 kr은 lite로 폴백했고 jp·studio는 `분석 실패` 응답이었다. 지연이 생기지는 않았을 것이다.
- prod 트래픽에서 429 빈도는 쿼터 실측이 필요하다(콘솔 quota unit). 이번엔 가드로 고객 영향을 "사전분석 생략"으로 묶어 두었다.

## 5. prod 판정표 (승인 요청용)

| 서비스 | 현 prod (롤백 대상) | prod 변경 | 동승 변경 | 권고 |
|------|------|------|------|------|
| monkos-idphoto-kr | `00211-4k7` | 사전분석 3.5-flash(→3.5-flash-lite 폴백)@global + 15s 가드 | 없음 (`404a4518` 이후 서비스 코드 변경은 이 브랜치 3커밋뿐) | 승인 가능 |
| monkos-idphoto-jp | `00131-nt9` | 사전분석·detectFace 3.5-flash@global + 15s 가드 | 없음 | 승인 가능 |
| monkos-studio | `00028-ml8` | 사전분석 3.5-flash@global + 15s 가드 | 없음 | 승인 가능 (내부용) |
| monkos-portal | `00568-w2l` | CMS·콜스코프·슬러그 3.5-flash@global, 사고 설정 2곳, 콜스코프 30s | 없음 | 승인 가능 |

- 배포 후 검증: 서비스별 사전분석 1회(정상) · 기동 로그 모델명 · `[Precheck-Skip]` 로그 쿼리가 동작하는지(prod는 헤더를 무시하므로 자연 발생만) · monkos.ai `/health` 2회 히트.
- 선행 조건: `makne9-gemini35-guard`를 main에 반영한 뒤 메인 체크아웃에서 각 `deploy.sh prod`.
- 원장 (187) resolve는 prod 반영 후.

## 위임 기록 (ch3 1조)
- 하위 주체 없음. Vertex 실호출 약 30회(dev 스모크 24 + 로컬 abort 3·콜스코프 6).

📁 산출: 본 COMPLETION · 커밋 3건(브랜치 `makne9-gemini35-guard`) · 세션 로그 어펜드 · PF_INFRA 1행
🔀 쌍아 판단: 브랜치 main 반영 → 서비스별 prod 승인 요청
