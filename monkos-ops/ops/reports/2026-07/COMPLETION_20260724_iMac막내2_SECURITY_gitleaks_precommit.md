---
type: completion
date: 2026-07-24
device: iMac
agent: 막내2
status: 완료
portfolio: PF_SECURITY
---

# COMPLETION — gitleaks pre-commit 훅 설치

**[2026-07-24 12:19 KST]** iMac/막내2 → 작가님

> 지시서: `ORDER_20260724_iMac쌍아_막내_SECURITY_gitleaks_precommit.md`

## 결과

✅ gitleaks 8.30.1 설치 (`brew install gitleaks`)
✅ `scripts/tools/gitleaks-precommit.sh` 작성 — `gitleaks protect --staged --no-banner`
✅ `.git/hooks/pre-commit` 신규 생성 (기존 훅 없음 — 체이닝 불요)
✅ `.gitleaksignore` 베이스라인 — 오탐 70건 fingerprint 등재
✅ 스모크 테스트 통과 — 더미 시크릿 차단 ✓ / 클린 파일 통과 ✓
✅ `references.md` 도구 맵 등재 (3요건: 인지 ✓, 스모크 ✓, 실패 가시화 ✓)

## ⚠️ 실키 히스토리 발견 보고

전체 히스토리 스캔(3133 commits) 결과 **5종 실키** git history에 존재 (지시서 준수 — 조치 미실행):

| # | 유형 | 시크릿 (마스킹) | 소재 | 비고 |
|---|------|----------------|------|------|
| 1 | HuggingFace 토큰 | `hf_ARMs...` | `apps/crop-app/benchmark/_start_server.bat` | 1건 |
| 2 | LINE Channel Secret | `024cf2...` | `ORDER_20260313_LINE봇` | 지시서 본문 |
| 3 | LINE Access Token | `47NVuu...` | `ORDER_20260313_LINE봇` | 지시서 본문 |
| 4 | Toss test SECRET key | `test_sk_...` | `functions/api/payment.js` 외 2곳 | sk = secret key |
| 5 | Telegram bot token | `841008...` | `monk_master_context.txt` × 3복사본 | 18건 (동일 토큰) |

\+ 미식별 2건 (2월 세션 로그 내 키 패턴)

→ `.gitleaksignore`에 **미등재** (실키는 무시 대상 아님)
→ 후속 조치(로테이션/BFG clean 등)는 작가님·쌍아 판단 대기

## 변경 파일

📁 `scripts/tools/gitleaks-precommit.sh` (신규)
📁 `.git/hooks/pre-commit` (신규, git 미추적)
📁 `.gitleaksignore` (신규)
📁 `.claude/rules/references.md` (도구 맵 1행 추가)

## 타 디바이스 이관 정보

- M1, M2, 4060: 각 디바이스에서 별도 `brew install gitleaks` (또는 바이너리) 필요
- `.gitleaksignore`는 git 추적 → 공유됨
- `.git/hooks/pre-commit`는 git 미추적 → 디바이스별 수동 설치 필요
