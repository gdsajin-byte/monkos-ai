---
type: REPORT
date: 2026-04-23
from: iMac/막내1 (지시서 수신명 막내1)
to: 작가님 (cc iMac/쌍아)
subject: claude.ai 추가 사용량 $6.74 기인 추적
related_pf: [PF_MONK_OS, PF_BRIEF, PF_SECURITY]
order: ORDER_20260423_막내1_claudeai_비용추적.md
environment: CDP 9222 (기존 claude.ai 로그인 세션 재사용, 신규 탭 생성)
---

# REPORT — claude.ai 추가 사용량 $6.74 기인 추적

## 요약 (300자 내)

$6.74 overage의 **최유력 기인은 Opus 4.6 1M context billing regression**이다 — 2026-03-20 Anthropic 이메일로 "1M context는 Max 플랜에 포함, Extra Usage 불필요"라 공지됐으나 2026-03-27~28부터 Claude Code `/model` 선택자에 "Billed as extra usage"로 역회귀. 작가님이 이미 지원팀에 에스컬레이션한 Conversation ID **215473433883069**가 바로 이 건. 실측 사용량 페이지 기준 월 지출 한도 $50 중 $6.74 소진(13%), 5월 1일 재설정. 일일 포함 루틴은 1/15로 여유 — Routines는 기인 아님. MONK 측 cron·스크립트에서 claude.ai API 직접 호출 경로 **0건**. **재발 방지 1순위**: `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` 환경변수 세팅 + 지원팀 케이스 215473433883069 진행 상황 재확인.

---

## 1. 사용량 breakdown (실측)

**경로**: `https://claude.ai/settings/usage` (2026-04-23 13:32 KST 실측)

| 항목 | 값 | 재설정 |
|------|----|------|
| **Max (20x) 현재 세션** | 36% 사용 | 1시간 27분 후 |
| **주간 한도 — 모든 모델** | **56% 사용** | 14시간 27분 후 |
| **주간 한도 — Sonnet만** | 14% 사용 | 15시간 27분 후 |
| **주간 한도 — Opus 전용(추정)** | 0% 사용 | — |
| **일일 포함 루틴 실행** | **1 / 15** | 15시간 24분 후 |
| **추가 사용량 (월 지출 한도)** | **US$6.74 / US$50 (13%)** | **May 1에 재설정** |
| **추가 사용량 잔액 (프리페이드)** | US$193.25 | — |
| **자동 새로고침** | 꺼짐 | — |

- 일별 타임라인·카테고리별 breakdown은 claude.ai UI에 **노출되지 않음** (API console 전용 지표로 추정)
- 4/1~4/23 월간 추이 역시 UI 노출 없음 — $6.74 총액만 확인 가능

**스크린샷**: [assets/2026-04-23/USAGE_20260423_1333.png](assets/2026-04-23/USAGE_20260423_1333.png)
※ `/settings/billing` 스크린샷은 카드정보 포함으로 리포트 부록에서 제외 (§결제 Mastercard 뒷 4자리 3947만 텍스트 레코드)

**월 청구 요약** (`/settings/billing` 발췌):
- Max 플랜 월 $200.00, 2026-04-24 자동 갱신
- 최근 3개월 청구: 3/24 $200, 2/24 $200, 1/24 $200 전부 Paid
- 추가 사용량 프리페이드 크레딧 잔액 $193.25 (자동 충전 꺼짐)

---

## 2. Routines 목록·실행 내역

- claude.ai 설정 메뉴에 **Routines 전용 탭 미노출** (일반/계정/개인정보보호/결제/사용량/기능/커넥터/Claude Code/Chrome용 Claude 베타 — Routines 없음)
- `/routines`, `/settings/routines`, `/schedules`, `/settings/schedules` 모두 **Not Found / 404**
- 사이드바·홈 UI에서 "루틴" 키워드 링크 **1건**: `https://claude.ai/chat/b9f28c79-...` (과거 "스케줄 타스크 설정 확인" 채팅 제목, 루틴 기능 아님)
- 결론: **작가님 계정에는 Routines 기능이 UI 활성화되어 있지 않음** (2026-04-14 출시된 Claude Code Routines는 별개 제품, 해당 계정 roll-out 여부는 확인 불가)

