---
type: proposal
date: 2026-10-08
device: M2
agent: 쌍아
status: 제출
portfolio: PF_SPECS
---

# PROPOSAL — 캐나다 비자 사진 규격 정정 (5 × 7cm → 3.5 × 4.5cm)

**[2026-10-08 11:07 KST]** M2/쌍아 → iMac/쌍아 (작가님 참조)

> **출처**: 꾸 사람 입력 턴 2026-10-08 11:05 (M2-쌍아-1003-1102 몽크사진관홈페이지 세션) "캐나다 비자 사진은 3.5 × 4.5cm가 맞습니다 고치라고 요청해". 이 문서는 요청 전달이며 승인을 새로 만들지 않는다. specs 데이터·엣지 재배포는 PF_SPECS 소관.

## 1. 문제

monkos.ai 캐나다 비자 규격 페이지가 상단 요약·규격표에서 **"5 × 7cm"**(여권 규격)를 기준으로 안내한다. 같은 페이지 FAQ는 "최소 35 × 45mm"로 정확하다. 한 페이지 안에서 기준이 둘로 읽힌다.

- 라이브 실측(2026-10-08 11:05, URL당 2회 히트 2차 판정): `https://monkos.ai/specs/visa/ca`
  - "캐나다 비자 사진 규격은 5 × 7cm, 흰색 배경, 머리 높이 3.1~3.6cm입니다." (요약)
  - 규격표 사이즈 `5 × 7cm` / 해상도 `591 × 827px`
  - 업로드 안내 "셀카 한 장이면 5 × 7cm 규격 증명사진이 완성됩니다."
  - FAQ "공식 요건은 '최소 35 × 45mm'입니다 … 50 × 70mm로 인화해도 요건을 충족합니다" (정확)

## 2. 공식 기준

IRCC [Temporary Resident Visa application photograph specifications](https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/temporary-resident-visa-application-photograph-specifications.html) (2026-10-07 WebFetch 원문):
- "The frame size must be at least 35 mm x 45 mm (1 3/8″ x 1 3/4″)."
- "The size of the head, from chin to crown, must be between 31 mm (1 1/4″) and 36 mm (1 7/16″)."
- "taken within the last six months"

여권(PPTC)은 50 × 70mm 고정이다. 비자는 하한 규정이라 5 × 7cm도 충족하지만, 기본 안내·생성 규격은 35 × 45mm가 맞다.

## 3. 데이터 실측 (값이 들어 있는 곳)

| 파일 | 현재 값 | 비고 |
|---|---|---|
| `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` | `ca-visa` size `50x70`, std `PPTC-203` | 상위 정본(PF_CROP). std도 여권 표준 |
| `apps/idpass-android/app/src/main/assets/countries.jsonl` | 같은 값(사본) | |
| `monkos_AI/portal/lib/cms/specs-data.json` | `ca-visa` size `5 × 7cm`, pixels `591 × 827px` | specs 페이지 데이터 |
| `apps/MonkosCrop/.build/.../countries.jsonl` | 빌드 산출물 | 수정 대상 아님 |

## 4. 요청

1. `ca-visa` 기본 규격을 **35 × 45mm**(3.5 × 4.5cm), 머리 31~36mm, 표준 IRCC TRV 사진 규격으로 정정. 픽셀은 300dpi 기준 413 × 531px이나, IEC·온라인 업로드 최소 420 × 540px와의 관계는 PF_SPECS가 판단
2. 상단 요약·규격표·업로드 안내 문구를 35 × 45mm 기준으로. FAQ의 "5 × 7cm(영주권·여권 크기)도 충족" 설명은 유지
3. specs-data 변경이므로 엣지 재배포(`monkos_AI/portal/edge/deploy.sh`) 필요 — 누락 시 무음 구본(references.md §배포)
4. 무료 트랙 생성기가 ca-visa로 5 × 7cm를 만들고 있다면 같이 정정

## 5. 참고

- 몽크사진관 블로그 "캐나다 비자 사진, 뒷면에 이름 씁니다"(studio_monk/224400899138)는 35 × 45mm로 정확 — 블로그와 specs가 서로 다른 규격을 안내 중
- M2 세션로그: `monkos-ops/ops/sessions/2026-10/2026-10-07_M2_쌍아.md` 18:53 항목
