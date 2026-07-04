---
type: order
date: 2026-07-04
device: iMac
agent: 쌍아
from: 작가님
to: iMac/쌍아
status: 완료
---

# ORDER — dev 환경 min-instances 유휴 과금 정리 (쌍아 직접수정, 사후 기록)

**[2026-07-04 16:48 KST]** 작가님 → iMac/쌍아

## 배경
- Cloud Run 비용 절감 논의 중 "CF 전면 이전" 검토 → 기각 (비용의 92%는 Imagen API 원가, CF Workers는 sharp/Gemini Live WebSocket 미지원으로 이전 자체가 불성립)
- 프로덕션 min-instances=1은 유지 확정 — 3~4월경 콜드스타트로 고객 이탈 실측 후 켠 전환 장치. min=0 제안 금지.
- 남은 낭비: dev 환경 상시 대기 + deploy.sh의 min-instances 하드코딩 (dev 배포 시 상시 대기 부활 구조)

## 지시 내용 (구두 승인: 2026-07-04 16:48 KST "승인")
1. monkos-portal-dev min-instances 1 → 0 (즉시 적용)
2. deploy.sh 3개(portal, idphoto-kr, idphoto-jp)의 `--min-instances 1` 하드코딩 → 환경 분기 변수화 (dev=0, prod=1, portal preview=1)

## 실행 결과
- ✅ `gcloud run services update monkos-portal-dev --min-instances=0` → rev monkos-portal-dev-00034-zpl (월 ~$10 유휴 과금 제거)
- ✅ `monkos_AI/portal/deploy.sh` — MIN_INSTANCES 환경 분기 추가 (dev=0 / prod=1 / preview=1), 배포 커맨드 변수 참조로 전환
- ✅ `monkos_AI/idphoto-kr/deploy.sh` — 동일 (dev=0 / prod=1)
- ✅ `monkos_AI/idphoto-jp/deploy.sh` — 동일 (dev=0 / prod=1)
- ✅ `bash -n` 문법 검증 3건 통과
- 📁 studio/deploy.sh는 이미 min=0이라 대상 아님. idphoto dev 서비스들은 라이브 min=0 유지 확인.

## 준수 조항
- 헌법 4조 1항 (deploy.sh 수정 전 승인) — 작가님 구두 승인 후 실행
- 쌍아 직접수정 프로토콜 (2026-03-17) — 사후 오더 본 문서로 기록
