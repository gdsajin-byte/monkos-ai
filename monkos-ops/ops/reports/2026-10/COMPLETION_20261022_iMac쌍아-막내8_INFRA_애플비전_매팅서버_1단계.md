---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내8
status: 완료
portfolio: PF_INFRA
subject: "애플 비전 매팅 서버 1단계 — matte-server 계약 준수 Swift 서버 + iMac 로컬 계약 테스트 (ORDER_20261022 INFRA)"
---

# COMPLETION — 애플 비전 매팅 서버 1단계

**[2026-10-22 19:21 KST]** iMac/쌍아-막내8 → iMac/쌍아

> 지시서: [ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_1단계.md](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_1단계.md) (a942ddec)
> 투입 출처: 작가님 2026-10-22 19:16 iMac 쌍아 세션 사람 턴 "승인" → 쌍아 기동 턴으로 수신.

✅ **결론**: 판정 5/5 충족. 계약 테스트 8/8 PASS(시크릿 모드) + 5/5 PASS·403 SKIP 명시(시크릿 미설정 모드). iMac Intel 3MP 엔진 p50 0.206s / p90 0.242s. M1용 arm64 바이너리 교차 빌드 확인. 단 `swift build`(SwiftPM)는 iMac CLT 결함으로 실패 → `swiftc` 폴백으로 빌드(아래 판정 1).

## 산출물

`monkos_AI/vision-matte/` (신설, 외부 의존성 0)
- `Package.swift` · `Sources/VisionMatte/main.swift` — `Network` 프레임워크 기반 HTTP/1.1 최소 구현(Connection: close, Content-Length 본문, 본문 상한 64MB) + 엔진(PoC와 동일: PersonSegmentation `.accurate` + `CIBlendWithMask` → JPEG q95)
- `build.sh` — SwiftPM 1순위, 실패 시 swiftc 폴백(사유 출력), `ARCH=arm64` 교차 빌드
- `contract_test.sh` — 대상 URL만 바꾸면 4060에도 같은 요청. FAIL ≥1 → exit 1, 시크릿 미지정 시 403 검사 SKIP 명시
- `README.md` — 계약표·환경변수·빌드·M1 배치 절차 · `.gitignore`(`.build/`·`out/`·이미지)

## 판정

| # | 기준 | 판정 | 실측 |
|---|------|------|------|
| 1 | `swift build` 성공 (iMac Intel, macOS 버전) | ⚠️ **조건부** | iMac x86_64 · macOS 13.7.8 (22H730) · Swift 5.8.1(CLT 전용). `swift build -c release`는 `xcrun --sdk macosx --show-sdk-platform-path` → "unable to lookup item 'PlatformPath'"로 **실패**(코드 무관, SwiftPM↔CLT 결함 — SDKROOT 지정도 동일). CLT 갱신=전역 설치라 범위 밖. 의존성 0이라 `swiftc -O -target x86_64-apple-macos12.0`으로 **빌드 성공**(경고 0). `build.sh`가 폴백을 명시 출력 |
| 2 | 양성: /health 200 · /api/matte 200 `{success:true,image,meta.elapsedSec}` · JPEG 디코드 | ✅ | /health 200 status=ok · /api/matte·/matte 200, SOI `FFD8FF` + `sips` 디코드 1500×2000 |
| 3 | 음성: 잘못된 시크릿 403 · 잘못된 base64 400 · 동시 MAX+1 → 503 ≥1 | ✅ | 잘못된 시크릿 403 · 헤더 없음 403 · /health는 잘못된 시크릿에도 200(인증 제외) · 잘못된 base64 400 · 동시 3건(MAX=2) → 200×2 + 503×1, Retry-After:1 1/1 |
| 4 | iMac 3MP 5회 p50/p90 (참고값) | ✅ | 엔진 `elapsedSec` p50 **0.206s** / p90 **0.242s** (0.198·0.263·0.206·0.187·0.210) · 왕복 p50 0.265s / p90 0.306s. 첫 요청(콜드)은 0.532s |
| 5 | 결과 이미지 로컬 경로 (커밋 X) | ✅ | 아래 |

- 테스트 이미지: 레포 기존 자산 `apps/MonkosCrop/MonkosCrop/Resources/ID_Photosample.jpg`(989×1320, IDPASS 번들 샘플)를 `sips -z 2000 1500`으로 3MP 업스케일. 고객 데이터 미사용.
- 서버는 `127.0.0.1:8000`(루프백)만 바인드. 테스트 시크릿은 로컬 임시값(실 시크릿 미접촉). 테스트 후 프로세스 종료.

## 결과 이미지 (커밋 안 함 — worktree `out/`)

- 흰 배경(계약 기본): `.claude/worktrees/makne8-vision-matte/monkos_AI/vision-matte/out/result_3mp.jpg`
- 파란 배경 `#3366CC` (원본이 흰 배경이라 매팅이 보이도록): `…/out/result_3mp_blue.jpg` (축소본 `result_3mp_blue_small.jpg`)
- 관찰(판정 아님): 파란 배경본에서 머리·어깨 윤곽에 **옅은 흰 테두리**가 보인다 — 원본 흰 배경의 경계 번짐(마스크 소프트 엣지 × 원색 그대로 합성, 디컨태미네이션 없음). PoC·4060도 같은 단순 합성식이라 구조 차이는 아님. 2단계 작가님 육안 판정 항목으로 넘긴다.
- ⚠️ worktree가 정리되면 `out/`도 사라진다. 보존이 필요하면 다른 경로로 복사 요청 바람.

## M1 배치 시 필요한 것

- 바이너리: **Mach-O arm64** — iMac에서 `ARCH=arm64 ./build.sh`(swiftc 교차 빌드, 10-22 생성 확인) 또는 M1에서 직접 빌드. 크기 ~200KB 단일 파일.
- **macOS 최소 12** (Person Segmentation API, `-target …-macos12.0`).
- M1 잠자기 해제 · `MATTE_SECRET` 주입 방식(4060과 같은 SM 값 여부) · launchd 상주 plist · cloudflared 터널 — 전부 2단계/작가님 승인 사안(설계 §4).

## 계약 차이 (의도·기록)

- `/health`에 4060의 GPU 점유 필드(`foreign_*`·VRAM)가 없다. 포털 `lib/matte.js`는 `/health`의 `res.ok`만 소비(10-22 grep 확인) → 영향 없음.
- 동시성 상한: 4060은 `MATTE_MAX_CONCURRENT`(기본 1), 지시서는 `MAX_CONCURRENT`(기본 2). **둘 다 받음(앞쪽 우선), 기본 2.**
- 4060은 슬롯 확보 후 디코드(잘못된 base64도 슬롯 1회 점유) — 동일하게 구현.
- 4060의 507(VRAM 부족)은 해당 없음. 비전 실패는 500 `{success:false,error}`.

## 미해결

- ⏳ 판정 1의 "swift build" 문자 그대로 충족은 iMac CLT 갱신(전역 설치 = 승인 사안) 또는 M1(신규 툴체인)에서 재확인 필요.
- ⏳ 2단계: M1 가동·배치·터널·S/E/F 판정 (설계서 §3·§4).

## 브랜치·커밋

- 브랜치 `worktree-makne8-vision-matte` — 커밋 SHA·원격 대조는 세션 로그 마감 항목 참조.
