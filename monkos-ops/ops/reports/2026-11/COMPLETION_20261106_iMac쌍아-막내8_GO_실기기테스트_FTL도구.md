---
type: completion
date: 2026-11-06
device: iMac
agent: 쌍아-막내8
status: 진행
portfolio: PF_GO
---

# COMPLETION — 실기기 테스트 도구 1단계 (Firebase Test Lab)

**[2026-11-06 05:35 KST]** iMac/쌍아-막내8 → iMac/쌍아

- 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_GO_실기기테스트_FirebaseTestLab도구.md`
  - 수신 시점 origin/main에 없어 공용 체크아웃의 미커밋본을 읽었다.
- 출처: 작가님 05:29 "구글쪽부터 도구에 담아놓고 아마존은 계정 만들면 개시"
- 브랜치: `worktree-makne8-ftl`

## 1. 결론

- ✅ **도구** `AI_Factory/device_lab/ftl.sh {models|run|fetch|usage}` + `smoke_ftl.sh` + README
  - 무료 한도 가드는 25분이고 **우회 플래그가 없다**.
  - 기종당 상한은 3분이다.
  - 원장은 실행 직전에 상한 분으로 기록한다(보수적).
- ✅ **기종 목록 실측**(05:33, 프로젝트 monkos-3c6e4)
  - iOS 6종: iPhone SE 3(18.4·26.3, 기본) · iPhone 16 Pro(18.3) · iPhone 8·11 Pro·14 Pro·iPad 10(16.6, 전부 deprecated)
  - 안드로이드 실기기 204종: 삼성 130 · 구글 28 · 모토로라 23 · OnePlus 4 · 소니 3 · OPPO 3
  - 지시서 후보 기종이 모두 있다: Galaxy A05s(35) · A15(34) · A15 5G · A16(35) · A16 5G · S24(34·36) · Pixel 9 Pro(34·35)
- ✅ **Game Loop 패치** `AI_Factory/go_ios_bench/patch_gameloop.py`(멱등) + `build_ipa.sh`(개발 서명 IPA·서명/URL 스킴 확인)
- ⏳ **1차 실측 미실행 — 막힘**
  - M1이 오프라인이다(테일넷 마지막 접속 6시간 전, ssh 시간 초과). 포크 확인·패치 적용·IPA 빌드가 모두 M1에서만 된다.
  - 서명 빌드는 M1 **화면 터미널** 필수다(README — ssh는 키체인 잠김).
  - IPA가 없어서 FTL 실행 0회, 사용 0분이다. `toolresults.googleapis.com` 활성도 첫 실행 때로 미뤘다(지금 활성할 이유 없음).
- ✅ **안드로이드 경로 조사**(빌드 안 함) — §5

## 2. 작가님께 요청할 것 (M1 화면 터미널, 1줄)

M1을 켜 주시면 막내8이 패치 파일 2개를 M1 `~/developer/_ext/katago-ios/`에 `monk_*` 이름으로 복사하고 패치를 적용한다(ssh로 가능한 부분). 그다음 **M1 화면 터미널**에서 아래 1줄을 실행해 주시면 된다.

```
cd ~/developer/_ext/katago-ios && bash monk_build_ipa.sh
```

산출은 `build/gameloop/MONKBench.ipa`이다. 이후 막내8이 iMac으로 가져와 `ftl.sh run ios --models iphonese3,iphone8,iphone11pro --ipa …`(가드: 3대×3분=9분 ≤ 25분)를 실행한다.

⚠️ 앱 최소 iOS가 16.6보다 높으면 iPhone 8·11 Pro(16.6)에는 설치가 안 된다. 패치 스크립트가 빌드 설정을 읽어 경고만 한다. 그 경우 SE 3·16 Pro로 대체한다.

## 3. 도구 스모크 (가드 — 시험 원장만, gcloud 실행 없음)

| # | 경우 | 기대 | 결과 |
|---|---|---|---|
| 1 | 빈 원장 · 3대×3분 = 9분 | 통과 | ✅ rc 0 |
| 2 | 오늘 18분 + 9분 = 27 > 25 | 거부 | ✅ rc 1 "무료 한도 초과 예상 — 오늘 18분 + 예상 9분 > 25분 (유료 0)" |
| 3 | 오늘 18분 + 2대×3분 = 24 ≤ 25(다른 날 30분 제외) | 통과 | ✅ rc 0 |
| 4 | 기종당 5분 | 거부 | ✅ rc 1 |
| 5 | 안드로이드 run | 거부 | ✅ rc 1 |
| 6 | IPA 없음 | 실행 전 거부 | ✅ rc 1 |
| 7 | 우회 시도 `--force` | 거부 | ✅ rc 1(모르는 인자) |
| 8 | 거부·dry-run 뒤 원장 행 수 | 변화 없음 | ✅ 2행 그대로 |

- `models ios/android` 실제 실행 2회는 성공했다(읽기 전용). `usage`: 오늘 0분.

## 4. Game Loop 패치 설계

- FTL은 `firebase-game-loop://?scenario=N`으로 앱을 띄운다. 그러면 기존 `runGtp`의 `monkAutoBench`(자동 측정)가 돈다.
- 그 직후 **설치당 1회**(`GameLoopResults/done`이 없을 때) 다음을 한다.
  1. `benchmark -v 1500 -n 3 -t 32`와 `-v {자동 결정값}`을 각각 돌린다 → visits/s · 수당 초
  2. `Documents/GameLoopResults/bench_{기종}.json`을 쓴다(autobench.json 포함)
  3. `firebase-game-loop-complete://`를 연다(메인 스레드)
