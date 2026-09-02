---
type: report
date: 2026-09-03
device: iMac
agent: 민아
subject: "출근 후 처리 체크리스트 — 오프라인 광고지원 착수 + 09-02 잔여 4건"
portfolio: PF_ANCHOR
status: 작가님 처리 대기
---

**[2026-09-03 05:09 KST]** iMac/민아 → 작가님

> 순서대로 하시면 됩니다. 1~3은 각 1분, 4는 5분, 5·6은 드래그 토스, 7은 결정 6항 읽고 답만.

## A. 09-02 잔여 (계측·배포)

| # | 할 일 | 방법 | 소요 |
|---|---|---|---|
| 1 | GA4 스트림 확인 | analytics.google.com → 관리 → 데이터 스트림 → MONKOS AI → Google 태그 → 태그 설정 구성 → 관리 → **연결된 사이트 태그** 캡처 | 1분 |
| 2 | GA4 맞춤 측정기준 3개 | 관리 → 맞춤 정의 → 만들기: `service` / `market` / `spec_type` (범위 이벤트, 매개변수=이름 동일) | 3분 |
| 3 | portal-dev 테스트 결제 1회 | https://monkos-portal-dev-4jeplpqpua-uc.a.run.app → 로그인 → /credits → 70c ₩9,900 → 토스 테스트 카드 → 완료 화면. 그 뒤 "됐다" 한 마디 | 2분 |
| 4 | **prod 배포 승인** | "prod 4건 배포 승인" 한 줄 (portal·idphoto-kr·idphoto-jp·studio). 4060 매팅 URL 체인 제거도 같이 | 승인 1줄 |

## B. 오프라인 광고지원 착수

| # | 할 일 | 드래그 대상 | 소요 |
|---|---|---|---|
| 5 | 쌍아에게 T2 설계 요청 토스 | [PROPOSAL_20260903_iMac민아_T2인화_발급보장_설계요청](/Users/jeong-kyushin/developer/monk_project/monkos-ops/ops/proposals/PROPOSAL_20260903_iMac민아_T2인화_발급보장_설계요청.md) | 토스 |
| 6 | 꾸에게 9월 우선순위 전달 | [PLAN_20260903_9월_블로그플레이스_우선순위](/Users/jeong-kyushin/developer/monk_project/monkos-ops/marketing/kku/outbox/PLAN_20260903_9월_블로그플레이스_우선순위.md) — outbox에 배치됨, 워처가 M2로 전달 | 확인만 |
| 7 | **T2 결정 6항** | 위 PROPOSAL §4 — 인화 규격·가격 / 배송 방식 / 보장 범위 / 보장 카피 노출 / 보장 기간 / 운영 주체. 권고안 그대로면 "권고대로" 한 줄 | 답 6개 |

## C. 참고 — 왜 이 순서인가

- A가 먼저인 이유: T2 매출을 잴 계측이 A 없이는 없다. 09-02 결선한 purchase는 prod에 아직 없다
- B-5·6은 작가님 손이 안 가는 일이라 토스만 하면 굴러간다
- B-7이 T2 설계의 착수 조건. 여기서 막히면 쌍아가 못 움직인다

## D. 오늘 새로 생긴 사실 (어제 마감 이후)
- 4060 라인업 배제(자녀 포맷) — 매팅 RunPod 전량, 서비스 영향 0. 메모리·PF_INFRA 반영 완료
- 로컬 LLM 판정 "아직 사치" 기록. 워크스테이션=맥, 서빙=종량제 CUDA 유지
