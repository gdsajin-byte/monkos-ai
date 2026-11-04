---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내3
status: 진행
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내3_GO_기기사양별실측_자동벤치_안드로이드조사.md
---

# COMPLETION — MONKOS Go 기기 사양별 실측 · 자동 벤치 · 안드로이드 조사

**[2026-11-05 07:34 KST]** iMac/쌍아-막내3 → iMac/쌍아

출처: 작가님 07:27 "폰성능에 따라 어느정도 사양부터 가능한지 실측이 필요해" · 07:30 보유 기기 진술(쌍아 세션 사람 턴) → 지시서.

## 1. 첫 실행 자동 측정 — ✅ 구현(컴파일 통과), 기기 검증 대기
- 시험 앱 `KataGoHelper.mm`에 `// ===== MONK autobench` 블록을 넣었다.
  - 측정: KataGo `benchmark -v 300 -n 3 -t 32,32`를 cout 캡처로 1회 돌리고, 워밍업 뒤 두 번째 값을 쓴다.
  - 결정: `clamp(floor(vps×2×0.85/50)×50, 100, 1500)`
  - 기록: `Documents/autobench.json`
  - 적용: `-override-config maxVisits=N`
- 재사용 단위 함수 3개와 정식 앱 이전 시 주의사항은 `AI_Factory/go_ios_bench/AUTOBENCH_DESIGN.md`에 있다.
- 서명은 M1 화면에서만 된다(ssh 키체인). 그래서 기기 설치 때 작가님이 `monk_build.sh`를 실행해야 한다.
- 빌드 스크립트 개선: 연결된 아이폰을 자동으로 고른다. 기기가 없거나 `generic`을 주면 컴파일만 한다.

## 2. 기기별 표 (MONKOS Go = b10, Metal, 1500 visits)

| 기기 | 칩 | iOS | 1500v 응수 | visits/s | 첫 계산 | 연속 감속 | 자동 결정 수읽기 |
|---|---|---|---|---|---|---|---|
| 아이폰 17 Pro (iPhone18,1) | A19 Pro | 26.6.2 | 1.5초 | 약 1,000 | 5.2초 | 없음(20회) | ⏳ 재설치 후 실측(계산상 1500 상한) |
| 아이폰 14 Pro | A16 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| 아이폰 13 | A15 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

- 기기별 3줄 안내는 쌍아 경유로 작가님께 드렸다(07:34). 측정은 "연결됨" 신호를 받은 뒤 `DEV=<기기ID> monk_bench.sh`로 한다.

## 3. 안드로이드 이식 조사 (조사만)

**결론**: 갤럭시 A 저가형에서 b10의 2초 안 수읽기는 **약 50~150 visits로 추정**한다(확인 수준: 추정 — 동급 칩·b10 Android 실측 보고 0건). 우리 하한 100 근처라 대국 품질이 "약한 봇" 수준이 된다. 정확한 판정은 모델명을 받은 뒤 실측해야 한다.

- 근거 사슬:
  - Snapdragon 855+에서 KataGo 20b가 OpenCL로 약 10 n/s(2020, 2차).
  - 20b(c256) 대비 b10(c128)은 연산량이 약 1/8이다. 그러면 855+에서 b10은 약 80 n/s로 환산된다.
  - 갤럭시 A 저가 칩(Helio G99·Dimensity 6100+/6300·Exynos 1280/1330·SD680)의 GPU는 855+의 약 0.4~0.8배로 본다(일반 지식, 미확인).
  - 이를 곱하면 약 30~65 v/s, 2초면 약 60~130 visits다.
  - 아이폰 실측의 b18/b10 비율(9.4배)이 연산량 비례와 맞아서 환산식은 대체로 성립한다.
- 공개 경로:
  - BadukAI(aki65): 표준 .bin.gz 망은 CPU, 최적화된 18b·28b만 NPU(Qualcomm·MediaTek). NPU 경로에서 2~24배 향상을 주장한다(2022, 2차).
  - KataGo 공식에는 Android 빌드가 없다(issue #321, 2020~ open).
  - OpenCL은 Mali 튜닝 크래시(issue #321, Mali-G710, 2024) 같은 호환성 위험이 있다.
- 웹 대안:
  - web-katrain(TensorFlow.js, WebGPU→WASM)은 서버 없이 브라우저에서 KataGo 망을 돌린다(MIT, 1차). 다만 모바일 수치는 없다.
  - Chrome Android WebGPU는 Android 12+·Qualcomm/ARM GPU에서 기본 켜짐(Chrome 121, 1차). 삼성 Exynos Xclipse(AMD) GPU는 미확인이다.
- **필요 도구(M1, 지금 없음 — 설치 안 함)**: Android Studio(약 1~2GB) + SDK·NDK(약 2~4GB) + CMake 3.18+(SDK 관리자). 합계 약 4~6GB(일반 지식, 미확인). M1 여유 42GB.
- 다음 단계 제안(작가님 결정):
  - (가) 작은아들 폰에 BadukAI를 설치해 내장 10b 망 속도를 본다(빌드 0, 가장 빠른 실측).
  - (나) M1에 Android 도구를 설치해 직접 빌드한다(승인 게이트).
  - (다) web-katrain을 b10으로 띄워 폰 브라우저로 잰다(설치 0, 우리 서버나 정적 호스팅 필요).

## 4. 최저 지원 사양 (iOS) — ⏳ 14 Pro·13 실측 뒤 확정

## 출처 (안드로이드)
- https://github.com/lightvector/KataGo/issues/321
- https://github.com/lightvector/KataGo/blob/master/Compiling.md
- https://aki65.github.io/ · https://lifein19x19.com/viewtopic.php?p=259906 · p=271725 · p=279023
- https://github.com/Sir-Teo/web-katrain
- https://developer.chrome.com/blog/new-in-webgpu-121
- https://github.com/kaya-go/kaya
- 수집: 서브에이전트 reader(판정 없음). 환산·판정은 막내3이 했다.
