---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/쌍아-막내10
device: iMac
agent: 쌍아
subject: 매팅 1순위(옛 4060 자리)를 iMac Vision으로 — 흰 테두리 보정 + iMac 상주(launchd) + 포털 체인 Vision→RunPod
status: 발행
portfolio: PF_INFRA
---

# ORDER — 매팅 1순위 Vision 전환

> 출처: 작가님 2026-10-22 22:40 (iMac 쌍아 세션 사람 턴) "비전 정도 퀄리티면 증명에서 문제는 없을듯해 특히 무료 버전이라면 대기시간 줄여주는것만도 큰 이점이지" → 22:42 "현 체제에서 전에 4060이 맡던것을 비전으로 옮기는 것으로.. 반응이 빠르니 문제가 생기면 런팟이 받으면 되지".
> 무료·유료 분리 없음 — 전 경로 체인 = `matte-imac` → RunPod(현행 단일). 포털 코드 변경 0, `deploy.sh` `MATTE_API_URLS` 상수만.

## 1. 작업
1. **흰 테두리 보정**(`monkos_AI/vision-matte/`): 원인 가설 = 2016×1512 고정 마스크의 비등방·업스케일. 보정 후보(경계 1~2px 알파 수축 + 전경 색 오염 제거 등) 중 택1 — 파란 배경(#3366CC 등) 합성에서 테두리 소거를 전·후 시트로 실증, 흰 배경 회귀 없음. 계약(요청·응답 형식) 불변.
2. **iMac 상주**: vision-matte 서버 + cloudflared 터널(matte-imac)을 사용자 launchd 2잡으로(로그인 시 기동·KeepAlive). plist 사본은 `monkos-ops/scripts/`. 시크릿은 기존처럼 SM→env(값 미출력). 실패 가시화: 프로세스 사망 시 launchd 재기동 + 헬스 실패를 알릴 경로 1개(기존 tg_notify 재사용, 남발 방지 억제 포함).
3. **포털 체인**: `monkos_AI/portal/deploy.sh` `MATTE_API_URLS="https://matte-imac.monkos.ai,<현 RunPod URL>"` (RunPod 값은 현 상수 그대로 뒤에). dev 배포 → E(via matte-imac)·F(iMac 서버 정지→RunPod) 재검증 + T1 유료 경로 1회.
4. references.md 도구 맵 vision-matte 행에 "운영 1순위(10-22 작가님 결정)·launchd" 갱신.

## 2. 범위
**허용**: 위 수정 · launchd 2잡 설치(작가님 22:42 결정 범위) · dev 배포.
**금지**: prod 배포(포털 prod는 시크릿 2차와 묶어 작가님 "배포 승인" 후 쌍아가 집행) · 4060 터널·DNS 변경 · 시크릿 생성.

## 3. 반환
COMPLETION + 브랜치·SHA(원격 대조) + 보정 전후 시트 경로 + launchd 재기동 실증(kill 후 자동 복귀) + dev E/F/T1 결과.
