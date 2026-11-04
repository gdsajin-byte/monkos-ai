# go_ios_bench — MONK 봇 아이폰 온디바이스 실측 (PF_GO ⑥-1)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내3_GO_아이폰실측_MONK봇.md`
> 결과: `monkos-ops/ops/reports/2026-11/COMPLETION_20261105_iMac쌍아-막내3_GO_아이폰실측.md`
> 이 폴더는 재현 스크립트만 둔다. 포크·빌드물은 M1 `~/developer/_ext/katago-ios/`(레포 밖), 측정 로그는 iMac `~/.monkos/go-board/analysis/iphone_v0/`.

## 구성
- 포크: ChinChangYang/KataGo `metal-coreml-stable`(7743301) → `ios/KataGo iOS/KataGo iOS.xcodeproj`
- 백엔드: **Metal(MPSGraph)** — `coremlDeviceToUse = 0`(gpuIdx<100). `.bin.gz`를 그대로 읽는다. CoreML(ANE, ≥100)은 mlpackage 변환(coremltools 설치)이 필요해 쓰지 않았다.
- 번들 ID `ai.monkos.go.bench`(+`.swift`·`.katago`), 팀 ZPMVHPDUHW(자동 서명).

## 파일 (M1 `~/developer/_ext/katago-ios/`에 `monk_*` 이름으로 복사해 실행)
| 파일 | 역할 |
|---|---|
| `prep.py b10\|b18` | 팀·번들 ID 교체, KataGoHelper.mm 패치(Documents로 chdir·`bench_cmds.txt` 1회 입력), 설정(Metal·maxVisits 1500·korean·logDir), 번들 모델 배치 |
| `addsrc.py` | 포크 iOS 프로젝트에 빠진 `sgfmetadata.cpp`·`evalcache.cpp`를 katago 타깃에 등록(링크 오류 수정) |
| `patch_model_override.py` | Documents/default_model.bin.gz가 있으면 번들 모델 대신 사용 → 모델 교체에 재빌드 불필요 |
| `build.sh` | xcodebuild(Release) + devicectl 설치. **ssh 세션에서는 키체인 잠김으로 서명 실패(errSecInternalComponent)** → M1 화면 터미널에서 실행 |
| `mkbench.py` | 표본 대국 1국 수순으로 GTP 벤치 명령 생성(빈 판·100수·200수 각 1회 + 100수 20회 연속) |
| `bench.sh TAG 대기초 [모델]` | 명령·모델을 앱 Documents에 복사 → 실행 → `gtp_logs` 회수. **측정 중 앱이 화면 앞에 있어야 한다**(백그라운드면 iOS가 정지) |
| `finish.sh` | 마지막 계산까지 기다린 뒤 기본 모델을 b10으로 되돌림 |
| `parse_bench.py TAG…` | 로그 → 국면별 시간·visits/s·연속 감속 |
