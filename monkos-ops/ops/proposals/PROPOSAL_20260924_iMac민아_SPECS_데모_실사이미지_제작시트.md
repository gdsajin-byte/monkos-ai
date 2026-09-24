---
type: proposal
date: 2026-09-24
device: iMac
agent: 민아
status: 작가님 확인 대기
portfolio: PF_SPECS
subject: specs 데모 목업 자리 → 실사(가상 인물 사진) 채우기 — 슬롯 목록·제작 경로·프롬프트 시트
related:
  - PROPOSAL_20260921_iMac민아_SPECS_상세페이지화_방향성
  - PROPOSAL_20260921_iMac민아_SPECS_상세페이지화_데모_kr-passport.html
  - ORDER_20260921_iMac민아_Astra_SPECS_상세페이지데모_kr-passport
---

# specs 데모 실사 채우기 — 제작 시트

**[2026-09-24 11:42 KST]** iMac/민아 → 작가님

## 0. 한 줄

성인 1인·영유아 1인, **원본 2장 + 편집 변형 11장 = 13장**이면 데모의 목업 자리가 전부 실사로 바뀐다. 제작은 **IMAGE PRO(T2I로 기준 인물 → EDIT로 변수 하나씩)**가 정답이다. 나머지 자리(크기·배경색·초점·기울기·눈 확대)는 기준 1장을 CSS·크롭으로 파생한다.

## 1. 슬롯 전수 (데모 2차 기준)

| # | 자리 | 지금 | 필요 원본 | 파생 방식 |
|---|---|---|---|---|
| A | 대표 도해(치수선) | 임시 인물(미소) | **성인 기준 1장** | — |
| B1 | 블록1 크기 ✓·✗작음·✗근접 | 임시 인물 CSS | A | CSS 배율 |
| B2 | 블록2 배경 ✓·✗색 | 임시 인물 CSS | A | CSS 틴트 |
| B3 | 블록3 조명 ✓·✗그림자·✗흐림 | 임시 인물 CSS | A + **그림자 1장** | 흐림=CSS blur |
| B4 | 블록4 표정 ✓·✗미소·✗기울기 | 도식 | A + **미소 1장** | 기울기=CSS rotate |
| B5 | 블록5 눈 ✓·✗렌즈·✗반사 | 도식 | A(눈 크롭) + **서클렌즈 1장** + **안경 반사 1장** | 눈 크롭 2장 |
| B6 | 블록6 머리·귀 ✓귀덮음·✗앞머리 | 도식 | **귀 덮는 머리 1장** + **앞머리 1장** | — |
| B7 | 블록7 가리개 ✓종교·✗모자·✗스카프 | 도식 | **히잡 1장** + **모자 1장** + **스카프 1장** | — |
| B9 | 블록9 영유아 ✓·✗손·장난감 | 도식 | **영유아 기준 1장** + **손·장난감 1장** | — |
| C | 반려 TOP5 미니 5 | 혼합 | 위 재사용 | — |
| D | 오해 교정 미니 2 | 도식 | B6 재사용 | — |
| E | 전후 짝 | 헤드샷 샘플(부적합) | **A 인물의 실내 셀카 1장** + 도구 실출력 | 도구에 셀카 투입 |
| F | 인화 시트 8칸 | 임시 인물 | A | — |

원본 생성 = **성인 12장**(A, 그림자, 미소, 렌즈, 안경반사, 귀덮음, 앞머리, 히잡, 모자, 스카프, 셀카) **+ 영유아 2장** = 13장(셀카 포함 시 14). 나머지는 파생.

## 2. 왜 IMAGE PRO인가

- 규칙 "같은 인물·변수 하나"는 **참조 이미지 편집**이어야 지켜진다. IMAGE PRO `/refine` **EDIT 모드**(`gemini-3-pro-image`, 참조 이미지 + 지시문)가 정확히 이것이다(`image-pro/backend/server.js:331`). T2I 재생성으로는 얼굴이 매번 바뀐다.
- 사내 보유·꾸 상시 사용·초상권 0(가상 인물). 실존 모델 촬영은 진행 중인 사건이 보여주듯 동의 범위 관리가 따라붙고, 2,570페이지 다국어 확장(국가별 얼굴 변형)도 못 한다.
- 비용: 시도 30~40회 기준 수 달러. 쿼터는 1콜 1이미지(병렬 N콜) — 한 번에 4장 이상 요청하지 말 것(08-27 교훈).
- GPT 앱·Astra 경로도 되지만 참조 편집 일관성은 실측 전. 첫 세트는 IMAGE PRO로 만들고, Astra 지시서는 그 결과와 비교하는 시험으로 남긴다.

