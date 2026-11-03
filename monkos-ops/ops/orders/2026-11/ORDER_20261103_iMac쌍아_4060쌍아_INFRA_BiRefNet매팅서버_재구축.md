---
type: order
date: 2026-11-03
from: iMac/쌍아
to: 4060/쌍아
subject: 4060 BiRefNet 매팅 서버 재구축 — ① 로컬 서버 기동 + 기본 테스트 이미지 결과(애플 비전 비교 기준점) ② NSSM 상주·시크릿·터널 복구(matte.monkos.ai 530 해소). 포털 매팅 체인 순서 변경은 범위 밖
status: 대기
portfolio: PF_INFRA
---

# ORDER — 4060 BiRefNet 매팅 서버 재구축

**[2026-11-03 18:37 KST]** iMac/쌍아 → 4060/쌍아

출처: 작가님 2026-11-03 18:37 iMac 쌍아 세션 사람 턴 "다시 세팅해"(4060 BiRefNet 재구축 — 설치 포함). 맥락: 18:36 "신형은 복잡한 부분을 덜 건드린 것, 배경 컬러가 많이 남겨졌다" → 애플 비전 비교의 기준점으로 BiRefNet 결과 필요. 범위 = 본 문서 §2~§4. 원격 승인 전달(ch1 2조 1항 원칙 경로, PETITION_20261103 4-1) — 재승인 불요.

## 1. 사실

- 10-29 재구축 후 4060에 매팅 서비스 없음: `sc query birefnet-matte` 결과 없음, `127.0.0.1:8000/health` 무응답, `matte.monkos.ai/health` 530(11-03 13:4x·18:36 실측).
- 정본: `monkos_AI/matte-server/`(server.py·deploy.sh·README). 모델 `ZhengPeng7/BiRefNet`(trust_remote_code), FastAPI·uvicorn :8000, NSSM 서비스 `birefnet-matte`, 터널 `matte.monkos.ai` → `4060-matte`. 구 venv `.venv_factory`(torch 2.11+cu128).
- 현재 포털 매팅 체인은 matte-imac → RunPod로 정상 — 4060 복구가 장애 대응은 아니다.
- 4060 GPU는 바둑 학습(ORDER_20261103 GO 파일럿)과 공용. BiRefNet 잡당 VRAM ≈2.4GB·상주 ≈1GB(README 실측) — 학습 배치와 합쳐 8GB 넘지 않게.

## 2. 할 일

**① 로컬 서버 + 기준점 결과 (먼저, 끝나면 1줄 통지)**
1. venv(기존 go-train 재사용 또는 `.venv_factory` 재생성 — 근거 1줄)에 server.py 의존 패키지 설치. 모델 다운로드.
2. `MATTE_SECRET` 없이 로컬(127.0.0.1:8000) 임시 기동 → `monkos_AI/vision-matte/contract_test.sh http://127.0.0.1:8000 monkos_AI/test-fixtures/default_portrait.jpg --bench 5 --save …` 실행.
3. 결과 JPEG를 iMac/쌍아에 전달(레포 커밋 금지 — `scp`·세션 메시지로 경로 통지 또는 iMac이 `scp 4060:` 회수). 처리시간 p50·VRAM 기록.

**② 상주·시크릿·터널 (①이 끝난 뒤)**
1. NSSM 서비스 `birefnet-matte` 재설치(Automatic), `MATTE_MAX_CONCURRENT=1` 유지.
2. `MATTE_SECRET`: 기존 SM 값을 서비스 환경에 주입(값을 화면·파일·로그에 남기지 않음 — `secret map MATTE_SECRET`으로 존재 확인, 파이프 주입). SM에 없으면 중단·보고(생성 금지).
3. Cloudflare 터널 `4060-matte` 복구: 기존 터널 자격 증명을 찾을 수 있으면 재사용, 없으면 **중단·보고**(새 터널·DNS 변경은 별도 승인).
4. 검증: 로컬 `/health` 200 · 외부 `matte.monkos.ai/health` 200(2회 히트, 2차 판정) · contract_test 시크릿 포함 PASS.
5. 포털 `MATTE_API_URLS` 순서 변경·체인 편입은 **하지 않는다**(작가님 결정 사안).

## 3. 산출물·쓰기 범위

- 레포: `monkos_AI/matte-server/README.md` 재구축 절차 갱신(Windows 함정 포함), 필요 시 `deploy.sh` 경로 보정. 서비스 코드(server.py) 동작 변경 금지.
- COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261103_4060쌍아_INFRA_BiRefNet매팅서버_재구축.md` — 설치 목록·버전·VRAM·처리시간·계약 결과·터널 상태.
- 세션 로그 `2026-11-03_4060_쌍아.md`, PF_INFRA 1행. main 커밋·푸시(문서·README만).

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿 생성·추측·출력 금지. MATTE_SECRET·터널 자격 증명은 기존 것만, 값 미노출.
- 헌법 4조 2항: 파괴적 명령 금지. 바둑 학습 프로세스·데이터 건드리지 말 것.
- 헌법 3조 1·2항: `date` 실측 헤더, 세션 로그 append-only, 완료 보고 + 원격 SHA 대조.
- 테스트 이미지는 `monkos_AI/test-fixtures/default_portrait.jpg`(작가님 지정 기본값) — 고객 사진 금지.

## 5. 완료 기준

- [ ] ① 로컬 BiRefNet 기본 이미지 결과 + 처리시간·VRAM → iMac 전달
- [ ] ② NSSM 상주·MATTE_SECRET 주입·터널 복구 → matte.monkos.ai/health 200(2회 히트)
- [ ] 바둑 학습 무중단 확인
- [ ] README·COMPLETION·세션 로그·PF 1행·원격 SHA 대조

## 6. 커밋 메시지

```
[ops] 4060 BiRefNet 매팅 서버 재구축 — 로컬·상주·터널 (PF_INFRA)
```