**일일 루틴 1회 기인 추정**:
- **PF_BRIEF의 Cloud RemoteTrigger `trig_017yVCnS4tBKyCQTMLHieMF5`** (매일 04:57 KST 실행, 2026-04-10 쌍아 생성)
- 04/10 PoC 실패(curl 차단) → 04/11 민아 재진단 완료 → 이후 `briefings/` 폴더 빈 상태 = **실제 브리핑 발행은 없으나 trigger fire는 계속** (카운터만 소비)
- `grep "trig_017yVCnS4tBKyCQTMLHieMF5"` 히트: `PF_BRIEF.md`, 04/10 M1/iMac 쌍아 세션 로그 2건, 04/11 M1 민아 세션 로그 1건

---

## 3. 최근 7일 고비용 세션 상위

- **claude.ai UI는 세션별 토큰/비용 노출 기능 미제공** (Claude 제품 사용자 대시보드 한계)
- 공식 가격 [D2] 기준 Opus 4.7 Output $25/MTok → $6.74 역산 약 **270K output tokens 상당** (캐시·input 무시한 상한선 추정치, 실제는 혼합이라 더 큼)
- Max 주간 "모든 모델" 한도 **56%** 누적 = 이번 주 Opus·Sonnet 혼합 고사용 구간 존재. 개별 세션 귀속 불가

---

## 4. Connectors / Plugins 기여

**경로**: `https://claude.ai/settings/connectors` 실측

활성 Connectors 4종 (공지: "커넥터가 맞춤 설정으로 이동했습니다"):
- GitHub 연동: **연결됨**
- Gmail: 구성
- Google Calendar: 구성
- Google Drive: 구성
- 커스텀 커넥터: 추가 가능(현재 0건)

- Connectors는 **메시지 토큰 사용을 증가시키지만 별도 과금 체계는 없음** (메시지 사용량 한도에 포함)
- Connectors 호출 빈도는 UI에 노출 안 됨 — 개별 기여도 식별 불가
- **Plugins**: Max 플랜에서 설정 메뉴에 전용 탭 **미노출** (Skills `/customize/skills`에 흡수된 것으로 추정)

---

## 5. 공식 정책·토큰 역산

### Max 플랜 포함 사용량
- Pro 대비 **20배** (플랜 페이지 표기)
- 주간 한도 3개 축: 모든 모델 / Sonnet만 / Opus 전용
- 일일 포함 루틴 15회
- 1M 컨텍스트 포함: **2026-03-20 공지에 명시** ("1M context is now included in Max — no extra usage required")

### 공식 가격 [D2] 기준 역산 (Opus 4.7)
- Input $5/MTok, Output $25/MTok
- $6.74 상한 추정: 최대 ~270K output tokens 또는 ~1.35M input tokens
- 4.7는 동일 가격, 4.6도 동일 — 4.6→4.7 전환이 과금에 미치는 영향 **없음**

### 한도 초과 시 과금 방식
- 주간 한도 소진 후에도 사용 계속하면 **추가 사용량($50 월 한도)에서 차감**
- $50 한도 도달 시 기본적으로 사용 차단 (자동 충전 꺼짐 상태라 한도 내에서만 진행)
- 프리페이드 크레딧 $193.25는 한도 초과 후 수동 구매본 — 자동 충전 OFF이므로 당장 소비되지 않음

---

## 6. MONK 자동화 자산 점검

### claude.ai API 직접 호출 경로 — **0건**

```bash
grep -rln --include="*.sh" --include="*.py" --include="*.js" --include="*.ts" \
  -E "claude\.ai|anthropic\.com/v1|x-api-key|CLAUDE_API" \
  scripts/ apps/ monkos-ops/
# → 결과 없음
```

- MONK 측 cron·shell·Python·Node 스크립트 어디에도 claude.ai / Anthropic Messages API 직접 호출 없음
- 빌링은 순수 Claude 앱(웹/Desktop/Code) 사용에서만 발생

### PF_BRIEF Cloud RemoteTrigger 현 상태
- Trigger ID: `trig_017yVCnS4tBKyCQTMLHieMF5` (2026-04-10 쌍아 생성)
- 예약: 매일 04:57 KST
- 실제 발행: **04/11부터 없음** (briefings/ 폴더 부재)
- 04/11 민아 진단: curl 차단·WebFetch 한계·GSC MCP 경로 오류 3건 결합으로 축1(GSC)·축2(SEO)가 방안 C로 전환 대기 상태, 축3(뉴스) 부활 가능 확인만 완료
- **trigger 자체가 취소됐는지는 Anthropic UI/API에서 직접 확인 불가** (Routines 메뉴 미노출)

