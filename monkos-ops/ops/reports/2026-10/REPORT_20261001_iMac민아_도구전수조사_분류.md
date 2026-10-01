---
type: report
date: 2026-10-01
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "도구 전수조사 143건 — 등재·업데이트·레거시·중복 분류와 처분안"
method: "general-purpose 위임(읽기 전용 실측: git log·참조 grep·도구 맵 대조·launchd·gh run) + 민아 판정 보정(슬래시 스킬·CI 트리거·이중 소스 diff). 원자료 monkos-ops/ops/audit/TOOL_CENSUS_20261001.csv (143행)"
---

# 도구 전수조사 — 등재 40 vs 실물 143

**[2026-10-01 09:32 KST]** iMac/민아 → 작가님 · 쌍아

## 0. 결론 (1줄)

실물 143건 중 **정상 56 · 등재 필요 20 · 레거시 21 · 중복 9쌍 · 업데이트 2 · 비대상(스킬) 23 · 보류 5**. 삭제 없이 "이동+표기"로 처리하면 하루 작업이고, 결정이 필요한 건 이중 소스 2쌍의 정본 확정뿐이다.

## 1. 결정 항목 (닫힌 대안)

| # | 항목 | A (권고) | B |
|---|------|------|------|
| T1 | **deploy.sh 이중 소스 정본 확정** (08-13부터 미결) | `monkos_AI/` 측을 정본으로 확정, `apps/monk_imagen4/backend`·`apps/idphoto-jp-v079`는 `apps/_legacy/`로 이동 + README 리다이렉트. 근거: JP는 09-29 촬영게이트 배포가 `monkos_AI/idphoto-jp`에서 나갔고(00130-njn) apps 측은 09-01 이후 정지(46파일 차이). image-pro 쌍은 09-01 동일 커밋 이후 12파일 차이(package·deploy.sh) | 양쪽 유지 + 배포 전 경고(현행) — 사고 재발 여지 |
| T2 | **레거시 21건 처분 방식** | **이동**: `scripts/_legacy/`·`monkos-ops/scripts/_legacy/`로 git mv + 각 폴더 README에 사유·대체물 1줄. 삭제 금지(쌓기 구조·데이터공학 원칙) | 그대로 두고 CSV 표기만 |
| T3 | **도구 맵 범위 규칙** | 스킬(commands·skills 23)은 도구 맵 비대상으로 명문화 — 스킬은 `.claude/commands/` 자체가 인덱스. 도구 맵 = 실행 파일·서버·CI·launchd만 | 스킬도 전건 등재(중복 인덱스) |
| T4 | **등재 20건 일괄 등재 시 스모크 요건** | 가동 실측 있는 것(launchd PID·CI 최근 success·MCP 연결)은 그 실측을 스모크로 인정하고 즉시 등재. 실측 없는 5건(mk-pull·sync-dev-test·kimi·blog-publish·soul_sync)은 "등재(스모크 미실증)" 표기 후 막내 1회 실행 | 20건 전부 막내 스모크 후 등재 |

## 2. 층별 모집단 (실측 143)

CLI 36 · 인프라 17 · MCP 14(서버 6+래퍼 5+retrieval 3) · 수집기 7 · 훅 9 · launchd 6(설치 4+레포 2) · 스킬 23 · 에이전트 1 · CI 10 · deploy 12 · 빌드 8. 제외: 워크트리 사본 deploy.sh 12, README·requirements, `.github/scripts/*.py`(CI 내부 — 다음 조사 대상).

## 3. 분류 (기계 판정 → 민아 보정)

### 3.1 정상 56 — 조치 없음

### 3.2 등재 필요 20 (도구 맵 미등재인데 가동 중)
| 묶음 | 건 | 가동 근거 | 조치 |
|------|----|------|------|
| MCP 서버 6 + 래퍼 5 + retrieval build_index | 12 | `.mcp.json` 연결, 본 세션 monk_stats health ok | **10-01 등재 완료**(references.md 1행) |
| mailbox_watcher.sh | 1 | launchd `com.monk.mailbox-watcher` PID 1437 가동 | 등재 |
| ads_upload.sh | 1 | launchd `com.monkos.ads-sync` 등록(exit 0) | 등재 |
| runpod_balance_check.sh + plist | 2 | 스크립트 실작동(09-30 실측 $23.46) · plist 경로 오기 **10-01 교정**(`/Users/developer/`→실경로) · iMac 미설치 | 등재 + 설치 결정(아침 목록) |
| daily-briefing.yml · e2e-briefing-notify.yml · notify.yml | 3 | 09-30 success · workflow_call 피호출 | 등재 |
| mk-pull.sh · sync-dev-test.sh · cdp_setup.sh · kimi.sh · blog-publish/ · soul_sync.sh(미추적) | 6 | 실측 없음 | T4 — cdp_setup은 cdp 행에 병기 완료, 나머지 5건 스모크 후 |

