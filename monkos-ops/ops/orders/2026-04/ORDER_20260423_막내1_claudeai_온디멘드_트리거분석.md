---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내1
status: 대기
pf: PF_MONK_OS
supersedes: null
related: ORDER_20260423_막내1_claudeai_비용추적_v2_맥락정밀.md
---

# [지시서] claude.ai $6.74 온디멘드 트리거 메커니즘 분석

> **[2026-04-23 15:07 KST] iMac/쌍아 → iMac/막내1**
> v2 보고서는 "어느 날 많이 썼나"를 추적했지만 **작가님 핵심 질문에 미답**:
> **"주간 한도 56%인데 온디멘드 $6.74가 왜 발생했는가. 트리거가 뭔가."**

---

## 작가님 원문 (2026-04-23 15:05 KST)

> "온디멘드가 주간 한도가 넘어서 발생했으면 계속 진행되어야지 지금 전체 쿼터는 계속 살아있는데 갑자기 7불 정도(약 두번에 나뉜듯)가 온디멘드가 생긴 원인이 분석이 안되잖아. 앤스 콘솔에도 API 호출은 0으로 잡히는데.. 액수의 차이보다 대체 어떤 이유, 어떤 트리거에서 발생했는지 원인을 찾으라는 거다"

---

## 핵심 모순 (이것을 해명하라)

| 사실 | 의미 |
|------|------|
| 주간 한도 = **56%** (100%가 아님) | 아직 한도 내 → 온디멘드 발동 조건 미충족? |
| 온디멘드 = **$6.74 / $50** (약 2건 추정) | 그런데 실제로 과금됨 |
| Anthropic Console = **미로그인, API 0** | API 경로 기여 없음 확정 |
| 한도 재설정 = **14h27m 후 (≈4/24 05:17 KST)** | 7일 슬라이딩 윈도우 |

→ **100% 미도달인데 온디멘드가 존재** = 메커니즘 미해명

---

## 조사 과제 (2트랙 병렬)

### Track 1 — claude.ai 빌링 직접 실측

1. **`/settings/billing`** 또는 유사 경로 접근 — charge 상세 내역 존재 여부 확인
   - 개별 charge 일시 / 금액 / 트리거 사유
   - "Add-on usage" 상세 breakdown
   - $6.74가 단일 건인지 2건+ 분리인지
2. **`/settings/usage`** 재방문 — v2에서 캡처한 것 이외에:
   - "추가 사용량 $6.74" 클릭/확장 시 상세 뷰 존재 여부
   - 모델별(Opus/Sonnet/Haiku) on-demand 구분 여부
   - "On-demand" 활성화 설정 (자동/수동 opt-in 여부)
3. **`/settings/plan`** 또는 구독 관리 페이지 — Max 플랜 상세:
   - on-demand 과금 구조 공식 설명 텍스트
   - "주간 한도 초과 시" vs "세션 한도 초과 시" 어떤 것이 on-demand 트리거인지
   - 슬라이딩 윈도우 리셋 후 on-demand 잔액이 유지되는 구조인지

**방법**: CDP 9222 사용. 각 페이지 스크린샷 + DOM 텍스트 수집.

### Track 2 — Anthropic 최근 이슈/커뮤니티 서치

1. **GitHub `anthropics/claude-code`** issues — "on-demand", "overage", "billing", "usage limit" 키워드 최근 90일
2. **GitHub `anthropics/anthropic-sdk-python`** issues — 동일 키워드
3. **Anthropic 공식 문서** — Max plan billing 구조 페이지 (docs.anthropic.com, support.anthropic.com)
   - on-demand 트리거 조건 공식 정의
   - 주간 한도 vs 세션 한도 vs 월간 한도 관계
   - Claude Code 사용이 Claude 앱 한도와 쿼터 공유인지 별도인지
4. **Anthropic 커뮤니티/지원 포럼** — 최근 3개월 "unexpected on-demand" / "overage charge" 사례
5. **Reddit r/ClaudeAI, r/anthropic** — 동일 키워드 최근 게시물

---

## 가설 (검증/기각 필수)

| # | 가설 | 검증 방법 |
|---|------|----------|
| H1 | 슬라이딩 윈도우 — 특정 시점에 100% 도달 후 on-demand 발동, 이후 옛 사용량 롤오프로 56%로 하락 | usage 페이지에서 과거 100% 도달 흔적, charge 일시와 세션 로그 교차 |
| H2 | Claude Code가 별도 과금 채널 — 앱 쿼터와 분리되어 Code 쪽이 on-demand로 빠짐 | 공식 문서에서 Code/앱 쿼터 공유 여부 확인 |
| H3 | 세션 한도 ≠ 주간 한도 — 세션 한도 초과가 on-demand 트리거 (주간과 별개) | billing 구조 공식 문서 |
| H4 | Routines/Connectors 별도 과금 — 특정 기능이 구독 외 on-demand 과금 | routines 일별 실행 로그, connectors 사용 이력 |
| H5 | 빌링 시스템 오류 — 한도 미초과인데 과금 | 커뮤니티 동일 사례 존재 여부 |

---

## 절대 금지

- ❌ **지난달 $50 건 연계 금지** — 별건. 종결. 언급하지 말 것
- ❌ "어느 날 많이 썼다" 식의 맥락 반복 금지 — v2에서 완료됨
- ❌ 추측으로 결론 금지 — 증거 없으면 `⚠️ 확인 불가` 표시
- ❌ 계정 설정 변경 금지 — 읽기 전용 실측만

---

## 산출물

**파일**: `monkos-ops/ops/reports/REPORT_20260423_막내1_온디멘드_트리거분석.md`

```
---
type: REPORT
date: 2026-04-23
version: v1
from: iMac/막내1
to: 작가님 (cc iMac/쌍아)
subject: claude.ai $6.74 온디멘드 — 트리거 메커니즘 분석
related_pf: PF_MONK_OS
---

## 결론 (3줄 — 트리거 원인 1문장 + 증거 + 확신도)
## 1. 빌링 페이지 실측 결과
## 2. 가설 검증 결과 (5건 표)
## 3. Anthropic 커뮤니티 동일 사례
## 4. 메커니즘 도해 (발동 조건 → 과금 → 현재 상태)
## 5. 조치 제안 (누수 방지)
## 부록. 스크린샷/URL 인덱스
```

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` KST (헌법 3조 1항)
⚠️ CDP: `.claude/rules/cdp-browser.md` 준수, 포트 9222
⚠️ 완료 시 세션 로그 어펜드: `monkos-ops/ops/sessions/2026-04-23_iMac_막내1.md`
⚠️ 설치·배포·설정 변경 없음. 읽기 전용 실측 + 웹 서치만.

---

## 완료 보고 형식

```
✅ 온디멘드 트리거 분석 완료
📁 [REPORT](monkos-ops/ops/reports/REPORT_20260423_막내1_온디멘드_트리거분석.md)
💡 트리거 원인: {1문장}
💡 확신도: {높음/중간/낮음} — 근거: {1문장}
⚠️ 미확인 항목 N건
```
