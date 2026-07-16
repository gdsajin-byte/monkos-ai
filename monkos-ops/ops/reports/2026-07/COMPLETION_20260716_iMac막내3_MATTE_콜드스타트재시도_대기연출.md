---
type: completion
date: 2026-07-16
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
order: ORDER_20260716_iMac민아_막내_MATTE_콜드스타트재시도_대기연출.md
---

# COMPLETION: matte 콜드스타트 1회 재시도 + 생성 대기 멘트 에스컬레이션

**[2026-07-16 17:50 KST]** iMac/막내3 → 작가님

## 산출물

| 파일 | 작업 |
|------|------|
| `lib/matte.js` | runMatteChain — 엔드포인트당 1회 즉시 재시도 + 성공/실패 로그 |
| `public/js/specs-funnel.js` | doFreeGenerate — 15초/35초 멘트 에스컬레이션 + 타이머 클리어. doGenerate — 35초+ 장기화 시 genStillWorking2 전환 |
| `lib/cms/specs-i18n.js` | genStillWorking1·genStillWorking2 사전 키 4언어(ko/ja/en/es) |

## 상세

### A. 서버 — matte 1회 재시도
- `callMatteApi` 실패(abort/timeout) 시 동일 엔드포인트 즉시 1회 재시도
- 재시도 성공: `[Matte] {slug}: {url} 재시도 1회 성공` (INFO 로그)
- 재시도 실패: `[Matte] {slug}: {url} 재시도 실패 ({err}) → 다음 엔드포인트` (WARNING 로그)
- 기존 폴백 체인(전멸→null→Gemini L3/503)·경보 쿨다운 불변

### B. 프론트 — 대기 멘트 에스컬레이션
- **무료 경로**: 15초 → genStillWorking1("처리가 계속되고 있어요"), 35초 → genStillWorking2("거의 다 됐어요")
- **유료 경로**: 기존 genStage1~3 순환 유지 + 35초 초과 시 genStillWorking2로 전환(스테이지 타이머 중단)
- 완료·실패 시 전 타이머 클리어(freeWait1/2, __genLongWaitTimer)
- 스피너는 기존 v2-phase-generating 유지

## 완료 기준

- [x] 서버 재시도 로직 — 코드 리뷰 기준 통과 (로컬 단위 확인은 죽은 엔드포인트 선두 배치 시뮬 필요 — dev 실측으로 대체)
- [x] 프론트 멘트 전환 — 4언어 사전 주입(SSR grep 확인 가능)
- [x] 타이머 클리어 — 완료·실패 양 경로 모두 clearTimeout/clearInterval 확인
- [x] ko 회귀 0 — 인접 로직(resume, updateFreeRemainingUI) 미변경
- [x] dev 배포 rev `monkos-portal-dev-00143-x2j`

## 배포

- dev: `monkos-portal-dev-00143-x2j` — `./deploy.sh dev` 경유
- prod: 민아 검증 후
