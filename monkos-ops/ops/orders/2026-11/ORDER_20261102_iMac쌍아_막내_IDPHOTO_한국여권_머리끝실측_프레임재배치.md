---
type: order
date: 2026-11-02
from: iMac/쌍아
to: iMac/막내
subject: 한국 여권 두상 잘림 — 매팅 결과에서 머리끝 실측 후 프레임 재배치(헤어 가드 실경로 복원), dev 비교 검증까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 한국 여권 머리끝 실측·프레임 재배치

**[2026-11-02 17:26 KST]** iMac/쌍아 → iMac/막내

출처: 작가님 2026-11-02 16:59 iMac 쌍아 세션 사람 턴 "한국여권은 두상이 잘리는 케이스가 너무 많고 판단로직을 체크해보자" → 쌍아 원인 분석(17:00 보고) → 작가님 17:26 "a안 테스트해보자"(지시서 2건 분리·테스트). 범위 승인 = 본 문서 §2~§3(구현·dev 비교 검증·보고). **prod 배포 범위 밖.**

## 1. 원인 (쌍아 17:00 코드 분석)

- `monkos_AI/crop-engine/lib/crop.js` `resolvePlacement`: 정수리 = 눈~턱 거리 상향 미러(두개골 꼭대기 추정, 머리카락 미포함). kr-passport는 faceTarget 33mm(`portal/lib/spec-crop.js:84` 하한+1)·눈 앵커 43% → **두개골 꼭대기가 프레임 상단 2.9mm 아래**. 머리카락 볼륨(이 축척 2~4mm+)이면 잘린다.
- 헤어 가드(②, 잘릴 때 프레임 하강 + ③ 축소 루프의 헤어 체크)는 `landmarks.hairTop`이 있을 때만 작동하는데, 실사진 fit 경로는 `portal/server.js:489` `hairScan:false`(subjectTopRow가 순백 전제라 실사 배경에서 오판 — 07-07 사고). 최종 가드 `portal/lib/matte.js:110` crown은 warn-only. → **무료 경로에 머리카락 잘림 방지 장치가 0개.**

## 2. 할 일

1. **재현 먼저**: 테스트 사진 10장 이상(머리숱 많음·업스타일·짧은 머리 섞어서)으로 현행 kr-passport 산출물의 **실제 머리끝 여백(mm)**을 잰다. 측정 = 매팅 결과 알파(또는 단색 배경 합성본)에서 `subjectTopRow`류로 피사체 최상단 행 → mm. 잘림(여백 ≤0) 건수를 기록. 이 수치가 개선 전 기준선.
2. **수정 — 매팅 후 머리끝 실측 → 재배치** (fit 경로 `matteFitPipeline`):
   - 현행: fit 프레임(원본 좌표) 재단 → 매팅 → 합성.
   - 변경안: fit 프레임을 **위쪽으로 여유를 둔 확장 영역**(예: 위로 프레임 높이 25%)으로 잘라 매팅 → 알파에서 머리끝 실측 → `resolvePlacement`의 헤어 가드(② 하강, ③ faceMin까지 축소)를 실측 hairTop으로 다시 태워 최종 프레임 결정 → 재단·합성. 헤어 여백 기준은 기존 상수 `HAIR_MARGIN_RATIO`(4.4%) 그대로.
   - **배치 수학은 `resolvePlacement` 하나만 쓴다**(파일 머리 주석의 단일화 원칙). 포털 쪽에 별도 산식 만들지 말 것 — crop-engine에 "hairTop 주입 재배치" 진입점을 추가하거나 동일 모듈을 호출.
   - 미리보기(WYSIWYG)와 최종이 달라질 수 있다 → 차이가 생긴 비율을 1번 측정에 같이 기록하고, 미리보기 반영 여부는 COMPLETION에 제안만(이번 범위 밖).
   - 매팅 실패 시 기존 폴백 동작 불변.
3. **적용 범위**: 이 재배치는 규격 공통 코드지만 **dev 검증 판정은 kr-passport 기준**. 다른 규격 회귀는 us-visa·jp-passport 각 3장으로 확인.
4. **검증**: 같은 10장 이상으로 수정 전/후 표 — 사진별 머리끝 여백 mm, 두상 mm(규정 32~36 내인지), 눈 위치 %, 잘림 여부. 전후 비교 이미지 나란히(캡처 경로). 포털·crop-engine 단위 테스트 전체 통과.

## 3. 산출물·쓰기 범위

- 코드: `monkos_AI/portal/lib/matte.js`, `monkos_AI/crop-engine/lib/crop.js`(진입점 추가 한정), 필요 시 `monkos_AI/portal/server.js` fit 응답부. 테스트 신설 가능.
- dev 배포: portal-dev `deploy.sh dev`. crop-engine을 고쳤다면 crop-engine도 dev가 있으면 dev로, 없으면 **배포하지 말고** 로컬 실행으로 검증하고 COMPLETION에 명기.
- COMPLETION: `monkos-ops/ops/reports/2026-11/COMPLETION_20261102_iMac쌍아-막내N_IDPHOTO_한국여권_머리끝실측.md` — 원인 재확인, diff 요약, 전후 표, 회귀 결과, prod 판정표(배포 대상 서비스 목록).
- 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-02_iMac_쌍아-막내N.md`, PF_IDPHOTO 히스토리 1행(`scripts/pf.sh append`).
- **작업 브랜치**에서 커밋·푸시. main 병합은 쌍아.

## 4. ⚠️ 준수 조항

- **테스트 사진**: 고객 사진 금지. 사용 허가가 명확한 공개 사진(Unsplash·Pexels 라이선스, Wikimedia CC0 등 — 출처 URL 기록) 또는 본인 사진. 사진 파일은 커밋하지 않는다(경로만 기록).
- **prod·엣지 배포 금지**, crop-engine prod(`monkos-crop-engine`, asia-northeast3) 배포 금지 — 작가님 '배포 승인' 사안.
- 헌법 1조 3항 — 위치·크기 재배치만. 얼굴 보정·재생성 금지.
- 정수리 검사(`matte.js:110`)를 차단으로 켜지 말 것 — 켤지는 결과 보고 후 결정.
- 헌법 4조 1항 — 키·토큰 생성·추측·출력 금지. 패키지 설치 금지.
- 헌법 3조 1·2항 — `date` 실측 헤더, 세션 로그 append-only, 완료 보고 `✅❌💡⏳📁🔀` + 원격 SHA 대조.

## 5. 완료 기준

- [ ] 개선 전 기준선(10장↑ 머리끝 여백·잘림 건수)
- [ ] 매팅 후 실측 재배치, 배치 산식 단일 경유
- [ ] 전후 비교 표 + 나란히 이미지 + 회귀 2규격
- [ ] 단위 테스트 전체 통과
- [ ] 작업 브랜치 푸시 + 원격 SHA 대조 + COMPLETION

## 6. 커밋 메시지

```
[fix] 한국 여권 두상 잘림 — 매팅 후 머리끝 실측으로 프레임 재배치 (PF_IDPHOTO)
```