- SwiftUI 앱 파일(M1에서 확인 불가)은 건드리지 않는다. FTL 밖에서 완료 URL을 열면 처리할 앱이 없어 아무 일도 없다.
- Info.plist에 `firebase-game-loop` URL 스킴을 등록한다. 생성형 Info.plist면 수동 추가를 안내하며 멈춘다.
- 근거: Firebase 문서 [Run a Game Loop test](https://firebase.google.com/docs/test-lab/ios/run-game-loop-test?authuser=00)
  - URL 스킴 등록 · 완료 URL · GameLoopResults · 개발 서명(Test Lab이 다시 서명)
- gcloud는 `--scenario-numbers`가 **beta에만** 있어 `gcloud beta firebase test ios run --type game-loop`을 쓴다.
- 1차 실측 표(기종별 1500v·자동 visits 시간과 visits/s, 기존 iPhone18,1 1,000 v/s와 비교)는 IPA 확보 뒤 이 보고서 §6에 붙인다.

## 5. 안드로이드 빌드 경로 조사 (빌드 안 함)

| 경로 | 내용 | 판단 |
|---|---|---|
| 공식 | KataGo 공식 안드로이드 빌드는 없다(이슈 [#321](https://github.com/lightvector/KataGo/issues/321)에서 요청만 있음) | — |
| 선례 | **BadukAI**(aki65, 2020) — 안드로이드 네이티브 KataGo, OpenCL GPU. 소스 비공개, 첫 실행 OpenCL 튜닝 약 4분, 일부 기기 초기화 멈춤 보고([lifein19x19](https://lifein19x19.com/viewtopic.php?p=259906)) | OpenCL 경로는 가능하지만 기기 편차가 크다 |
| ① NDK + Eigen(CPU) | 모든 기기 동작, 가장 느림. Eigen은 NDK CMake 빌드 선례가 있다 | **1순위(기준선)** — 저가 A05s·A15에서 b10이 쓸 만한지 판정용 |
| ② NDK + OpenCL | 삼성(Adreno·Mali)은 대개 libOpenCL을 탑재한다. **Pixel은 OpenCL을 공식 제공하지 않는다** → Pixel 9 기준 측정 불가 가능성 | 2순위 — 갤럭시 위주 |
| ③ 추론만 TFLite/NNAPI | 망을 변환하고 KataGo 탐색과 백엔드를 새로 이어야 한다 | 작업량 큼, 이번 범위 밖 |
| Game Loop | 안드로이드는 인텐트 `com.google.intent.action.TEST_LOOP`로 띄우고 결과 파일은 인텐트 URI로 쓴다 → JNI 래퍼 앱(액티비티 1개) 필요 | — |

- 예상 작업량(추정): ① NDK·Eigen 바이너리 1~2일 · Game Loop 래퍼 앱 1일 · ② OpenCL 추가 2~4일(기기 편차 대응).
- 측정 대상(카탈로그 실측): A05s(35) · A15(34) · A16(35) / 기준 S24(34·36) · Pixel 9 Pro(34·35).

## 6. 남은 일

- ⏳ M1 온라인 → 패치 복사·적용 → 작가님 화면 터미널 1줄 → IPA → toolresults API 활성 → 1차 실측 3대(9분) → 표 추가
- ⏳ `references.md` 도구 맵·`AI_Factory/REGISTRY.md` §2 등재 문안(초안, 쌍아 기입):
  - "ftl.sh(device_lab) | 인프라 | `AI_Factory/device_lab/` | 실기기 FTL — models·run·fetch·usage, 무료 25분 가드(우회 없음), 스모크 smoke_ftl.sh 8/8, 실패 가시화 `❌ ftl:`"
