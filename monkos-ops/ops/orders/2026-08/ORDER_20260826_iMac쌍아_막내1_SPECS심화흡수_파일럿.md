---
type: order
date: 2026-08-26
device: iMac
agent: 쌍아
receiver: 막내1
subject: "specs 심화 흡수 파일럿 — 캐나다 2엔트리 (ca-passport, ca-visa)"
portfolio: PF_SPECS
status: 발행
---

# 지시서 — specs 심화 흡수 파일럿

**[2026-08-26 19:10 KST]** iMac/쌍아 → 막내1

## 0. 착수 전 필독

- **설계 정본: `monkos-ops/tech/designs/2026-08/DESIGN_20260826_specs심화흡수_파일럿.md` — 먼저 Read.** 본 지시서는 그 실행분이다
- `.claude/rules/live-verify.md` (라이브 판정)
- `.claude/rules/specs-context` 계열 및 `PF_SPECS`

## 1. 목적

A군 원고의 실조사 서사를 specs로 흡수해 페이지 깊이를 올린다. **캐나다 2엔트리 1건 파일럿**이며, 목적은 캐나다 개선이 아니라 **잔여 16건 확대 여부의 판단 근거 확보**다(설계 §7).

- 소스 원고: `monkos-ops/contents/blog/blog_20260808_canada-visa-passport-photo-spec-guide_KR.md`
- 대상: `monkos_AI/portal/lib/cms/specs-data.json` 의 **`ca-passport`, `ca-visa`**

## 2. 🔴 필드 경계 (최우선 준수)

`specs-data.json`은 `lib/spec-crop.js`·`lib/matte.js`가 함께 읽는 **생성·크롭 엔진 입력**이다.

| 구분 | 필드 |
|---|---|
| 수정 허용 | `rejectionReasons` · `faqs` · `details` |
| 조건부 (공식 대조 후, 빈 값 보충만) | `validity` · `fileSpec` · `source` · `sourceName` |
| **🔴 불가침** | `size` · `pixels` · `dpi` · `background` · `headHeight` · `headHeightMin` · `headHeightMax` |

**커밋 전 diff에서 불가침 필드 변경이 0줄임을 실증하고 보고에 기재한다.** 1줄이라도 변경되면 고객 사진 규격이 틀어진다.

## 3. Task 1 — 사실관계 확보

- `officialSource`(canada.ca) 원문을 실제로 열어 대조한다. **원고 단독 근거 금지 — 원고는 소스지 정본이 아니다.**
- 원고 주장과 공식이 다른 항목은 **공식을 채택**하고, 불일치 건수·내용을 보고에 남긴다(잔여 16건 검수 강도 결정에 쓴다).

## 4. Task 2 — 충돌 1건 해소 (설계 §5)

`ca-passport.details.ko`는 **"종이 신청은 상업 사진관 촬영 요구 + 뒷면 상호·주소·촬영일 기재"**를 이미 명시한다. 반면 원고에는 **"스마트폰 셀카 한 장으로 규격 맞추기"** 섹션이 있다.

- 이 충돌을 그대로 옮기지 말 것. **고객이 우리 말을 믿고 반려당한다** (헌법 4조 4항 "되는 것만 응답").
- **신청 경로별 분리 서술**로 해소한다 — 온라인 갱신(디지털 파일 허용, `fileSpec`에 근거 존재) vs 종이 신청(사진관 요구).
- "언제 쓸 수 있고 언제 못 쓰는지"를 명시하는 쪽이 신뢰 자산이다. 우리 서비스가 못 쓰이는 경우를 숨기지 않는다.

## 5. Task 3 — 흡수 실행

1. **`rejectionReasons`** — 현행 일반 5줄(`배경 불균일/머리 기울어짐/사이즈 불일치/그림자 감지/표정 부적합`, 429중 418건 동일)을 **캐나다 특화로 교체**. 소스: 원고 §"흔한 거절 사유 5가지", §"함정이 하나 더 있습니다"
2. **`faqs`** — 기존 3문항은 **유지**(검색 수요 있음). 규격 필드로 답할 수 없는 문항을 **증보**한다. 예: 5×7cm인 이유, 온라인/종이 신청 차이, 파일 규정 하한
3. **`details`** — 위 충돌 해소 결과를 반영
4. **4언어 동시 갱신** — `ko`/`ja`/`en`/`es` 전부. 한 언어만 고치면 언어별로 다른 내용을 서빙한다. 번역체가 아니라 각 언어의 자연스러운 표현으로

## 6. Task 4 — 검증·배포

- 회귀: `spec-crop.test.js` · `spec-crop-consistency.test.js` · `matte.test.js` 통과
- 불가침 diff 0줄 실증
- 4언어 항목 수·사실 정합 대조
- **SSG 재빌드 → `monkos_AI/portal/edge/deploy.sh`** (specs-data 변경은 엣지 재배포 의무. 누락 = 무음 구본 서빙)
- 라이브 판정: `live-verify.md` — **URL당 2회 히트** + 양성 대조군. 대상 `/specs/passport/ca`, `/specs/visa/ca` 및 `ja`/`en`/`es` 변형

## 7. Task 5 — 파일럿 계측 기록 (본 파일럿의 산출물)

- 1건당 소요 시간 (조사 / 작성 / 검증 / 배포 분리)
- 필드별 증분 (반려사유 n→m, FAQ n→m, 문자 수)
- **GSC 베이스라인 박제** — `/specs/passport/ca` 253노출·5클릭·CTR 1.98%·pos 6.43 (07-27~08-25). D+14(09-09) 재측정 예약 기재
- 원고↔공식 불일치 건수

## 8. 범위 밖 (착수 금지)

- A군 잔여 16건 무접촉. `us-visa-photo-spec-guide` 폐기는 별건
- 캐나다 외 국가 엔트리 무접촉
- specs URL·슬러그 변경 금지
- B군 34건 블로그 라인 무접촉 (병행 진행 중)
- 원고 md 수정 금지 (소스로만 읽는다)

## 9. ⚠️ 준수 조항

- **헌법 3조 1항** 매 턴 `date` / **4조 2항** 파괴적 명령 금지
- **ch5** 배포는 `edge/deploy.sh` 경유. `wrangler deploy` 단독 금지(자산 변경 있음)
- **ch2 7조** 인프라 상수 하드코딩 금지
- **ch6** 롤백 단위 커밋 분리 — 데이터 변경 / 기록 별도
- **ch7** COMPLETION 필수: `monkos-ops/ops/reports/2026-08/COMPLETION_20260826_iMac막내1_SPECS심화흡수_파일럿.md`
- 타 에이전트 미커밋 작업 무접촉
- 에러 3회 반복 시 `/에스컬레이션`

## 10. 완료 기준

- [ ] 공식 출처 대조 완료 + 원고 불일치 건수 보고
- [ ] 종이/온라인 신청 충돌 해소 서술 반영
- [ ] `ca-passport`·`ca-visa` 반려사유 국가 특화 교체 + FAQ 증보 + 4언어 정합
- [ ] **불가침 필드 diff 0줄 실증**
- [ ] 회귀 테스트 3종 통과
- [ ] SSG 재빌드 + 엣지 배포 + 라이브 2회 히트 판정
- [ ] 파일럿 계측 기록 (시간·증분·GSC 베이스라인·불일치 건수)
- [ ] PF_SPECS 히스토리 1행 + 세션 로그 + COMPLETION + 커밋·푸시(ahead 0)