## 3. 프롬프트 시트 (붙여넣기용)

**공통 금지**(모든 프롬프트 끝에): `no text, no watermark, no logo, no border, photo-realistic, natural skin texture, not a fashion model, not retouched`

### 3-1. 성인 기준 A — T2I, 비율 3:4 (IMAGE PRO 지원 비율 중 35:45에 가장 가까움 → 후처리 크롭)
```
Korean woman in her early 30s, ID photo for passport, facing straight forward, neutral expression, mouth closed, eyebrows relaxed, eyes open looking at lens, both eyebrows and full face outline visible, hair tucked behind ears, plain dark navy round-neck top, uniform pure white background, even soft frontal lighting, no shadow on face or background, head and top of shoulders, head height about 75% of frame height, sharp focus, [공통 금지]
```
4장 뽑아 규정 통과분 1장 선택(무표정·정면·흰 배경·눈썹 노출·머리 길이 71~80%). 남성 버전이 필요하면 `man` 치환 1세트 추가(선택).

### 3-2. 변형 — EDIT 모드, 참조 = A. 지시문은 **바뀌는 것 하나 + 나머지 고정** 문형
| 파일 | 지시문 |
|---|---|
| shadow | `Keep the same person, pose, clothing, framing and background. Only change the lighting: a strong light from the left creating a dark shadow on the right side of the face and a shadow on the background behind the head.` |
| smile | `Keep everything identical. Only change the expression to a wide smile showing teeth.` |
| lens | `Keep everything identical. Only change the eyes: the person wears circle contact lenses with a thick dark limbal ring and slightly enlarged blue-grey iris.` (눈 크롭용 — 출력 후 눈 부위 확대 크롭) |
| glare | `Keep everything identical. Add plain black-rimmed eyeglasses with strong white light reflection glare on both lenses partially hiding the eyes.` |
| ears | `Keep everything identical. Only change the hair: the hair is let down so it covers both ears completely, but the forehead, both eyebrows, cheeks and jawline remain fully visible.` |
| bangs | `Keep everything identical. Only change the hair: add straight thick front bangs that cover both eyebrows completely.` |
| hijab | `Keep everything identical. Add a plain dark blue hijab head covering worn every day, wrapped so that the entire face from forehead to chin is visible, no shadow on the face.` |
| hat | `Keep everything identical. Add a plain navy baseball cap.` |
| scarf | `Keep everything identical. Add a thick knitted scarf wrapped high around the neck so that it covers the chin and jawline.` |
| selfie | `Same person, same day. Change to a casual smartphone selfie taken at arm's length in a living room with warm indoor light, beige cardigan, slight smile, cluttered background with a sofa and bookshelf.` (전후 짝의 '전'. '후'는 이 셀카를 실제 도구에 넣어 나온 출력을 쓴다) |

### 3-3. 영유아 — T2I 1장 + EDIT 1장
```
Korean baby about 12 months old, ID photo, lying on a plain white cloth photographed from directly above, face straight up toward the camera, eyes open, mouth slightly open, no hands or objects visible, uniform white background, even lighting, no shadow, head height about 75% of frame height, [공통 금지]
```
EDIT: `Keep everything identical. Add an adult's hand holding the baby's shoulder from the left edge and a small colorful toy rattle near the right edge.`

## 4. 검수 게이트 (민아, 그림별 한 줄)

1. 그림 안 글자·로고 0 2. 바뀐 변수 하나뿐(옷·조명·구도 동일) 3. 합격 예시가 규정 통과 4. 실존 인물 유사성 없음·광고풍 아님 5. 35:45 크롭 후 머리 길이 71~80% 실측(정수리~턱 픽셀/세로 픽셀). 통과분만 `img/`에 WebP 700×900·≤80KB, 파일명 `kr-passport_{slot}_{ok|no}.webp`.

## 5. 삽입

이미지 13장이 폴더에 들어오면 민아가 데모의 `.ph` 배경·SVG `<use>` 자리를 `<figure><img>`로 치환(alt·width·height·lazy) — 1시간 안. 실제 템플릿 반영은 별도(쌍아 설계 → 막내).

## 6. 결정 요청

- 제작 경로: **IMAGE PRO(권고)** / Astra 지시서 경로 / GPT 앱 — 택 1 또는 병행
- 실행 주체: 꾸(IMAGE PRO 상시 사용자) / 작가님 직접 / 민아(어드민 접근 시)
- 성인 인물 성별 1종만 갈지, 남녀 2세트 갈지(2세트면 원본 24장)