### 3.3 레거시 21 (07-01 이전 미수정 · 코드 참조 0 · 배선 없음)
| 위치 | 파일 | 최종 커밋 | 대체물·근거 |
|------|------|------|------|
| scripts/ | chrome-devtools.sh | 03-31 | cdp.sh |
| scripts/ | firestore_ttl_activate.sh | 03-08 | 1회성 |
| scripts/ | gcr_cleanup.sh · gcs_migrate.sh · migrate-gcs-paths.sh | 02-28 · 01-15 · 06-22 | 1회성 마이그레이션 |
| scripts/ | md_to_pdf.py | 01-17 | PDF MCP |
| scripts/ | pf_frontmatter_backfill.sh | 06-14 | 1회성 (pf.py가 후속) |
| scripts/tools/ | debate.sh | 05-11 | PF_MUSE POC |
| scripts/tools/ | img_clip.py · img_pick.py | 01-31 | IMAGE PRO |
| scripts/tools/ | specs-preview.sh | 06-19 | `/Users/kku` 하드코딩, SSG dist가 대체 |
| monkos-ops/scripts/ | n8n/ | 02-27 | **n8n 07-24 삭제** — 문서 언급 434건은 이력 |
| monkos-ops/scripts/ | command_watcher.js · queue_sync.js · night_operator.py · session_watcher.sh · session_append.sh · notify.ps1 · collect_saga.sh · command_bridge.js · command_bridge_simple.js | 02-22 | 2월 자동화 체계 → Routines·웹민아·훅이 대체 |
| monkos-ops/scripts/ | ads_sync.py | 03-06 | ads_upload.sh(launchd) |
| monkos-ops/scripts/ | cheolchang_watcher.sh + com.monkos.cheolchang-sync.plist | 02-23 | 설치본은 `scripts/철창이_watcher.sh` 호출 |
| CI | signups-report.yml | 05-17 | workflow_dispatch 전용·실행 기록 0, `credits.sh signups`가 대체 |

기계 판정 "레거시후보 33" 중 **12건은 오판으로 복원**: 슬래시 스킬 9(refs_code 0은 구조적), CI 3(blog-draft-publish·secret-scan 09-30 success, weekly-dashboard 09-27 schedule success).

### 3.4 중복 9쌍
| 쌍 | 판정 |
|----|------|
| image-pro/backend ↔ apps/monk_imagen4/backend (`monk-image-engine`) | **T1** |
| monkos_AI/idphoto-jp ↔ apps/idphoto-jp-v079 (`monkos-idphoto-jp`) | **T1** — apps 측 레거시 확실 |
| scripts/철창이_watcher.sh ↔ monkos-ops/scripts/cheolchang_watcher.sh (+plist 2) | 설치본 기준 scripts/ 정본, monkos-ops 측 레거시(3.3 포함) |
| ads-oauth.sh ↔ ads-oauth-manual.sh | 정상 쌍(자동/수동 폴백) — 유지 |
| command_bridge.js ↔ command_bridge_simple.js | 둘 다 레거시(3.3) |
| audit_secrets.sh(07-14) ↔ sa_audit.sh(07-24) + `secret.sh map` | sa_audit·map이 후속. **업데이트**: `skills/secret-audit.md`가 audit_secrets.sh를 지목 → sa_audit.sh·map으로 교정 |

### 3.5 업데이트 2
- `references.md` cdp.sh 행 인지 경로 `skills/`→`commands/` — **10-01 교정 완료**.
- `.claude/skills/secret-audit.md` → 지목 도구 교정 (쌍아 소관, 추인 시).

### 3.6 보류 5
설치본 plist 4(레포 외) · `portal/tools/t1-tuning`(스크립트 없음, 자산만).

## 4. 처분 실행 계획 (결정 후)
1. T2 이동 21건 + README 2개 — 막내 0.5일 (git mv라 이력 보존, 롤백 = 커밋 1).
2. T1 apps 2디렉터리 이동 + references.md 이중 소스 경고 삭제 + `deploy.sh` 게이트 5(이중 소스 경고) 해제 — 막내 0.5일, 쌍아 검토.
3. T4 등재 20건 references.md 반영 + 5건 스모크 — 막내 0.5일.
4. 다음 조사 대상: `.github/scripts/*.py`(CI 내부 파이썬), 서비스 `tools/` 하위 개별 스크립트.

## 5. 부수 발견
- `com.monkos.runpod-balance.plist` ProgramArguments가 존재하지 않는 경로(`/Users/developer/…`)였다 — iMac에 설치됐더라도 돌지 않았을 것. 경로 교정 완료, 설치는 결정 대기.
- `soul_sync.sh`는 .gitignore로 미추적 — 의도 여부 쌍아 확인.
- 도구 맵 등재 판정은 텍스트 매칭이라 governance-check.yml·훅 6종은 타 행 본문 언급으로 "등재"로 잡혔다. 전용 행이 있는 것과 언급만 된 것을 구분하는 열이 다음 조사에 필요하다.
