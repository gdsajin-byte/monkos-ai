---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내3
subject: MONK 봇(b10) 아이폰 자체 구동 실측 — M1(Xcode 26.5·개발 서명 있음)에서 공개 KataGo iOS 포크를 빌드해 작가님 아이폰(iPhone18,1, M1에 케이블 연결됨)에 설치, 1500 visits 응수 시간·초당 visits 측정 + 대국 가능 상태. PF_GO ⑥-1
status: 대기
portfolio: PF_GO
---

# ORDER — 아이폰 실측: MONK 봇 온디바이스

**[2026-11-05 06:21 KST]** iMac/쌍아 → iMac/쌍아-막내3

출처: 작가님 2026-11-05 iMac 쌍아 세션 사람 턴.
- 06:10 "이걸 아이폰 자체로 돌려봐"
- 06:11 "Idpass 이미 m1으로 빌드했었잖아 m1에 다 깔려있을거야"
- 06:17 "M1켰어 설정가이드해"
- 06:21 "연결했어"

범위 승인 = §1·§2. PF_GO Phase ⑥-1(아이폰 실측)에 해당한다.

## 0. 환경 (쌍아 실측 06:17~06:21, iMac에서 `ssh m1`)
- M1: macOS 26.6.2, **Xcode 26.5(17F42)**. 서명 인증서는 두 개다.
  - `Apple Development: JeongKyu Shin (Q63WT2V55B)`
  - `Apple Distribution … (ZPMVHPDUHW)`
- 잠자기 0, womp 1(06:18 작가님 설정).
- 아이폰: `xcrun devicectl list devices` → `iPhone`, `iPhone18,1`, state available, 식별자 `3AE3A741-9156-5734-A7CE-92D0A6A3DFEE`. 개발자 모드는 작가님이 켰다고 진술했다. 설치할 때 확인한다.
- 도구: git·python3(/usr/bin)·pip3는 있다. **brew·cmake·coremltools는 없다.**
- 모델: iMac `~/.monkos/katago/monk_b10_s41M.bin.gz`(10.5MB, sha256 2ba167f4…). 기존 IDPASS 빌드 흔적은 `~/Library/Developer/Xcode/DerivedData/MonkosCrop-*`.

## 1. 할 일
1. **포크 선정**: 공개 KataGo iOS 프로젝트를 고른다. 후보는 ChinChangYang/KataGo의 iOS 앱 프로젝트(Metal 또는 CoreML 백엔드)이고, 다른 활성 포크가 있으면 비교한다.
   - `.bin.gz`를 그대로 읽는 백엔드(Metal)가 있으면 그것을 우선한다. 변환 도구 설치를 피할 수 있다.
   - 클론 위치는 M1 `~/developer/_ext/katago-ios/`(본진 레포 밖)다. 라이선스 파일을 확인한다.
2. **모델 탑재**: monk_b10_s41M을 앱 번들 또는 앱 문서 폴더에 넣는다. 비교용 b18(`kata1-b18c384nbt-s9996604416…bin.gz`, 93MB)도 함께 넣어 같은 측정을 한다.
3. **빌드·설치**
   - 자동 서명, 팀은 개발 인증서의 팀을 쓴다.
   - 번들 ID는 `ai.monkos.go.bench`처럼 시험용 이름으로 한다. 기존 IDPASS 번들 ID는 건드리지 않는다.
   - `xcodebuild` + `xcrun devicectl device install app`으로 설치한다.
   - 처음 실행할 때 아이폰에서 개발자 신뢰 승인이 필요하면 작가님께 1단계로 안내한다(설정 → 일반 → VPN 및 기기 관리 → 개발자 앱 신뢰).
4. **측정** (같은 국면 3개 × 모델 2개)
   - 수읽기 1500의 응수 시간, 초당 visits, 백엔드(GPU/신경망 칩)를 측정한다.
   - 콜드 스타트(첫 로드) 시간과 메모리도 잰다.
   - 10분 연속 대국 시 발열·감속을 볼 수 있으면 함께 측정한다.
5. **대국 가능 상태**: 포크 앱에 사람 대 엔진 대국 화면이 있으면 MONK 봇을 기본 상대로 설정해 둔다. 작가님이 아이폰에서 바로 두실 수 있게 한다. 앱 UI는 고치지 않는다.

## 2. 멈춤 조건 (승인 게이트, ch1 7조)
- **M1에 패키지·도구 설치가 필요하면 멈추고 보고한다.** 대상은 brew, cmake, pip install(coremltools 등), Xcode 추가 구성요소다. 무엇을 왜 설치해야 하는지와 대안(설치 없는 백엔드)을 함께 적는다.
- Apple ID 로그인, 2단계 인증, 기기 등록 확인 창처럼 작가님 손이 필요한 단계도 멈추고 1줄로 안내한다.
- 유료 계정 설정·App Store Connect·TestFlight는 이번 범위 밖이다.

## 3. ⚠️ 준수 조항
- 원격 기기 규칙: M1에 본진 레포를 새로 클론하지 않는다. 외부 포크는 `_ext/`에만 둔다. M1 기존 IDPASS 프로젝트·DerivedData는 건드리지 않는다.
- 4060·iMac 8765에는 영향을 주지 않는다. 진행 중인 소리 묵음 진단 반영(같은 막내3 지시서)은 별건이니 순서를 섞지 않는다. 15:00 이후 4060 예약 작업이 우선이다.
- 헌법 4조 1·2항: 시크릿·인증서 내보내기 금지, 파괴 금지. 헌법 3조 1·2항: `date`·세션 로그·완료 보고·PF_GO 1행.

## 4. 완료 기준
- [ ] 포크·백엔드 선정 근거 + 라이선스
- [ ] 아이폰 설치 성공(또는 멈춤 지점 보고)
- [ ] 측정 표(모델 2 × 국면 3: 1500v 응수 시간·visits/s·콜드 스타트·메모리)
- [ ] 작가님 아이폰 대국 가능 상태 + 사용 안내 3줄
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261105_iMac쌍아-막내3_GO_아이폰실측.md`, 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[research] MONK 봇 아이폰 온디바이스 실측 (PF_GO)`
