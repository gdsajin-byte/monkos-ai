# vision-matte — 애플 비전 매팅 서버

4060 `monkos_AI/matte-server`(BiRefNet)와 **같은 HTTP 계약**을 애플 비전 `VNGeneratePersonSegmentationRequest(.accurate)`로 서빙한다. 목적은 포털 코드 변경 0 — `MATTE_API_URLS` 체인에 URL 하나를 끼우는 것으로 끝나게.

- 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트.md`
- 지시서(1단계): `monkos-ops/ops/orders/2026-10/ORDER_20261022_iMac쌍아_막내_INFRA_애플비전_매팅서버_1단계.md`
- 엔진 원형: `apps/crop-app/benchmark/poc-20260707/apple-vision-poc.swift`
- 외부 의존성 0 (Foundation·Network·Vision·CoreImage·ImageIO). 단일 파일 `Sources/VisionMatte/main.swift`.

## 계약 (정본: `matte-server/server.py`)

| 요청 | 응답 |
|------|------|
| `GET /health` (인증 제외) | 200 `{status:"ok", engine, arch, inflight, max_concurrent, recent_matte_ms, rejected_503_total, …}` |
| `POST /matte` · `/api/matte` `{image: base64, bgColor:"#RRGGBB"}` | 200 `{success:true, image: base64 JPEG q95, meta:{elapsedSec}}` |
| `X-Matte-Secret` 불일치 | 403 `{error:"Forbidden"}` — `MATTE_SECRET` 미설정 시 검사 생략 |
| 동시 처리 상한 초과 | 즉시 503 `{success:false, error, maxConcurrent}` + `Retry-After: 1` (대기열 없음) |
| 디코드 불가 이미지·잘못된 base64 | 400 `{detail:"Invalid base64 image"}` |
| `image` 누락 | 422 |

- `bgColor`가 6자리 헥스가 아니면 흰색 (server.py `hex_to_rgb`와 같음). EXIF 회전 미적용 (PIL `Image.open`과 같음).
- 4060과 다른 점: `/health`에 GPU 점유 필드(`foreign_*`·VRAM)가 없다 — 포털 `lib/matte.js`는 `/health`의 `res.ok`만 본다(10-22 확인).

## 환경변수

| 이름 | 기본 | 비고 |
|------|------|------|
| `PORT` | 8000 | |
| `MATTE_HOST` | 127.0.0.1 | 루프백만. 외부 노출은 cloudflared 터널이 맡는다 |
| `MATTE_SECRET` | (없음) | 4060과 같은 SM 값을 쓸지는 2단계 결정 |
| `MATTE_MAX_CONCURRENT` / `MAX_CONCURRENT` | 2 | 앞쪽 우선. 4060은 `MATTE_MAX_CONCURRENT` 기본 1 |

## 빌드

```bash
./build.sh                 # 현재 머신 아키텍처 → .build/out/vision-matte
ARCH=arm64 ./build.sh      # iMac(Intel)에서 M1용 arm64 교차 빌드
```

- 1순위 `swift build -c release`, 실패 시 `swiftc` 직접 컴파일로 폴백하고 그 사실을 출력한다.
- ⚠️ iMac(CommandLineTools 전용, Swift 5.8.1)은 SwiftPM이 `xcrun --show-sdk-platform-path` 조회에서 실패한다(10-22 실측). CLT 갱신은 전역 설치라 손대지 않았다 — 폴백 경로로 빌드된다.
- 최소 macOS 12 (Person Segmentation API 요구).

## 실행 · 계약 테스트

```bash
MATTE_SECRET=<테스트값> ./.build/out/vision-matte          # :8000
./contract_test.sh http://127.0.0.1:8000 <이미지> --secret <테스트값> --bench 5 --save out/result.jpg
```

`contract_test.sh`는 대상 URL만 바꾸면 4060에도 같은 요청을 보낸다. 판정 항목: /health 200 · /api/matte·/matte 200 형식+JPEG 디코드 · 잘못된 시크릿/헤더 없음 403 · /health 인증 제외 · 잘못된 base64 400 · 동시 `max_concurrent+1` → 503(Retry-After: 1) · 벤치 p50/p90. FAIL 1건 이상이면 exit 1. `--secret`을 안 주면 403 검사는 SKIP으로 명시 출력.

결과 이미지는 `out/`에 두고 커밋하지 않는다(`.gitignore`). 고객 사진으로 테스트하지 않는다.

## M1 배치 (2단계 — 승인 후)

1. iMac에서 `ARCH=arm64 ./build.sh` → `.build/out/vision-matte` (Mach-O arm64) 를 M1로 복사. 또는 M1에서 직접 `./build.sh`.
2. M1: macOS 12 이상 확인 · 잠자기 해제 · `MATTE_SECRET` 주입 후 실행(상주는 launchd plist — 2단계에서 작성).
3. `curl localhost:8000/health` → `./contract_test.sh http://127.0.0.1:8000 <샘플> --secret … --bench 5`.
4. 터널(`matte-m1.monkos.ai`)·포털 dev `MATTE_API_URLS` 교체는 설계서 §4의 작가님 승인 사안.
