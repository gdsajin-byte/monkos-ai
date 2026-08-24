---
type: order
date: 2026-08-24
device: iMac
agent: 민아
status: 마감
---

# [사후 오더] portal 웜 인스턴스 해제

**[2026-08-24 15:31 KST]** 작가님 → iMac/민아

> 헌법 제1조 2항 ③(민아 직접 지시 경로). 작가님 구두 승인("진행해") 후 실행 → 사후 오더 기록.
> 선행 조건: 같은 날 specs CF 엣지 정적화 컷오버 완료 (COMPLETION_20260824_iMac민아_specs_CF엣지정적화_컷오버.md)

## 배경

- 08-23 idphoto-kr 웜 해제 시 portal은 "monkos.ai 14일 817세션 → 웜 유지 명분 있음"으로 유지
- 08-24 CF 엣지 컷오버로 전제가 바뀜: specs 열람(사이트 트래픽의 주력)은 엣지가 자체 서빙, 오리진 도달은 API 호출·SSR 페이지만
- 콜드스타트 노출 = 생성·결제 첫 요청에 한정. 페이지 진입 체감 무영향

## 조치 (08-23 선례 절차 준용)

1. `monkos_AI/portal/deploy.sh:98` — `MIN_INSTANCES` `"1"` → `"0"`, 사유 주석 갱신
2. `gcloud run services update monkos-portal --region us-central1 --min-instances=0`
   - ch5 검토: `services update`는 금지 대상(`run deploy`·`builds submit`) 아님 — 08-23 오더에서 기검토

## 결과

- 리비전: 00547-klq → **00548-cmz** (100% 트래픽, minScale 어노테이션 소거 = 0)
- 서비스 정상 실측: 엣지 정적 200 · SSR /blog 200 · /api/credits 403(정상 게이트)
- 예상 절감: 월 약 3.6만원 (idphoto-kr 해제분과 합산 월 약 7만원대)

## 롤백

```bash
gcloud run services update monkos-portal --region us-central1 --min-instances=1
```
`deploy.sh:98`을 `MIN_INSTANCES="1"`로 되돌릴 것. 유료 전환 본격화 시 재검토.
