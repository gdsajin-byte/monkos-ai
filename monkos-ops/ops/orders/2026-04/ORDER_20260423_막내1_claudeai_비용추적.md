---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: P1
related_pf: [PF_MONK_OS, PF_BRIEF, PF_SECURITY]
environment: CLI + CDP 9222~9225 (claude.ai 웹 UI는 CDP 경유 접속)
---

# [지시서] claude.ai 추가 사용량($6.74) 기인 추적

> **[2026-04-23 15:00 KST] iMac/쌍아 → iMac/막내1**
> 배경: 작가님 2026-04-23 15:00경 claude.ai 요금 페이지 확인 — **추가 사용량 $6.74 (13% / $50 한도)** 발생. 일일 루틴 한도는 1/15로 여유. overage 기인을 파악하지 못한 상태.
> **환경 경로**: CDP(기본 9222)로 Chrome에서 claude.ai 로그인 탭 접근. 민아(Code 모드) 전용 작업이 아님 — CDP는 전 에이전트 공용(`.claude/rules/cdp-browser.md`).

---

## 조사 범위 (7축)

### 1. 사용량 상세 페이지
- claude.ai `/settings/billing` 또는 `/usage` 실측
- **일별 overage 발생 타임라인** (언제 $6.74가 쌓였는가)
- **카테고리별 breakdown** (메시지·Routines·API·Connectors·Plugins 등 구분 가능하면)
- 5월 1일 직전 월(4/1~4/23) 포함 사용량 추이

### 2. Routines 목록 전수
- claude.ai `/routines` 또는 설정 경로 실측
- **활성 루틴 목록** (이름·트리거·마지막 실행·실행 빈도)
- 각 루틴의 **월간 실행 횟수 추정**
- **PF_BRIEF 관련 루틴 존재 여부** (매일 자동 브리핑 루틴 등록되어 있는지) — 작가님 1차 의심 후보

### 3. 최근 7일 고비용 세션 상위
- 최근 세션 목록(Chat/Cowork/Code 3모드 구분 가능하면)
- **토큰 사용량 또는 비용 순 상위 10건** (노출 가능하면)
- 고비용 세션의 특성 (긴 대화 / 이미지 첨부 / Skill 실행 / Connectors 호출 등)

### 4. Connectors / Plugins 비용 기여
- 활성 Connectors 3종(Google Drive·Gmail·Calendar)의 호출 빈도
- Productivity 등 Plugins 설치·실행 흔적 (민아 §3.1에 따르면 웹은 탐색만 가능하나 Desktop 모드에서 설치 가능)
- 각 Connector·Plugin이 토큰 사용량에 기여하는지 식별 가능한지

### 5. 공식 비용 정책 교차 확인
- Max 플랜 **월 포함 사용량** 공식 수치 (Track A [D2] 가격 페이지 + claude.ai 플랜 안내)
- 일일 루틴 15회 한도의 초과 시 과금 방식
- Opus 4.7 가격 [D2] — Input $5/MTok · Output $25/MTok — $6.74 역산 시 토큰 추정

### 6. MONK 자동화 자산 점검
- **PF_BRIEF**: 현 실행 상태 (수동/자동/미가동) — PF README 및 관련 ORDER/REPORT 확인
- **CDP 관련 자동화**: 예약 실행 설정 여부
- **SPREAD 배포 루틴**: 자동 트리거 여부
- MONK 측 코드·cron·스크립트가 claude.ai API를 호출하는 경로 있는지 (없을 것으로 추정하나 확인)

### 7. 결론
- $6.74 overage의 **기인 Top 3 추정**
- 재발 방지 조치 (의도치 않은 루틴 비활성화·Connector 호출 제한 등)
- **월 지출 한도 $50 유지 vs 조정** 판단 재료

---

## 산출물

**메인 보고서**: `monkos-ops/ops/reports/REPORT_20260423_막내1_claudeai_비용추적.md`

구조:
```
---
type: REPORT
date: 2026-04-23
from: iMac/막내1
to: 작가님 (cc iMac/쌍아)
subject: claude.ai 추가 사용량 $6.74 기인 추적
---
## 요약 (300자)
## 1. 사용량 breakdown
## 2. Routines 목록·실행 내역
## 3. 고비용 세션 상위
## 4. Connectors/Plugins 기여
## 5. 공식 정책·토큰 역산
## 6. MONK 자동화 자산 점검
## 7. 결론 — Top 3 기인 추정 + 재발 방지 조치
## 부록. 스크린샷 (있으면 research/assets/BILLING_*.png)
```

---

## 준수 조항

⚠️ 타임스탬프 매 턴 `date` KST (헌법 3조 1항)
⚠️ 비용·토큰 수치는 **실제 노출값만 기록**, 추정 시 "추정" 명시 (추정 금지 원칙)
⚠️ 작가님 계정 **설정 변경 금지** — 조사 전용. 루틴 비활성화·한도 조정 등은 결론 보고 후 작가님 승인 경로
⚠️ 결제 정보·카드 번호 노출 금지 (§3 캡처 시 마스킹)
⚠️ 완료 시 세션 로그 append: `monkos-ops/ops/sessions/2026-04-23_iMac_막내1.md`
⚠️ CDP 포트 충돌 주의: 민아 Code 모드가 같은 Chrome 인스턴스를 쓰고 있을 수 있음 — `scripts/tools/cdp_setup.sh status`로 기존 세션 확인 후 필요 시 9223~9225 포트 사용

---

## 완료 보고 형식

```
✅ 비용 추적 완료 — REPORT_20260423_민아_claudeai_비용추적.md
📁 [링크]
💡 Top 3 기인 (1위·2위·3위)
⚠️ 확인 필요 항목 N건
⏳ 재발 방지 제안 (있다면)
```
