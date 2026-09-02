---
type: order
date: 2026-09-02
device: iMac
agent: 쌍아
recipient: iMac/막내1
subject: "출력본 노출(밝기) 저하 — ICC 프로파일 소실 규명·보정"
status: 발행
portfolio: PF_PORTAL
priority: P0
---

# 지시서 — 출력본 노출 저하 (ICC 프로파일 소실)

**[2026-09-02 18:25 KST]** iMac/쌍아 → iMac/막내1

> 현상: **원본 대비 출력본이 어둡고 물빠진 톤.** 작가님 관찰(08-31~09-01), 간헐 발현
> 선행 진단: 09-01 민아 — 매팅 폴백 가설 **기각**(문제 건은 매팅 정상 완료, `via=runpod`), 유력 진범은 **정규화 재인코딩의 ICC 프로파일 소실**
> ⚠️ **유료 경로 포함.** 헌법 4조 + ch1 7조 2항(프로덕션 표면) 대상이다.

## ⚠️ 준수 조항

- **① 재현 확정 전 코드 수정 금지.** P3 테스트 이미지로 현상을 먼저 재현하라. 재현 실패 시 **중단하고 보고** — 가설이 틀린 것이다
- **② 모집단부터 센다.** 작가님은 무료 출력본에서 관찰했으나 `normalizeImage`는 **전 생성 경로의 입구**다(아래 §1). "무료만"으로 좁히지 말 것. `feedback_single_finding_to_pattern` 적용
- **③ 유료 출고물 영향 건이다.** 배포 전 dev 검증 + 실이미지 육안 대조 필수. `feedback_paid_failure_no_degraded_delivery` — 무음 강등 출고 금지
- **④ 라이브 판정은 ch5 7조 준수.** 비멱등 생성 엔드포인트이므로 2회 히트 금지 — 로그·실출력물 직접 대조로 판정
- **⑤ 배포는 ch5 6조 게이트 준수.** `deploy.sh` 경유
- 완료: COMPLETION 보고서 + 세션 로그 + PF_PORTAL 히스토리 1행 + 커밋·푸시

## 1. 실측된 사실 (쌍아, 2026-09-02 18:24)

**대상 코드**: `monkos_AI/portal/server.js` `normalizeImage()` (71행~)

```js
const buf = await sharp(raw)
  .rotate()
  .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 90 })
  .toBuffer();
```

`withMetadata()`·ICC 변환·`toColourspace` **전부 없음.**

**소비처 3곳 — 전 생성 경로의 입구다**

| 호출 위치 | 라우트 |
|---|---|
| `server.js:408` | `/api/idphoto/fit` |
| `server.js:559` | `/api/idphoto/precheck` |
| **`server.js:795`** | **`/api/idphoto/generate`** ← 출고물 생성. 무료·유료 공통 |

**2차 후보**: `lib/matte.js:216` `stampMatteResult()` 의 `.withMetadata({ density: 300 })` — density만 지정하고 ICC는 없다. 합성부에서 2차 손실이 나는지 함께 볼 것. `crop-engine`의 동일 패턴 4곳(`server.js:201`, `lib/crop.js:157·223·312`)도 같은 계열이므로 점검 대상.

## 2. 작업

### Phase A — 재현 (코드 수정 없음, 선행 필수)

1. **Display-P3 테스트 이미지 확보** — 아이폰 촬영본(P3 태그 보유). `sharp(input).metadata()` 로 `icc` 필드 존재 확인
2. 위 파이프라인만 격리 실행 → 출력의 ICC 유무·픽셀값 변화 실측
3. **대조군 3종**: ⓐ sRGB 원본(P3 아님) 통과 시 변화 없어야 함 ⓑ P3 원본 통과 시 변화 발생 ⓒ 원본 그대로 저장본과 재인코딩본 픽셀 히스토그램 비교
4. **관리자 화면 좌우 대조 재현**: 좌(원본 저장본, 프로파일 보존) vs 우(재인코딩본). 민아 진단의 근거였다
5. **판정**: 재현되면 Phase B. 재현 안 되면 **중단·보고** (2차 계열 = 폴백 시 Gemini 재생성의 생성형 톤 변형을 별도 조사)

### Phase B — 보정 (재현 확정 시에만)

- `normalizeImage`에 **ICC 처리 추가**. sRGB 명시 변환이 정석이나 **정확한 API는 실측으로 정하라** — `withMetadata({ icc: 'srgb' })` / `pipelineColourspace()` / `toColourspace()` 는 sharp에서 의미가 다르다. **문서 인용이 아니라 실행 결과로 결정할 것**
- 원본 프로파일 **보존**과 sRGB **변환** 중 어느 쪽이 옳은지 판단해 근거를 보고에 남길 것. (출고물이 인화·타 기관 제출용이므로 sRGB 변환이 유력하나 단정하지 않는다)
- `matte.js` 합성부·`crop-engine` 4곳도 동일 결함이면 함께 보정. 아니면 "해당 없음" 근거 기재

### Phase C — 검증

1. P3 원본 → 전 파이프라인 통과 → 출력물 육안 + 히스토그램 대조. **Phase A의 어두움이 사라져야 한다**
2. sRGB 원본 **회귀 없음** 확인 (기존 정상 케이스가 망가지지 않을 것)
3. `/api/idphoto/generate` 실호출 1회 — 무료 트랙으로 검증하고 **유료 크레딧 소모 금지**
4. 배포 후 실출력물 1건 확보하여 배포 전후 대조

## 3. 산출

- `COMPLETION_20260902_iMac막내1_출력본노출저하_ICC.md`
- Phase A 재현 증거(메타데이터 덤프 + 히스토그램 수치)를 보고서에 **수치로** 기재. "어두워 보인다"는 판정이 아니다

## 4. 참고

- 09-01 민아 진단 원문: `monkos-ops/ops/sessions/2026-09/2026-09-01_iMac_민아.md` 21:17 어펜드
- 매팅 폴백 가설은 **이미 기각**됐다. 20:33 문제 건은 매팅 정상 완료였다. 폴백 쪽으로 다시 가지 말 것
