---
type: order
date: 2026-07-16
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: 피커 — 연령 축 신설 + 청소년 카탈로그(폴로·셔츠·맨투맨) + 영유아 컬러변경 전용
status: 대기
portfolio: PF_SPECS
---

# 지시서: 피커 연령 확장 — teen 카탈로그 + baby recolor (②/② — ① 완료 후 착수)

**[2026-07-16 13:50 KST]** iMac/민아 → 막내(번호 작가님 지정)

> 작가님 방향 확정(07-16): "남녀 청소년 상의 — 폴로티·셔츠·맨투맨 정도. 영유아는 **의상 색상 변경** — 라운드 면티 연하늘·연핑크 등 **컬러 변경 위주의 선택지만**."
> **선행 지시서(타이 토글) 완료 후 착수** — 같은 프리셋 파일 충돌 방지.

## 1. 배경 (실측 기반)

- 프리셋 37종 전원 age 무태그 — **age 축이 스키마에 없음**. 데모의 age 셀렉트(성인/청소년·학생/영유아)는 자리만 있는 상태.
- 서버는 이미 4단 지원: `buildT1Prompt` SUBJECT_MAP에 baby/child/teen/adult × m/f 완비(lib/idphoto-generate.js:139) — 프리셋·피커 필터만 만들면 파이프는 통과.
- 카테고리에 폴로·맨투맨 없음(현행: suit/shirt/blouse/blazer/knit/tank/cardigan) — 2종 신설 필요.
- 규정 맥락: 흰 배경 서류사진에서 흰 상의는 거부 리스크(① 지시서의 경고와 일관) — 영유아 흰 옷 문제의 구제가 본 건의 핵심 가치.

## 2. 산출물

| 파일 | 작업 |
|------|------|
| `attire-presets.json` | age 축 + 카테고리 2종(polo·sweatshirt) + teen 아이템 + baby recolor 아이템 |
| `attire-picker.js` | age 필터 로직 + recolor 모드 렌더(스와치 칩) + UI_TEXT 보강 |
| `tools/attire-assets/generate_samples.mjs` 실행 | teen 신규 4~5장 생성·검수·적재 |
| `README.md` | age 계약·recolor 모드 명문화 |

## 3. 상세 설계

### A. age 축 신설 (하위호환 필수)
1. 스키마: `tags.age: ["adult"]` 형태 배열. **무태그 = adult 간주** — 기존 37종 무수정 하위호환.
2. 피커 필터: `opts.age`(adult|teen|baby)와 매칭. 데모 age 셀렉트 연결 확인.
3. 서버 4단(child 포함)과 피커 3단의 매핑을 README에 명기(피커 child는 teen에 흡수 — 현행 데모 기준).

### B. 청소년(teen) 카탈로그
1. **재사용 우선**: 기존 성인 셔츠 계열(white_regular_08·lightblue_regular_09 등 idpass 노출분)에 `age: ["adult","teen"]` 태깅 — 신규 생성 없이 teen 노출.
2. **신규 생성 4~5장**: 폴로(라이트블루·네이비) + 맨투맨(그레이·네이비[·블랙]). 카테고리 `polo`·`sweatshirt` 신설(labels 4언어).
3. **유니섹스 처리**: 폴로·맨투맨은 실루엣 중립 — 한 벌 생성 후 gender 양쪽 노출이 구현 간단하면 채택(생성 비용 절반), 스키마가 gender 단일 강제면 m/f 각각 생성. 결정과 근거를 COMPLETION에 기록.
4. 생성 파이프: `PROJECT_ID=monkos node tools/attire-assets/generate_samples.mjs --ids ...` → 검수(고스트 마네킹·3:4·순백, 기존 15장 레퍼런스 대조) → GCS `assets/attire/` 원본 적재 + `public/images/attire/{id}_thumb.webp`(256×343, cwebp q82) + `thumbnail`·`image_gcs` **동시 기입** (7/15 원본 적재 누락 재발 금지).
5. **RPM 주의**: 연속 생성 시 429 발생 이력 — 1장씩 순차 실행.

### C. 영유아(baby) — 컬러 변경 전용
1. **의상 교체 금지** — baby 노출 선택지는 **recolor 아이템만**: 라운드 면티 기준 연하늘·연핑크·연회색 3종 (+ "지금 옷 그대로" 디폴트 유지).
2. 스키마: `mode: "recolor"` 필드 신설(기본 "replace" 간주). recolor 아이템의 `attire_desc`는 형태 보존 명시 — 예: `"Change the color of the current top to pale blue. Keep the original garment shape, fit, and texture. Do not change the garment type."` 계열, **색만 프리셋 고정 문자열**.
3. **렌더**: recolor 아이템은 카드(실물 옷 사진) 대신 **색 스와치 칩** — 실물 카드는 "그 옷으로 교체된다"는 오해를 유발하므로 스와치가 정직. 기존 swatch 폴백 렌더 재활용(thumbnail 미기입 + swatch hex 기입으로 자연 구현되면 그 방식 채택).
4. UI_TEXT: baby 선택 시 안내 문구 4언어 — ko 기준 "아기 사진은 옷 모양은 그대로 두고 색만 바꿔드려요" 톤.
5. **안전핀**: age=baby 경로의 서버 보정 강도 확인 — buildT1Prompt의 baby SUBJECT가 정체성 보존(얼굴 변형 금지) 지시를 포함하는지 실측, 미흡 시 보고만(서버 프롬프트 수정은 별도 승인).

## 4. ⚠️ 준수 조항

- **헌법 1조 3항(정체성 보존)**: baby recolor는 형태·얼굴 불변이 제1원칙 — 검수에서 옷 형태 변형·얼굴 변화 발견 시 해당 아이템 비노출 + 보고.
- **헌법 4조 1항** / **3조 1·2항**(COMPLETION + 세션로그 + PF 히스토리).
- **ch5**: deploy.sh 경유, dev까지만 — prod는 민아 검증 후.
- **에셋 규칙**: 노출 게이트(썸네일/스와치 완비 = 노출 조건) 준수, GCS 원본·thumbnail·image_gcs 3점 세트 동시 완결.
- **프롬프트 안전**: recolor desc는 프리셋 고정 문자열만.

## 5. 완료 기준

- [ ] 데모: age=성인(현행 15종 그대로) / age=청소년(재사용 셔츠 + 신규 폴로·맨투맨 노출) / age=영유아(스와치 3종 + 그대로만 노출)
- [ ] teen 신규 에셋: 검수 통과 + GCS·thumb·프리셋 3점 완결
- [ ] baby recolor: dev 실측 1회 — 아기 사진(작가님 제공 또는 준비된 테스트 이미지)로 연하늘 변경 시 옷 형태·얼굴 보존 확인. 테스트 이미지 없으면 성인 사진으로 형태 보존만 확인 후 보고
- [ ] adult 회귀 0 (기존 15종 노출·선택·생성 동일)
- [ ] dev 배포 + COMPLETION 보고

## 6. 커밋 메시지

```
[feat] 피커 연령 축 신설 — teen 카탈로그(폴로·맨투맨) + baby 컬러변경 전용 (PF_SPECS)
```
