---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 애플 비전 매팅 2단계 — iMac 상주 + CF 터널(dev 전용) + 포털 dev E2E·폴백·동시성 + 마스크 해상도 실측
status: 발행
portfolio: PF_INFRA
---

# ORDER — 애플 비전 매팅 2단계 (iMac, dev 전용)

> 출처: 작가님 2026-10-22 21:45 (iMac 쌍아 세션 사람 턴) "네가지 권고안 모두 처리해" — 쌍아 21:42·21:43 권고 일괄 승인. (매팅 A안 = iMac dev 시험, 터널 호스트 신설 포함)
> 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트.md` §3 S·E·F. 1단계 서버: `monkos_AI/vision-matte/`(main).
> 전제(쌍아 21:43): iMac18,3·macOS 13 — **운영 호스트 아님, dev 시험 전용**. 운영 호스트는 품질 판정 후 별도 결정.

## 0. 공유 자원 순서 (쌍아 21:47)

포털 dev는 같은 시각 다른 지시서(Gemini 이전·시크릿 2차)가 배포한다 — dev 배포는 env를 deploy.sh 값으로 되돌리므로 **3·4번(포털 dev env·E·F)과 6번의 RunPod-via-dev 비교는 쌍아 신호 전까지 착수 금지**. 1·2·5번과 6번 중 iMac 쪽 결과는 먼저 진행.

## 1. 작업
1. iMac에서 vision-matte 상주(사용자 launchd 또는 bg 프로세스 — 재부팅 내성은 불요, 시험 기간 한정) · `MATTE_SECRET`은 4060과 같은 SM 시크릿을 secret 경유 주입(값 미출력, 없으면 중단 보고).
2. cloudflared 터널 + DNS `matte-imac.monkos.ai`(작가님 승인 범위) — 기존 4060 터널 설정·이름 불변.
3. 포털 **dev**만 `MATTE_API_URLS` 앞에 iMac URL 추가(뒤에 RunPod 유지) — prod env 불변.
4. 판정 S(동시 3건·3MP p50/p90) · E(dev 생성 1회 완주, 로그에 iMac 경로) · F(서버 정지 → RunPod 폴백 완주).
5. **마스크 해상도 실측**: Vision이 내는 마스크의 실제 픽셀 크기(입력 3MP 대비) 기록 — 흰 테두리 원인 판정 근거.
6. 품질 비교 시트: 같은 원본 5장(고객 데이터 금지 — 공개 샘플·레포 자산)으로 iMac 결과 vs RunPod BiRefNet(dev 경유) 나란히 + 경계 띠 ±8px 알파 SAD/MAE. 결과 이미지는 커밋 금지, 로컬 경로 제시.
7. 시험 종료 시 포털 dev env 원복 절차를 COMPLETION에 명기(원복은 쌍아 지시로).

## 2. 금지
prod env·prod 배포 · 4060 터널 변경 · 시크릿 생성.

## 3. 반환
COMPLETION + 브랜치·SHA(원격 대조) + S·E·F 판정 + 마스크 해상도 + 품질 시트 경로.
