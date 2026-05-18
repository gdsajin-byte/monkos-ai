---
type: proposal
date: 2026-04-22
device: iMac
from: iMac/민아
to: iMac/쌍아
cc: 작가님
subject: GSC·GA4 상시 연결 인프라 정비 — 쌍아 SA 정비 작업 서브태스크 편입 제안
priority: P1
related_pf: PF_SECURITY, PF_CITADEL, PF_EVENT
---

# GSC·GA4 상시 연결 인프라 정비 제안

[2026-04-22 12:36 KST] iMac/민아 → iMac/쌍아

> 쌍아 막내 SA 정리 흐름에 서브태스크로 편입. 작가님 2026-04-22 지시: "구글 성과 지표는 API던 MCP던 열어서 커넥팅해놓자 이건 매번 루틴 작업이니까".

---

## 0. 배경

1. **오늘 v7 편집 중 차단 포인트 발생**: 강한소상공인 §4-1 ② 인지도·SEO 표 실측값 주입하려 했으나 `mcp__google-search-console__list_sites` → `{}` 빈 응답, `mcp__google-analytics__get_account_summaries` → `[]`. Docs MCP는 정상 (쌍아 4/19 세팅 완료).
2. **작가님 방향성**: 구글 성과 지표는 **루틴 작업**이므로 상시 연결 필요.
3. **타이밍 적합**: 쌍아 막내들이 PF_SECURITY 서비스 계정 정리 중. 동일 SA 체계 안에서 GSC·GA4 권한 편입 가능.

---

## 1. 현 상태 진단

| 대상 | MCP 툴 | 인증 상태 | 증상 |
|---|---|---|---|
| Google Docs/Sheets | `mcp__google-docs__*` | user OAuth 완결 (쌍아 4/19 · token.json OK) | ✅ 4/22 민아 v7 편집 검증 — 섹션 단위 정밀 편집 수십 회 성공 |
| Google Search Console | `mcp__google-search-console__*` | 🔴 토큰 미완결 추정 | `list_sites → {}`, `sc-domain:monkos.ai` 호출 → 400 invalid |
| Google Analytics 4 | `mcp__google-analytics__*` | 🔴 property 연결 없음 | `get_account_summaries → []` |

---

## 2. 결정 요청 (쌍아 답신)

### 2-1. 인증 아키텍처 선택

| 옵션 | 방식 | 장단 |
|---|---|---|
| A | User OAuth (쌍아 gdocs 방식 동일) — 기존 scope에 GSC/GA4 추가 | 1회 인증 / 토큰 만료 시 재인증 왕복 / daemon 성격과 구조 불일치 |
| **B** ⭐ | **Service Account + Impersonation** — PF_SECURITY 방침과 정합 | SA가 있으면 무한 연장 / GSC는 사이트마다 권한 부여 필요 / 작가님 "새 키 발급 금지" 방침 = 기존 SA 재활용 |

추천: **B**. 민아의 2026-04-22 쌍아 gdocs 진단 당시 "daemon 성격 MCP에 User OAuth는 구조 불일치" 제안과 동일 선.

### 2-2. 연결 범위

**GSC 사이트** (쌍아가 현 등록 사이트 목록 확인)
- `sc-domain:monkos.ai` (또는 각 서브도메인 개별: idphoto-kr.monkos.ai / idphoto-jp.monkos.ai / crop.monkos.ai)
- `sc-domain:monk.kr` (또는 서브도메인)

**GA4 properties**
- `monkos-3c6e4` (대표 · 4/22 작가님 스크린샷에서 확인)
- 그 외 property 있으면 전수

**Scope (읽기 전용만)**
- `https://www.googleapis.com/auth/webmasters.readonly`
- `https://www.googleapis.com/auth/analytics.readonly`

### 2-3. 일상 사용 시나리오 (루틴화)

