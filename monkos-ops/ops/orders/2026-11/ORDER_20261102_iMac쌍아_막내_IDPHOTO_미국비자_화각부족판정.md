---
type: order
date: 2026-11-02
from: iMac/쌍아
to: iMac/막내
subject: 미국 비자 여백 — fit 프레임의 원본 이탈량(상하좌우) 판정 + "더 멀리서·어깨까지" 안내, dev 검증까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 미국 비자 화각 부족 판정

**[2026-11-02 17:26 KST]** iMac/쌍아 → iMac/막내

출처: 작가님 2026-11-02 16:59 iMac 쌍아 세션 사람 턴 "해상도라기 보다 화각이 좁아서 정상적으로 범위안에 안들어오는 문제" → 쌍아 원인 분석(17:00) → 작가님 17:26 "a안 테스트해보자". 범위 승인 = 본 문서 §2~§3. **prod 배포 범위 밖.** 이 지시서는 같은 날 [입력해상도판정_1단계](ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_입력해상도판정_1단계.md)를 **대체**한다(그 문서는 미투입 폐기).
배경 참고: [민아 제안서](../../proposals/PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지.md) — 메시지 체계(`rej_*`)·문안 어조·계측 설계는 그대로 쓰되, 판정 축은 해상도가 아니라 **화각**이다.

## 1. 원인 (쌍아 17:00 코드 분석)

- us-visa: 51×51mm, 두상 목표 26mm(`portal/lib/spec-crop.js:84`), 눈 앵커 43% → 프레임이 어깨까지 들어가는 넓은 구도.
- 얼굴 위주로 좁게 찍힌 원본이면 fit 프레임이 원본 밖으로 나간다. `crop-engine/lib/crop.js` `fitSpecGeometry`가 `padded:true`만 세우고, 포털 `matte.js` `matteFitPipeline`/`renderFitCrop`이 모자란 부분을 배경색으로 채워 **경고 없이 출고**.
- 위쪽 채움은 배경과 같은 색이라 보이지 않지만, **좌우·아래 채움은 어깨·몸이 직선으로 잘린 모양**이 된다 = 작가님이 본 "여백".

## 2. 할 일

1. **이탈량 계측**: fit 결과에 `outside: { top, bottom, left, right }`(프레임 높이·너비 대비 원본 밖 비율, 0~1) 추가. 계산은 `fitSpecGeometry`가 이미 가진 frame·imageSize로 — 새 산식 금지.
2. **판정**: 좌·우·아래 중 최댓값 기준 `ok / warn / block`. 위쪽은 판정에서 제외(보이지 않음). 임계 초안: warn > 3%, block > 12% — **dev 실측으로 조정**하고 근거를 표로 남긴다. block은 기존 precheck `measurable:false` + `rejectionReason:'narrow_fov'`, warn은 진행 가능 + 경고 1줄.
3. **메시지**: `lib/cms/specs-i18n.js`에 `rej_narrow_fov`·`warn_narrow_fov` 4언어(ko/ja/en/es). ko 초안 —
   - rej: "사진이 너무 가까이서 찍혔어요. 미국 비자 사진은 어깨까지 나와야 해요. 휴대폰을 조금 더 멀리 두고, 머리 위와 양어깨가 여유 있게 들어오게 다시 찍어주세요."
   - warn: "어깨 쪽이 조금 잘려 배경으로 채워질 수 있어요. 더 자연스러운 결과를 원하시면 조금 더 멀리서 다시 찍어주세요."
   어조는 기존 `rej_*`에 맞추고 표시는 `public/js/specs-funnel.js:559` 경로.
4. **적용 범위**: 판정 코드는 규격 공통이되 **노출은 us-visa 1건만**(규격 데이터 플래그 또는 슬러그 목록 1곳 정본). 다른 규격 동작 불변.
5. **검증**: 테스트 사진 3종 × 3장 이상 — 상반신 넉넉 / 셀카(팔 길이) / 얼굴 클로즈업. 사진별 `outside` 4값·판정·결과 화면 캡처·산출물 캡처를 표로. 포털·crop-engine 단위 테스트(경계값 포함) 전체 통과.

## 3. 산출물·쓰기 범위

- 코드: `monkos_AI/crop-engine/lib/crop.js`(`fitSpecGeometry` 반환 확장 한정), `monkos_AI/portal/server.js`(fit·precheck 응답), `lib/cms/specs-i18n.js`, `public/js/specs-funnel.js`, 노출 플래그 1곳. 테스트 신설 가능.
- dev 배포: portal-dev `deploy.sh dev`. crop-engine은 dev 서비스가 있으면 dev, 없으면 **배포하지 말고** 로컬 검증 + COMPLETION 명기.
- COMPLETION: `monkos-ops/ops/reports/2026-11/COMPLETION_20261102_iMac쌍아-막내N_IDPHOTO_미국비자_화각부족판정.md` — diff 요약, 임계 근거 표, 실측 표, prod 판정표(엣지 재배포 필요 여부 포함 — i18n 변경은 엣지 대상).
- 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-02_iMac_쌍아-막내N.md`, PF_IDPHOTO 히스토리 1행.
- **작업 브랜치**에서 커밋·푸시. main 병합은 쌍아.

## 4. ⚠️ 준수 조항

- **병행 작업 주의**: 같은 시각 다른 막내가 [한국여권_머리끝실측](ORDER_20261102_iMac쌍아_막내_IDPHOTO_한국여권_머리끝실측_프레임재배치.md)으로 `crop.js`·`matte.js`를 고친다. 이 건은 `fitSpecGeometry` 반환 확장만 하고 `resolvePlacement`·`matte.js`는 건드리지 않는다.
- 테스트 사진: 고객 사진 금지. 사용 허가가 명확한 공개 사진(출처 URL 기록) 또는 본인 사진. 파일 커밋 금지.
- **prod·엣지·crop-engine prod 배포 금지** — 작가님 '배포 승인' 사안.
- 법률 ch8 5조 — 문안에 없는 기능·근거 없는 수치 금지, 내부 호칭·엔진명 금지. 헌법 1조 3항 — 판정만, 보정 없음.
- 헌법 4조 1항 — 키·토큰 생성·추측·출력 금지. 패키지 설치 금지.
- 헌법 3조 1·2항 — `date` 실측 헤더, 세션 로그 append-only, 완료 보고 `✅❌💡⏳📁🔀` + 원격 SHA 대조.

## 5. 완료 기준

- [ ] `outside` 4값 계측(기존 기하 재사용)
- [ ] 좌·우·아래 기준 판정 + 임계 근거 표
- [ ] 4언어 문안, us-visa 1건만 노출
- [ ] 실측 표(3종×3장↑) + 단위 테스트 통과
- [ ] 작업 브랜치 푸시 + 원격 SHA 대조 + COMPLETION

## 6. 커밋 메시지

```
[feat] 미국 비자 화각 부족 판정 — 프레임 이탈량·narrow_fov 안내 (PF_IDPHOTO)
```
