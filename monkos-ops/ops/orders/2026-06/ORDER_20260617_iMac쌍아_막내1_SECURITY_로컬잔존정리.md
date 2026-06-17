---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내1
portfolio: PF_SECURITY
status: 대기
---

# 지시서 — 시크릿 로컬 잔존 정리 (P2+P3)

> **[2026-06-17 12:38 KST] iMac/쌍아 → iMac/막내1**
> 민아 시크릿 전수 감사(REPORT_20260617) 기반. git 히스토리는 깨끗, 로컬 디스크 잔존만 정리.

## 배경

민아 감사 결과, git에 시크릿 유출은 없으나 로컬 디스크에 평문 시크릿·구 키·불필요 백업이 잔존. 정리 대상 확정.

## Task 1 — 로컬 잔존 파일 삭제 (P2)

**대상 3파일** (git 미추적, 로컬만 존재):

| 파일 | 내용 | 조치 |
|------|------|------|
| `apps/monk-cam/demo/key_old.pem` | 구 self-signed 개발 private key (2/8) | 삭제 |
| `apps/monk-cam/demo/cert_old.pem` | 구 self-signed 개발 cert (2/8) | 삭제 |
| `monkos_AI/portal/lib/cms/render.js.bak` | 렌더 백업 | 삭제 |

```bash
rm apps/monk-cam/demo/key_old.pem apps/monk-cam/demo/cert_old.pem monkos_AI/portal/lib/cms/render.js.bak
```

## Task 2 — 토스 test_sk 3중 복제 정리 (P3)

토스 테스트 시크릿 키(`test_sk_Z1a…[마스킹]`)가 3파일에 중복:

| 파일 | 조치 |
|------|------|
| `monkos_AI/.env` | **유지** — 로컬 개발 기본값. 운영은 GCP SM 경유 |
| `monkos_AI/.env.tmp` | **삭제** — 불필요 임시본 |
| `monkos_AI/.env.bak-20260603` | **삭제** — 불필요 백업본 |

```bash
rm monkos_AI/.env.tmp monkos_AI/.env.bak-20260603
```

## Task 3 — P1 photo-coach cert/key 종결 확인

`apps/photo-coach/cert.pem`·`key.pem`이 과거 커밋(`685a2092`)에 존재하나, 내용은 **심볼릭 링크 경로 1줄** (`/Users/.../monk-cam/demo/cert.pem`)이지 실제 키가 아님(쌍아 실측 확인). 현재 트리에서는 삭제 완료(`9712bc5f`).

- `git show 685a2092:apps/photo-coach/cert.pem` → 경로 문자열 1줄인지 재확인
- 재확인 후 "P1 종결: self-signed 개발키 참조, 실키 아님" 보고

## Task 4 — SECRET_INVENTORY 정합성 확인 (P4)

`monkos-ops/ops/SECRET_INVENTORY.md`를 읽고:
1. CF Pages 환경변수가 "24종"에 포함되어 있는지 확인
2. `GEMINI_API_KEY`와 `CF_API_TOKEN`이 두 위치에서 등록된 경우, 별개 앱/계정용인지 동일 키 이중등록인지 확인
3. 불일치 있으면 보고 (수정은 하지 말 것 — 작가님 확인 후)

## ⚠️ 준수 조항

- `rm` 실행은 본 지시서에 명시된 5파일에 한정. 그 외 파일 삭제 금지 (헌법 4조 2항)
- `.env` 본체는 삭제하지 않음
- SECRET_INVENTORY 수정 금지 — 확인·보고만

## 완료 기준

- [ ] 로컬 잔존 3파일 삭제 확인
- [ ] .env.tmp, .env.bak-20260603 삭제 확인
- [ ] SECRET_INVENTORY 정합성 보고