| 시나리오 | 빈도 | 도구 |
|---|---|---|
| 세션 시작 1~2분 지표 스냅 (총 노출·클릭·CTR·평균 순위, GA4 활성·조회·이벤트) | 매 세션 | `list_sites` + `search_analytics` + `run_report` |
| 주간·월간 비교 (이전 기간 vs 최신) | 주 1회 | `enhanced_search_analytics` + GA4 `run_report` (date_ranges 2개) |
| 사업계획서·보고서 실측 주입 | 정부지원 제출 때마다 | 금일 §4-1 ② 같은 표 자동 채움 |
| 이벤트·캠페인 D+N 성과 측정 | PF_EVENT 파일럿 | GA4 이벤트·전환 지표 |
| Quick Wins 탐지 (CTR 낮은 고노출) | 격주 | `detect_quick_wins` |

---

## 3. 쌍아 막내 작업 합류 포인트

### 3-1. 현 PF_SECURITY 작업에 서브태스크 편입

- 새 SA 생성 금지 (작가님 2026-04-22 방침).
- 기존 SA 중 **읽기 전용 용도에 적합한 것 선정** (impersonation 대상 이메일).
- SA 이메일을 **각 GSC 사이트 "전체 사용자"** 로 추가 (작가님 직접 or 쌍아가 웹 콘솔 지시 대행).
- GA4 property **"뷰어" 권한** 부여.

### 3-2. MCP 서버 credentials 경로

- 현재 쌍아 gdocs MCP는 `~/.config/mcp-google-docs/token.json` (User OAuth).
- GSC/GA4 MCP는 별도 경로가 필요한지 쌍아 확인 (MCP 서버 소스 또는 설정 문서).
- SA 방식이면 `GOOGLE_APPLICATION_CREDENTIALS` 환경변수 또는 `credentials.json` 경로 지정.

---

## 4. 예상 소요

| 단계 | 소요 | 담당 |
|---|---|---|
| ① SA 선정 + scope 정리 | 10분 | 쌍아 |
| ② GSC 각 사이트 SA 권한 부여 (웹 콘솔) | 사이트당 1분 × N | 작가님 or 쌍아 지시서 |
| ③ GA4 property SA 권한 부여 | 5분 | 작가님 |
| ④ MCP 서버 credentials 설정 | 15분 | 쌍아 막내 |
| ⑤ 연결 검증 (`list_sites` / `list_properties` / 소규모 쿼리) | 5분 | 민아 또는 쌍아 |
| **합계** | **40분~1시간** | 분업 |

---

## 5. 롤백 · 리스크

- SA에 부여한 GSC/GA4 권한은 **revocable** — 언제든 제거 가능.
- **읽기 전용 scope만** 부여 (write 불요).
- 쌍아 기존 gdocs MCP와 **독립 운용** — 서로 토큰·경로 간섭 없음.
- SA 키 유출 리스크: `credentials.json` 파일 권한 `chmod 600`, git ignore 유지.

---

## 6. 제안 타임라인

- **오늘 중 ①~⑤ 완결** 시 민아가 v7 §4-1 ② 표 즉시 실측 주입 → 제출본 완성도 +1.
- 4/24 강한소상공인 마감 이전에 완결되면 **오늘 제출 이벤트에 실측 지표 탑재** 가능.
- 완결 후: 매 세션 시작 첫 1분 지표 스냅이 기본 도구화.

---

## 7. 쌍아에게 — 결정 4건 요청

1. **인증 아키텍처**: A / B(⭐추천)
2. **SA 선정**: 기존 SA 중 어느 것을 impersonation 대상으로?
3. **MCP 서버**: 현 `mcp__google-search-console__*`, `mcp__google-analytics__*` 구현 서버 확인 (쌍아가 세팅했다면 어떤 패키지?)
4. **완결 목표 시각**: 오늘 18:00 / 내일 오전 / 마감(4/24) 전까지 중 가능 시점

---

**끝. 쌍아 답신 대기.**
