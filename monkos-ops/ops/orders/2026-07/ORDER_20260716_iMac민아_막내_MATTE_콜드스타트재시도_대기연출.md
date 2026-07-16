---
type: order
date: 2026-07-16
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: matte 콜드스타트 1회 재시도 + 생성 대기 연출(뻗음 오해 방지, 4언어)
status: 대기
portfolio: PF_SPECS
집행 방식: 코드 (서버 재시도 + 프론트 연출) — 조문 아님
---

# 지시서: matte 콜드스타트 재시도 + 대기 연출

**[2026-07-16 17:42 KST]** iMac/민아 → 막내(번호 작가님 지정)

> 작가님 승인(07-16 17:39): "매트 1회 한정 재시도. 1회 실패 시 '진행 중, 잠시만 더 기다려주세요' 멘트든가 시머링 표시 확실히 — 뻗은 걸로 오해 방지."

## 1. 배경 (금일 실측 — REPORT_신호판독_2차속보 참조)

- RunPod 콜드스타트: 첫 호출만 "This operation was aborted", 수 분 내 후속 호출은 0.4s 정상 (금일 mx·ca 2/2 동일 패턴).
- 프론트 공백: 유료 경로(doGenerate)는 스테이지 순환 멘트(genStage1~3) 기구현이나, **무료 경로(doFreeGenerate)는 setGenMessage 1회 고정**(specs-funnel.js:394) — 장기 대기 시 뻗음 오해.

## 2. 작업

### A. 서버 — matte 체인 1회 한정 재시도 (lib/matte.js)
1. `runMatteChain`의 엔드포인트 순회에서 호출 실패(abort/timeout 계열) 시 **동일 엔드포인트 1회 즉시 재시도** 후 다음 엔드포인트로.
2. 재시도는 체인 전체에서 엔드포인트당 1회 한정 — 총 지연 상한 유지. 재시도 성공/실패를 log()에 남길 것(`재시도 1회 성공` 등 — 콜드스타트 빈도 추적용).
3. 기존 폴백 체인(전멸 시 null → Gemini L3 / T0는 503)·경보 쿨다운 로직 불변.

### B. 프론트 — 무료 경로 대기 연출 (public/js/specs-funnel.js + specs-i18n.js)
1. `doFreeGenerate`에 유료 경로와 같은 **시간 기반 멘트 에스컬레이션** 추가: 15초 경과 시 genSub를 안심 멘트로 전환, 35초 경과 시 한 단계 더(문구 상이).
2. 신규 사전 키 4언어(`v2.js` 블록 안 — 클라 주입 경로 주의):
   - `genStillWorking1`: ko "처리가 계속되고 있어요 — 잠시만 더 기다려주세요" / ja·en·es 상응
   - `genStillWorking2`: ko "거의 다 됐어요 — 첫 생성은 조금 더 걸릴 수 있어요" / ja·en·es 상응
3. 스피너(시머)는 기존 v2-phase-generating에 존재 — 멘트 전환 시에도 유지 확인. 타이머는 완료·실패 시 반드시 clear(기존 __genStageTimer 패턴 준용).
4. 유료 경로 스테이지 최종 단계 뒤에도 35초+ 장기화 시 `genStillWorking2` 전환 추가.

## 3. ⚠️ 준수 조항

- 헌법 3조 1·2항 (COMPLETION+세션로그+PF 히스토리) / ch5 (deploy.sh 경유, **dev까지만** — prod는 민아 검증 후. dev 배포는 `--yes` 미사용 대화식 또는 `--yes` 명시)
- resume(1044~)·updateFreeRemainingUI 등 인접 로직 회귀 금지. 멘트 하드코딩 금지 — 사전 키만.

## 4. 완료 기준

- [ ] 서버: 재시도 로직 단위 확인 — MATTE_API_URLS에 죽은 엔드포인트 선두 배치한 로컬 시뮬로 "1회 재시도 → 다음 엔드포인트" 로그 확인
- [ ] 프론트: dev에서 무료 생성 1회 — 15초·35초 멘트 전환 실측(콜드스타트 안 걸리면 타이머 임계 임시 축소로 확인 후 원복), 4언어 사전 주입 확인(SSR grep)
- [ ] 완료·실패 시 타이머 클리어(멘트 잔존 없음), ko 회귀 0
- [ ] dev 배포 + COMPLETION

## 5. 커밋 메시지

```
[feat] matte 콜드스타트 1회 재시도 + 생성 대기 멘트 에스컬레이션 4언어 (PF_SPECS)
```
