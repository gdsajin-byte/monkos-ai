# go_android_bench — MONKOS Go 안드로이드 온디바이스 벤치 (KataGo Eigen CPU + Game Loop 래퍼)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내2_GO_안드로이드빌드_GameLoop.md` · PF_GO
> 결과: `monkos-ops/ops/reports/2026-11/COMPLETION_20261106_iMac쌍아-막내2_GO_안드로이드빌드_GameLoop.md`
> 이 폴더에는 재현 스크립트와 앱 소스만 둔다. 툴체인·빌드물·APK·모델은 레포 밖 `~/.monkos/go_android/`에 있다.

## 순서 (iMac Intel, 처음 1회 약 10분 + 다운로드)
```bash
bash AI_Factory/go_android_bench/setup_toolchain.sh        # JDK 17·SDK·NDK 26.3·CMake → ~/.monkos/go_android/toolchain (홈 아래만)
bash AI_Factory/go_android_bench/build_katago.sh arm64-v8a # KataGo 1.18.2 Eigen → out/arm64-v8a/libkatago.so (x86_64도 같은 방법)
python3 AI_Factory/go_android_bench/prep_assets.py [모델]   # 모델·gtp.cfg·벤치 수순·라이선스 고지 → assets/
bash AI_Factory/go_android_bench/build_apk.sh              # 디버그 APK → apk/monk-go-bench-debug.apk
AI_Factory/device_lab/ftl.sh run android --models MediumPhone.arm:34 --apk ~/.monkos/go_android/apk/monk-go-bench-debug.apk --timeout 3m
AI_Factory/device_lab/ftl.sh fetch-android ftl/<결과디렉터리>
python3 AI_Factory/go_android_bench/parse_result.py ~/.monkos/device_lab/results/<결과디렉터리>
```

## 설계
| 항목 | 방식 |
|---|---|
| 실행 파일 | KataGo를 NDK로 PIE 실행 파일로 빌드(c++ 정적). `libkatago.so` 이름으로 `jniLibs/<ABI>`에 넣고 `extractNativeLibs=true`(useLegacyPackaging)로 설치 → `nativeLibraryDir`에서 exec. Android 10 이상은 쓰기 가능 경로의 실행을 막기 때문이다 |
| 의존 | libz·libm·libdl·libc만(안드로이드 기본 탑재). sha2.cpp의 BYTE_ORDER는 `-include endian.h`로 해결(KataGo 소스 무수정) |
| 앱 | Kotlin, 화면 1개. Game Loop 인텐트(`com.google.intent.action.TEST_LOOP`, mime `application/javascript`)로 시작하면 자동 실행, logFile에 JSON을 쓴 뒤 종료. 손으로 열면 `벤치 실행` 버튼 |
| 벤치 | iOS 벤치와 같은 표본 대국: 빈 판·100수·200수 × (1500 visits, 2초 자동 = maxTime 2). `kata-genmove_analyze … rootInfo true`의 rootInfo visits와 벽시계 시간 |
| 스레드 | `availableProcessors()` → numSearchThreads·numEigenThreadsPerModel·nnMaxBatchSize |
| 캡처 | 시작·1500v 직후·종료 3장. 앱 화면을 비트맵으로 그려 외부 앱 폴더 PNG(FTL `--directories-to-pull`로 회수) + 로그 안 축소 JPEG(base64, 회수 실패 대비) |
| 애셋 | 모델은 `model_bin_gz.dat`로 넣는다. aapt가 `.gz` 애셋 이름을 바꿔 넣기 때문이다(11-06 실측 `assets/model.bin`). 기기에서 `model.bin.gz`로 복사해 쓴다 |
| 라이선스 | `assets/licenses/` — KataGo MIT·Eigen MPL2 원문 + NOTICE |
| 서명 | 디버그 키만. 키스토어는 `ANDROID_USER_HOME=~/.monkos/go_android/android-user` |

## FTL 한도 (device_lab/ftl.sh `run android`)
- 가상(form=VIRTUAL): 원장 `virtual_minutes`, 가드 **50분/일**(무료 60분).
- 실기기: 원장 `minutes`, 가드 **25분/일**(무료 30분, iOS와 공유).
- 한 번에 한 종류만 실행한다(섞으면 거부).
- 실기기 후보(11-06 목록 실측): Galaxy A05s `a05s:35` · A15 `a15:34` · S24 `e1q:34`(스냅드래곤) / `e1s:36`(엑시노스).
