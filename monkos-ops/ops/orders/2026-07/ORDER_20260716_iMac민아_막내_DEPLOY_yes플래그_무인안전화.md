---
type: order
date: 2026-07-16
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: deploy.sh --yes 플래그 + 비TTY 명시 실패 — ch5 신설 조문의 코드 집행 (경미·단건)
status: 대기
portfolio: PF_SPECS
---

# 지시서: deploy.sh 무인 실행 안전화 (5분 작업)

**[2026-07-16 16:39 KST]** iMac/민아 → 막내(번호 작가님 지정)

## 1. 배경

- ch5 신설 조문(07-16 개정): "deploy.sh는 `--yes` 플래그 없이 비TTY 환경에서 실행 시 명시적 실패(exit≠0)한다. 무입력이 exit 0으로 조용히 미배포되는 것을 금지한다."
- **실물 미구현** — 금일 실사고: 백그라운드 실행 시 y/N 프롬프트가 무입력 종료(exit 0)돼 배포가 조용히 무산, 완료로 오인될 뻔함.
- 본 건은 07-16 개정 청구②(조문-집행 코드화)의 실증 1호 — 조문은 있고 코드가 없는 상태를 닫는다.

## 2. 작업 (전 서비스 deploy.sh 공통 적용)

대상: `monkos_AI/portal/deploy.sh` (우선) + `idphoto-kr`·`idphoto-jp`·`studio`·`crop-engine`·`apps/monk_imagen4/backend` (동일 패턴이면 일괄)

1. 인자 파싱에 `--yes`(또는 `-y`) 추가 — 지정 시 확인 프롬프트 생략.
2. prod 확인 지점 로직:
```bash
if [ "$AUTO_YES" != "1" ]; then
  if [ ! -t 0 ]; then
    echo "ERROR: 비TTY 환경에서는 --yes 플래그가 필요합니다 (조용한 미배포 방지, ch5)" >&2
    exit 1
  fi
  read -p "PRODUCTION 배포입니다. 계속하시겠습니까? (y/N) " ...  # 기존 로직 유지
fi
```
3. dev 배포는 현행 무확인이면 그대로(변경 금지).
4. 사용법 주석 갱신 (`./deploy.sh prod --yes`).

## 3. ⚠️ 준수 조항

- 헌법 3조 1·2항 (date·COMPLETION+세션로그+PF 히스토리) / ch5 (본 수정 자체가 ch5 집행)
- **배포 검증**: 수정 후 실배포는 금지 — `bash -n` 문법 검사 + 비TTY 시뮬레이션(`echo | ./deploy.sh prod` → exit 1 확인, `printf 'n\n' |` → 미배포 exit 확인)까지만. 실제 prod 배포로 검증하지 않는다.

## 4. 완료 기준

- [ ] `echo "" | ./deploy.sh prod` → **exit 1** + 에러 메시지 (조용한 미배포 소멸)
- [ ] `./deploy.sh prod --yes` 경로가 프롬프트 없이 배포 로직 진입 (실배포 직전 dry 확인만 — 예: gcloud 명령 직전에 echo 삽입 테스트 후 원복)
- [ ] TTY 대화식(기존 y/N) 동작 불변
- [ ] 적용 서비스 목록 보고 + COMPLETION

## 5. 커밋 메시지

```
[fix] deploy.sh --yes + 비TTY 명시 실패 — ch5 무인 실행 안전 조문의 코드 집행
```
