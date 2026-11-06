# device_lab — 실기기 대여 테스트 도구 (1단계: Firebase Test Lab)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_GO_실기기테스트_FirebaseTestLab도구.md` · PF_GO
> 2단계(AWS Device Farm)는 계정 생성 뒤. 데이터(기종 목록·원장·결과)는 레포 밖 `~/.monkos/device_lab/`.

## 사용

```bash
AI_Factory/device_lab/ftl.sh models ios          # → ~/.monkos/device_lab/catalog_ios_YYYYMMDD.csv (매번 실측)
AI_Factory/device_lab/ftl.sh models android      # 실기기만(form=PHYSICAL)
AI_Factory/device_lab/ftl.sh usage               # 오늘(KST) 쓴 실기기 분
AI_Factory/device_lab/ftl.sh run ios --models iphonese3,iphone8,iphone11pro --ipa MONKBench.ipa [--timeout 3m] [--dry-run]
AI_Factory/device_lab/ftl.sh fetch ftl/YYYYMMDD_HHMMSS   # 결과 버킷 GameLoopResults/* → ~/.monkos/device_lab/results/…
AI_Factory/device_lab/smoke_ftl.sh               # 가드 스모크(시험 원장만, gcloud 실행 없음)
AI_Factory/device_lab/smoke_ftl_android.sh       # 안드로이드 가드 스모크(막내2) — 시험 원장 + 가짜 gcloud(PATH), FTL 실호출 0·실제 원장 불변을 끝에 검증
AI_Factory/device_lab/ftl.sh run android --models MediumPhone.arm:34 --apk APK [--timeout 3m] [--dry-run]   # 가상/실기기 따로 가드(가상 50·실기기 25분)
AI_Factory/device_lab/ftl.sh fetch-android ftl/YYYYMMDD_HHMMSS_android
```

- 프로젝트 `monkos-3c6e4`(Blaze) 고정. 기종 버전 지정은 `model:version`(예: `iphonese3:18.4`).
- **무료 한도 가드**: 오늘 누적 + (기종 수 × 기종당 분) > **25분**이면 실행 거부 — `❌ ftl: 무료 한도 초과 예상 — 오늘 N분 + 예상 M분 > 25분 (유료 0)`. 우회 플래그 없음. 상수 `LIMIT_MIN` 변경 = 작가님 승인.
- 기종당 `--timeout` 상한 3분. 원장은 실행 직전에 **상한 분으로 기록**(실과금 ≤ 기록, 보수적).
- 실행 전 1회: `toolresults.googleapis.com` 활성 필요(지시서 범위 — 첫 실행 때).
- iOS 앱은 Game Loop 진입 패치가 들어간 IPA여야 한다 — `AI_Factory/go_ios_bench/patch_gameloop.py` + `build_ipa.sh`(M1 화면 터미널).
- 실패 가시화: 모든 오류 `❌ ftl:` + exit≠0.
