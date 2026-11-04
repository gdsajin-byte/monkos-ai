---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내3
status: 마감
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내3_GO_아이폰실측_MONK봇.md
---

# COMPLETION — MONK 봇 아이폰 온디바이스 실측

**[2026-11-05 06:51 KST]** iMac/쌍아-막내3 → iMac/쌍아

출처: 작가님 06:10 "이걸 아이폰 자체로 돌려봐" · 06:11 "m1에 다 깔려있을거야" · 06:17 "M1켰어" · 06:21 "연결했어"(쌍아 세션 사람 턴) → 지시서. 서명 단계 2회는 작가님이 M1 화면에서 직접 `monk_build.sh`를 실행했다(06:28, 06:38 — 쌍아 전달).

## 결론

MONK 봇(b10)은 아이폰(iPhone18,1)의 GPU(Metal)만으로 **1500 visits에 약 1.5초, 초당 약 1,000 visits**를 낸다. 같은 국면 20회 연속 계산에서도 감속이 없었다. b18보다 약 9배 빠르다. 서버 없이 폰 안에서 대국 상대가 될 수 있는 속도다.

## 측정 표 (1500 visits, 같은 표본 대국의 국면)

| 모델 | 첫 계산(빈 판) | 100수 국면 | 200수 국면 | 20회 연속(100수) 중앙값 | 연속 처음 5 → 마지막 5 | 콜드 스타트(모델 로드→GTP 준비) |
|---|---|---|---|---|---|---|
| **b10 (MONK, 10.5MB)** | 5.24초 (292 v/s, Metal 워밍업 포함) | **1.59초 (962 v/s)** | **1.52초 (1,007 v/s)** | **1.53초 (998 v/s)** | 1.90 → 1.52초 (감속 없음, 약 40초 구간) | 1초 미만 |
| b18 (kata1, 93MB) | 10.63초 (144 v/s) | 14.16초 (108 v/s) | 14.49초 (106 v/s) | 18.27초 (84 v/s) | 16.91 → 18.95초 (+12%, 발열 추정, 약 6분 구간) | 약 1초 |

- 백엔드: Metal GPU다(설정 `coremlDeviceToUse = 0` → gpuIdx<100 경로). KataGo v1.16.4, 탐색 스레드 32, nnMaxBatchSize 16(포크 기본값)이다. KataGo 로그에는 장치 이름 줄이 없다.
- 첫 계산이 긴 것은 Metal 그래프를 처음 만드는 비용이다. 같은 실행 안의 두 번째 계산부터는 정상 속도다.
- **메모리: 미측정.** devicectl로는 잡히지 않고 Xcode Instruments가 필요하다.
- 측정 조건: 앱이 화면 앞에 있어야 한다. b18 첫 시도(06:38)는 앱이 백그라운드로 가서 iOS가 일시정지시켜 첫 계산에서 5분간 멈췄다. 화면을 켜 둔 재시도(06:44)로 측정했다.

## 포크·백엔드 선정

- **ChinChangYang/KataGo `metal-coreml-stable`**(7743301, 2025-11-06)의 `ios/KataGo iOS`를 골랐다. 라이선스는 KataGo LICENSE(MIT 계열)와 동봉 라이브러리 고지다.
  - Metal 경로가 `.bin.gz`를 그대로 읽어서 변환 도구 설치가 필요 없다.
- `ios-dev`(bb8db4e, 2026-10, "KataGo Anytime", MLX)는 보류했다. Xcode 26에서 `.metal` 셰이더 빌드에 Metal Toolchain 추가 설치가 필요할 수 있어서다(설치 게이트).
- CoreML(신경망 칩) 경로는 mlpackage 변환에 coremltools(pip 설치)가 필요해서 쓰지 않았다. 신경망 칩 실측은 설치 승인 뒤 별건으로 한다.
- 포크 결함을 1건 수정했다: iOS 프로젝트에 `sgfmetadata.cpp`·`evalcache.cpp`가 빠져 있어 링크가 실패했고, katago 타깃에 등록했다.

## 아이폰 앱 상태

- 앱은 "KataGo iOS"(번들 `ai.monkos.go.bench`)로 설치돼 있고, 기본 모델은 **MONK b10**이다(Documents에 둠 — 이후 모델 교체는 재빌드 없이 ssh로 가능하다). 수읽기 1500, 규칙 korean, 덤 6.5다.
- IDPASS 번들·DerivedData는 건드리지 않았다(빌드는 `_ext/katago-ios/build/` 따로).
- 앱 UI는 무변경이다. `KataGoHelper.mm`에 비UI 패치 2개만 넣었다(로그·벤치 입력, Documents 모델 우선).
- 개발 서명이라 프로필이 만료되면 재설치해야 한다.
- 케이블 없이 실행된다. 무선 디버깅 연결은 확인하지 않았다.

### 작가님 사용 안내 (3줄)

1. 아이폰에서 **KataGo iOS** 앱을 연다(처음 실행 때 신뢰 창이 뜨면: 설정 → 일반 → VPN 및 기기 관리 → JeongKyu Shin → 신뢰).
2. **Goban** 탭에서 판을 누르면 흑·백이 번갈아 놓이고, 화면에 MONK 봇의 후보수 분석이 뜬다(분석판).
3. 봇이 직접 응수하게 하려면: 내 수를 둔 뒤 **Command** 탭에 `genmove w`(내가 흑일 때)를 입력하고, Goban으로 돌아가 확인한다.

⚠️ 이 포크 앱에는 '엔진이 응수하는' 대국 모드가 없다. 지시서 §1-5 "대국 가능 상태"는 위 3번 우회로만 충족된다.

## 💡 제안 (구현 안 함)

- P1 **대국 모드 최소 패치**: Goban에서 사람 착수 뒤 자동으로 `genmove <상대색>` → `showboard`. ToolbarView에 '봇 색' 토글 1개를 둔다. UI 변경이라 쌍아 판정이 필요하다.
- P2 `ios-dev`(KataGo Anytime, 2026-10) 검토: 대국 모드가 있는지, Metal Toolchain 설치가 필요한지 실측한다.
- P3 신경망 칩(CoreML) 실측: coremltools 설치 승인 뒤 b10을 mlpackage로 변환해 GPU와 비교한다(전력·발열 이점 기대).
- P4 메모리·장시간 발열: Instruments(Allocations·Thermal)로 10분 대국 실측.
- 판단 재료: b10이 폰에서 1.5초/1500v이니, 네이티브 앱(PF_GO ⑥)은 **서버 없는 온디바이스 봇**이 현실적이다. b18급은 14~19초라 대국용으로는 부적합하다(분석용만).

## 📁 산출

- 재현 스크립트: `AI_Factory/go_ios_bench/`(README 포함)
- M1: `~/developer/_ext/katago-ios/`(포크·빌드·`results/`·`models/`)
- 로그: iMac `~/.monkos/go-board/analysis/iphone_v0/{b10,b18}/gtp_logs/`

## 🔀 git

- 브랜치 `worktree-go-kibo-stats`. 커밋 후 origin SHA를 대조한다(아래 세션 로그).
