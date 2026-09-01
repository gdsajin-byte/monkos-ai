---
type: completion
date: 2026-09-01
device: iMac
agent: 민아
status: 마감
---

# COMPLETION — 배포 가드레일 G1~G6 직접 실행

**[2026-09-01 10:58 KST]** iMac/민아 → 작가님

> 근거: 작가님 직접 지시 10:52 "직접처리하고 로그와 pf정리해" ([예외] — 쌍아 사후 추인 대상). 설계 정본: PROPOSAL_20260901_민아_specs빌드가드레일.md (G1~G6)

## 구현 내역
| 가드 | 내용 | 대상 |
|---|---|---|
| G1 | `scripts/tools/specs_drift.sh` — specs 소스↔엣지 배포 해시 대조, 무음 구본 경보. `--record`(deploy.sh 자동 호출)·`--hook`(pre-push 경고 전용·푸시 비차단)·`--install-hook` | 신규 + `.specs-deploy-hash` 정본 커밋 |
| G2 | 콘텐츠 어서션 스모크 — `edge/smoke_assert.txt`(URL⇥±문구) 존재 시 2회 히트 규칙로 자동 판정, 실패 시 배포 실패 처리 | edge/deploy.sh 내장 |
| G4 | 미커밋 게이트 — 서비스 디렉토리 한정 dirty 감지→경고+승인(비TTY 기본 중단, --yes 시 경고 후 진행) | 활성 9본 이식 |
| G5 | `set -e` → `set -eo pipefail` 승급 (-u는 기존 스크립트 변수 관행상 파손 위험으로 보류) | 8본 |
| G6 | 이중 소스 경고+승인 (monk-image-engine·monkos-idphoto-jp 각 2디렉토리) / 좀비 가드 (crop-engine·monkos-matte `--force-zombie` 없인 차단) | 4본+2본 |

## 검증
- 구문: 12/12 `bash -n` 통과
- 스모크 5/5: drift 기록·정합 판정 / 드리프트 시뮬 경보(exit 1) / pre-push 훅 설치 / **G4 실차단**(portal 비TTY에서 dirty 감지→중단 실측) / **좀비 실차단**(crop-engine exit 1)
- G6는 G4와 동일 게이트 패턴(구문 검증) — 실차단 검증은 해당 서비스 차기 배포 시 자연 실측

## 인지 체계 (도구 3요건)
- references.md 도구 맵 2행 등재 + live-verify.md 자동화 각주 + PF_INFRA 본기재·PF_SPECS 교차 1행

## 잔여
- 이중 소스 Cloud Run 라벨 자동화(경고→기계 검증 승격) — 막내 후속 후보
- ch5 배포 게이트 표준 조항화 — 법개정 청구 (별도 보고)
- 타 디바이스(M1 등)는 `specs_drift.sh --install-hook` 1회 실행 필요 (훅은 로컬)