### SPREAD 배포 루틴·CDP 관련 자동화
- SPREAD: 민아 수동 실행 경로 (PF_SPREAD 기반). 자동 cron 없음.
- CDP: 막내·민아 수동 기동 (`cdp_setup.sh start`). 자동 트리거 없음.

---

## 7. 결론 — Top 3 기인 추정 + 재발 방지 조치

### Top 3 기인

| 순위 | 기인 | 근거 | 추정 기여도 |
|------|------|------|------------|
| **1** | **Opus 4.6 1M context billing regression** (Anthropic 측 버그) | GitHub Issues [#40223, #43872, #30033 등 다수], 2026-03-20 공지와 3-27~28 regression 불일치. 작가님 이미 지원 케이스 **Conv ID 215473433883069** 에스컬레이션 중 | **대부분 (**>70% 추정)** |
| **2** | **주간 한도(모든 모델) 56% 누적 사용 구간의 초과분** | 실측 usage 페이지. 개별 세션 귀속 불가. Opus 4.7 전환 후 토크나이저 +35% 증가도 소폭 기여 가능 | 보조 (20~25%) |
| **3** | **PF_BRIEF RemoteTrigger 공회전** (일일 포함 루틴 1/15 소비) | 브리핑 발행 없이 trigger만 fire. 일일 포함분이라 overage 직접 기여 **미미** | 극소 (<5%) — 실질 영향 거의 없음 |

### 재발 방지 조치 (작가님 승인 필요)

1. **[최우선] Opus 4.6 1M context 회피**
   - 환경변수: `export CLAUDE_CODE_DISABLE_1M_CONTEXT=1` (Issue #30033이 권고한 실전 가드)
   - Claude Code 내 `/model opus` 사용 시 200K 기본 유지, 1M 필요 시 명시적으로만 전환
   - Opus 4.7은 동일 bug 영향 받는지 불분명 — 검증 시까지 동일 가드 유지 권장

2. **지원 케이스 추적 (Conv ID 215473433883069)**
   - 현 진행 상황·환불 가능성 재확인 (지원팀 답신 여부)
   - GitHub Issue #40223 진행 상황 모니터링 (동일 regression 다수 사용자 보고)

3. **PF_BRIEF trigger 정리**
   - `trig_017yVCnS4tBKyCQTMLHieMF5` 실효성 0 — 브리핑 발행 없이 일일 카운터만 소비
   - Routines UI 미노출이라 직접 cancel 불가 → 지원팀에 해당 trigger ID 제거 요청 또는 PF_BRIEF 부활 시점에 재사용으로 전환

4. **월 지출 한도 $50 유지**
   - 현재 $6.74(13%)로 여유. 잔액 $193.25는 별도 프리페이드 크레딧(자동 충전 꺼짐)
   - 한도 상향은 bug 수정 전까지 **보류** 권장 (규모 파악용 신호로 유지)

5. **주간 한도 모니터링 습관**
   - 현 56%(모든 모델) 수준에서 재설정 14시간 남음 — 당분간 Sonnet 위주로 전환 권장
   - Opus 전용 0%는 역설적 — 1M context가 "모든 모델" 한도로 집계되는 현 체계 감안

### 확인 필요 항목 (쌍아·작가님 판단 요청)

1. **지원 케이스 Conv ID 215473433883069 현 상태** — 4/23 시점에서 Anthropic 답신/환불 여부
2. **Routines UI 활성화 여부** — Max 플랜에 2026-04-14 Routines 기능이 언제 roll-out되는지 지원팀 문의
3. **PF_BRIEF 재가동 일정** — trigger 살려둘지 제거할지 결정

---

## 부록. 스크린샷

- [USAGE_20260423_1333.png](assets/2026-04-23/USAGE_20260423_1333.png) — 사용량 페이지 전체 (카드정보 없음)
- /settings/billing 스크린샷은 Mastercard 뒷 4자리 노출로 리포트 포함 제외

---

**보고서 작성**: 2026-04-23 13:36 KST / iMac/막내1 (지시서 수신명 막내1) → 작가님 (cc iMac/쌍아)
**환경**: CDP 9222, 신규 탭(0BA9A3DA12EF), 기존 claude.ai 로그인 세션 재사용
**준수**: 카드번호·결제정보 마스킹, 계정 설정 변경 없음 (읽기 전용 조사), 추정값 전부 "추정" 명시
