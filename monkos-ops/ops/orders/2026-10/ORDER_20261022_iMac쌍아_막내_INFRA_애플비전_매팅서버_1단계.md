---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 애플 비전 매팅 서버 1단계 — matte-server 계약 준수 Swift HTTP 서버 + iMac 로컬 계약 테스트
status: 발행
portfolio: PF_INFRA
---

# ORDER — 애플 비전 매팅 서버 (1단계, iMac 로컬)

> 출처: 작가님 2026-10-22 19:13 (민아 세션) "m1으로 테스트해보고 결정하는게" → 쌍아 설계 140318b9 → 작가님 19:16 (쌍아 세션 사람 턴) "승인".
> 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트.md`.
> 0단계(품질 5장)는 생략: `apps/crop-app/benchmark/poc-20260707/README_POC_테스트기반.md` §1 — 07-07 민아 직접 대조 "BiRefNet ≈ 애플 비전, 재실험 불요". 최종 육안 판정은 2단계 M1 결과물로 작가님이 한다.

## 1. 목적

M1이 꺼져 있어도 지금 할 수 있는 몫 — 서버를 만들고 iMac에서 계약이 4060 `matte-server`와 같음을 증명한다. M1에는 바이너리만 옮기면 되게.

## 2. 산출물

`monkos_AI/vision-matte/` (신설)
- `Sources/…` Swift HTTP 서버(SwiftPM 패키지, **외부 의존성 0** — `Network` 프레임워크로 HTTP/1.1 최소 구현 또는 표준만. 외부 패키지 필요하면 중단·보고).
- 엔진: `apple-vision-poc.swift`와 동일 — `VNGeneratePersonSegmentationRequest(.accurate)` + `CIBlendWithMask`로 `bgColor` 단색 합성 → JPEG q95.
- 계약(정본 `monkos_AI/matte-server/server.py`): `GET /health`(인증 제외, `{status, …}`), `POST /matte`·`/api/matte` `{image, bgColor}` → `{success, image, meta.elapsedSec}`, `X-Matte-Secret` 불일치 403(환경변수 `MATTE_SECRET` 미설정 시 검사 생략 — 4060과 동일), 동시성 초과 즉시 503 `Retry-After: 1`(`MAX_CONCURRENT` 기본 2), 잘못된 base64 400.
- `README.md`(빌드·실행·M1 배치 절차) · `contract_test.sh`(같은 요청을 대상 URL에 보내 응답 키·상태 코드 검증 — 4060 계약 기준).

## 3. 범위

**허용**: 위 신설 · iMac에서 `swift build`·로컬 실행(:8000, localhost만) · 테스트 이미지는 **고객 데이터 금지** — 공개 샘플 또는 레포 기존 테스트 자산만, 결과 이미지는 커밋 금지(.gitignore).
**금지**: 터널·DNS·포털 env 변경 · M1 접속·배치(2단계) · 패키지 매니저로 전역 설치 · 기존 `matte-server` 수정.

## 4. 판정 기준

| # | 기준 |
|---|------|
| 1 | `swift build` 성공(iMac Intel, macOS 버전 기재) |
| 2 | contract_test 양성: /health 200 · /api/matte 200 `{success:true,image,meta.elapsedSec}` · 결과 JPEG 디코드 가능 |
| 3 | 음성: 잘못된 시크릿 403 · 잘못된 base64 400 · 동시 `MAX_CONCURRENT+1` 요청 → 1건 이상 503 |
| 4 | iMac 처리 시간 3MP 5회 p50/p90 기록(참고값 — 판정은 M1) |
| 5 | 결과 이미지 1장을 쌍아가 볼 수 있는 로컬 경로로 제시(커밋 X) |

## 5. 반환

COMPLETION(`reports/2026-10/`): 브랜치·커밋 SHA(원격 대조), 판정 5건, 결과 이미지 로컬 경로, M1 배치 시 필요한 것(바이너리 아키텍처·macOS 최소 버전), 미해결.
