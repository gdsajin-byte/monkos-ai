---
type: order
date: 2026-11-06
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: 실기기 대여 테스트 도구 1단계 — Firebase Test Lab(Google)으로 MONKOS Go 기기별 수읽기 속도 자동 실측(iOS Game Loop 먼저, 안드로이드는 빌드 경로 조사), 무료 한도 가드 내장. AWS Device Farm은 계정 생성 뒤 2단계
status: 대기
portfolio: PF_GO
---

# ORDER — 실기기 테스트 도구 (Firebase Test Lab)

**[2026-11-06 05:29 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-06 05:29 iMac/쌍아 세션 사람 턴 — "어제 탐색했던 실기기 테스트 aws 구글, 구글쪽부터 도구에 담아놓고 아마존은 계정 만들면 개시. 구글이 어느 디바이스까지 커버되는지 무료로 어느 정도 처리 가능한지". 선행 조사: `monkos-ops/ops/reports/2026-11/COMPLETION_20261105_iMac쌍아-막내3_GO_기기사양별실측.md` §대여 서비스 비교(Game Loop 적합 판정), `AI_Factory/go_ios_bench/README.md`(빌드·자동 측정 autobench.json).

## 0. 쌍아 실측 (05:29, 프로젝트 `monkos-3c6e4` — 결제 연결됨 = Blaze)

- `testing.googleapis.com` 활성. `toolresults.googleapis.com`은 목록에 없음 → 실행 전 활성 필요(작가님 05:29 "구글 쪽부터 도구에 담아" = 이 범위 승인으로 본다. 다른 API·결제 설정은 건드리지 않는다).
- iOS 실기기 6종: iPhone 8·11 Pro·14 Pro(iOS 16.6, 전부 deprecated) · iPad 10세대(16.6, deprecated) · **iPhone 16 Pro(18.3)** · **iPhone SE 3(18.4·26.3, 기본)**.
- 안드로이드 실기기 204종: 삼성 130(갤럭시 A03s·A04s·A05s·A06·A10·A12~A16·S22·S24 등) · 구글 Pixel 28(3~11) · 모토로라 23 · 기타. API 27~37.
- 요금(11-05 쌍아 요금표 실측): Blaze 실기기 하루 30분 무료, 초과 $5/시간. Spark는 하루 5회.

## 1. 할 일

1. **도구** `AI_Factory/device_lab/` 신설: `ftl.sh {models|run|fetch|usage}`.
   - `models ios|android`: 기종 목록을 `catalog_YYYYMMDD.csv`로 저장한다. 기종 목록은 바뀌므로 매번 실측한다.
   - `run ios --models a,b --ipa PATH`: `gcloud firebase test ios run --type game-loop`을 실행한다. 결과 버킷에서 `GameLoopResults/`(autobench 로그)를 내려받는다.
   - `usage`: 오늘 쓴 실기기 분을 로컬 원장(`~/.monkos/device_lab/usage.jsonl`)에 합산한다.
   - **무료 한도 가드**: 오늘 누적 + 이번 실행 예상 분이 25분(30분 무료의 여유 5분)을 넘으면 실행을 거부한다. 메시지: `❌ ftl: 무료 한도 초과 예상 — 오늘 N분 + 예상 M분 > 25분 (유료 0)`. 이 가드는 우회 플래그 없이 둔다. 넘기려면 작가님 승인 후 상수를 바꾼다.
   - 실행마다 `--timeout`을 기종당 3분 이하로 둔다.
2. **iOS Game Loop 패치**: `go_ios_bench`의 autobench 빌드에 `firebase-game-loop` URL 스킴 진입을 추가한다. 진입하면 자동 측정을 하고, 결과를 `Documents/GameLoopResults/`에 쓴 뒤 종료한다. IPA 빌드는 README대로 M1 화면 터미널이 필요하다(ssh 키체인 서명 실패). 막히면 빌드 명령 1줄을 작가님께 요청할 문구로 정리해 반환한다.
3. **1차 실측(무료 한도 안)**: iPhone SE 3 · iPhone 8 · iPhone 11 Pro 3대 × 1회. 기종별 1500·자동 visits 시간과 초당 visits를 표로 만든다. 기존 iPhone18,1 실측(1,000 v/s)과 비교한다.
4. **안드로이드 조사만**: KataGo 안드로이드 빌드 경로를 조사한다(공개 포크·OpenCL/Vulkan/CPU 백엔드). Game Loop APK로 같은 자동 측정이 가능한지, 예상 작업량은 얼마인지 본다. 빌드는 하지 않는다. 대상 후보는 저가 갤럭시 A05s·A15·A16, 기준은 S24·Pixel 9.

## 2. 반환

COMPLETION(도구 사용법·가드 스모크 양성/음성·1차 실측 표·안드로이드 경로 조사) + 브랜치 SHA. `references.md` 도구 맵과 `AI_Factory/REGISTRY.md` §2 등재 문안은 쌍아가 넣는다(초안만).

## 3. 하지 않는 것

- AWS Device Farm(계정 생성 후 2단계). 유료 초과 실행. GCP 결제·다른 API 변경. 8765 재기동.

## 4. 준수

헌법 3조·4조 1항(서비스 계정 키 생성 금지 — 현재 gcloud 로그인 사용). 도구 3요건(인지·스모크·실패 가시화).
