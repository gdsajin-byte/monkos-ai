---
type: decision
date: 2026-04-23
from: 작가님 (via iMac/쌍아)
to: iMac/민아
re: PROPOSAL_20260423_민아_Google_Ads_MCP_도입_제안서.md
---

# [결정문] Google Ads MCP 도입 제안 — 작가님 답신

> **[2026-04-23 12:30 KST] 작가님 결정 → iMac/쌍아 전달 → iMac/민아**

---

## §7 결정 요청 3건에 대한 답변

| # | 민아 원 요청 | 작가님 결정 | 실행 방향 |
|---|---|---|---|
| Q1 | Developer Token 신청 착수? | **(a) 즉시** | 1~2주 심사 병목 지연 금지. 오늘/내일 중 `ads.google.com/aw/apicenter`에서 §2-4 양식으로 기본 액세스 신청 |
| Q2 | Track B 쌍아 지시서 발행? | **보류** | PF_SECURITY 완료 후 재개. MCP 패키지 선정·인증 구조 설계는 IAM 재설계 결과에 의존 |
| Q3 | 전용 SA 생성? | **PF_SECURITY로 승격** | `ads-mcp-operator` 단독 생성이 아닌 IAM 전수 재조정·분기 재설계의 일부로 처리 |

---

## 결정 근거

**작가님 선언 (2026-04-23)**:
> "현재 IAM 세팅상 SA 권한 재조정및 분기 차원에서 재설계한다. 1차 막내들 보고 완료되면 관련해서 진행하자"

yong-a 과다권한 중첩 리스크는 Ads에 국한된 문제가 아니라 **현 IAM 아키텍처 전체의 구조적 문제**. 국소 패치로 봉합하지 않고 PF_SECURITY를 신설해 정식 재설계한다.

**트리거**: PF_MONK_OS Phase 0 (막내 4기 보고) 완료
- 막내2(Track B 업계 리서치) ✅ — MCP 생태계 레퍼런스 확보됨
- 막내1/3/4 대기 중

---

## 민아 후속 조치

1. Q1 승인 반영 — 작가님께 Dev Token 신청 타이밍(오늘/내일) 확인 받고 §2-4 양식 원문 최종 다듬어 전달
2. Q2 보류 — Track B 쌍아 지시서 초안 작성 대기. PF_SECURITY 착수 시 재합류
3. Q3 → PF_SECURITY 편입 — [PF_SECURITY](../portfolios/PF_SECURITY/README.md) §5 표에 본 결정 반영 완료. 민아는 PF_SECURITY 관련 문서 인덱스에 본 제안서 연결만 확인

---

## 쌍아 의견 (참고)

- Q1 타이밍: 병목이므로 **오늘** 신청 권고. 신청 버튼 자체는 작가님 수동, 필요 시 쌍아가 CDP로 페이지 열어드림
- PF_SECURITY는 PF_MONK_OS Phase 0 완료가 트리거 — 막내 4기 전원 보고 수신 시점에 자동 활성화
