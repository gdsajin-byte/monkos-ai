---
type: completion
date: 2026-09-15
device: iMac
agent: 민아
portfolio: PF_MARKET_EYE
status: 마감
subject: "MARKET_EYE 도구 3건 직접 실행 — Ads API v22 정본화·수집기 실패 가시화·DataLab 창 교정"
---

**[2026-09-15 16:56 KST]** iMac/민아 → 작가님 (쌍아 사후 추인 대상 — ch1 2조 5항 [예외])

# 완료 보고

## 지시
작가님 09-15 직접 지시 "직접 실행하고 기록해" — 09-15 마켓아이 동향 조회에서 적발한 도구 결함 3건.

## 결과
✅ **Google Ads API 버전 정본화** — `scripts/ads_api_version`(v22) 신설. `ads.sh`·`collect_keywords.js` 이중 하드코딩 제거, 둘 다 정본 파일 읽음(환경변수 재정의 가능). 근거: v21 폐기로 09-01 월배치 8개국 전부 404.
✅ **수집기 실패 가시화** — Google Planner 0행이면 🔴 텔레그램 + exit 1(스텝 실패). 일부 국가 실패는 ⚠️ 알림. `--dry-run` 플래그 신설(적재 없이 스모크).
✅ **DataLab 창 교정** — `seo_collectors.py fetch_naver_datalab`: 30일·주 단위(부분 주 vs 전체 주, ↓87% 오표시) → 어제까지 완결 14일·일 단위, 최근 7일 합 vs 직전 7일 합. 응답에 `window` 필드 명시.
✅ **9월 결측 되메우기** (선행, 16:5x) — ads_keyword_monthly 2026-09-01 9,102행·8 geo 적재(7·8월 9,098행과 정합). 네이버는 기적재라 제외.
✅ **references.md** — "Google Ads API 버전" 절 신설(정본 위치·실패 동작·dry-run).

## 스모크 (도구 3요건)
| 대상 | 방법 | 결과 |
|---|---|---|
| ads.sh | `keywords 증명사진 1004 2410` (정본 파일 경유) | 18,100 반환 |
| 수집기 정상 | `--dry-run` (v22) | Planner 9,102행, 미삽입, exit 0 |
| 수집기 실패 | `ADS_API_VERSION=v21 --dry-run` | 404 ×8, **exit 1** (🔴 경로 진입, 로컬은 텔레그램 env 없어 발신 생략 로그) |
| DataLab | `naver-datalab 증명사진,AI증명사진,관상,여권사진` | 7d vs 7d: 증명사진 −14%·여권사진 −14%·관상 −2%·AI증명사진 −14% (실신호) |

## 변경 파일
- `scripts/ads_api_version` (신설)
- `scripts/ads.sh`
- `scripts/collectors/collect_keywords.js`
- `scripts/tools/seo_collectors.py`
- `.claude/rules/references.md` (규정 계층 — 작가님 직접 지시 하 민아 실행, 쌍아 추인 시 확인)

## 미조치·확인 필요
- `collect_trends.js` DataLab 월 단위 마지막 기간이 부분월인지 — BQ 적재값(09-01 여권사진 45 / 08-01 39)이 부분월 패턴이 아니라 **증거 부족으로 미수정**. 다음 월배치(10-01) 로그의 period 값으로 판정.
- 워크플로 실배포 검증은 10-01 월배치 런에서 (수동 dispatch는 일배치 중복 삽입 위험이라 미실행).
