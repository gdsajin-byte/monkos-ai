---
type: completion
date: 2026-07-16
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
order: ORDER_20260716_iMac민아_막내_PICKER_연령확장_틴베이비.md
---

# COMPLETION: 피커 연령 축 신설 — teen 카탈로그 + baby 컬러변경 전용

**[2026-07-16 14:18 KST]** iMac/막내3 → 작가님

## 산출물

| 파일 | 작업 |
|------|------|
| `attire-presets.json` | age 축(tags.age 배열) + 카테고리 2종(polo·sweatshirt) + teen 아이템 4종(유니섹스) + baby recolor 아이템 3종(mode:"recolor") + 기존 셔츠 2종 teen 태깅 |
| `attire-picker.js` | ageMatch → tags.age 배열 기반, recolor 노출 게이트, babyGuide UI_TEXT 4언어 |
| `attire-picker.css` | .atp-baby-guide 스타일 추가 |
| `generate_samples.mjs` | unisex 프롬프트 처리 + recolor 대상 제외 필터 |
| `README.md` | age 축·recolor 모드 계약 명문화 |
| 에셋 4종 | GCS 원본 + 256×343 thumb.webp + 프리셋 image_gcs 3점 완결 |

## 설계 결정

### 유니섹스 채택 (지시서 3-B-3)
폴로·맨투맨은 실루엣 중립 → `gender: "unisex"` 채택. 한 벌 생성으로 남녀 양쪽 노출. 생성 비용 절반(4장 → 8장 효과).
- 근거: 기존 스키마에 `gender: "unisex"` 필터 이미 구현(visibleItems에서 unisex는 양쪽 통과). 고스트 마네킹 사진도 성별 중립.

### ageMatch 리팩토링
기존 `age_range` 문자열 기반("teen-20s" 패턴 매칭) → `tags.age` 배열 기반으로 전환.
- 하위호환: `tags.age` 미기입 아이템은 `["adult"]` 간주 — 기존 37종 무수정.
- 서버 4단(adult/teen/child/baby) ↔ 피커 3단(adult/teen/baby) 매핑: child는 teen에 흡수 (현행 데모 기준).

### baby recolor 렌더
thumbnail 미기입 + swatch.primary 기입 → 기존 스와치 폴백 렌더 자연 구현. 별도 렌더 로직 불필요.
- 노출 게이트 보정: `mode === "recolor"` 아이템은 thumbnail 없어도 통과.

## 에셋 생성 내역

| ID | 검수 | 파일 크기 | GCS | Thumb |
|----|------|----------|-----|-------|
| u_polo_lightblue_teen_01 | ✅ 고스트 마네킹·순백·무로고 | 1,382KB | ✅ | ✅ 3.3KB |
| u_polo_navy_teen_02 | ✅ 동일 기준 통과 | 1,477KB | ✅ | ✅ 3.0KB |
| u_sweat_gray_teen_03 | ✅ 크루넥·무로고 | 1,992KB | ✅ | ✅ 12.5KB |
| u_sweat_navy_teen_04 | ✅ 동일 기준 통과 | 1,386KB | ✅ | ✅ 2.6KB |

RPM 429 1회 발생 (3번째 생성 시) → 재시도 성공.

## 안전핀 점검 (서버 baby 프롬프트)

- `IDENTITY_PRESERVATION_BABY`: 95% 동일 아동 보존 (얼굴·비율·표정 명시 보존)
- baby 표현: "Keep the child's natural expression exactly as-is" (성인 mouth-closed 미적용)
- recolor desc는 고정 문자열 → [OUTFIT] 채널에 투입, 프롬프트 인젝션 표면 없음
- **결론: 서버 프롬프트 수정 불필요. 안전성 양호.**

## 완료 기준 대조

- [x] 데모: age=성인(14종 — ①에 의한 tie 비활성화 반영) / age=청소년(6종) / age=영유아(스와치 3종 + 그대로)
- [x] teen 신규 에셋: 검수 통과 + GCS·thumb·프리셋 3점 완결 (4/4)
- [ ] baby recolor dev 실측: 테스트 이미지 미보유 — **수동 브라우저 테스트 필요** (dev URL에서 age=영유아 → 연하늘 선택 → 생성)
- [x] adult 회귀 0 (② 변경에 의한 기존 아이템 영향 없음)
- [x] dev 배포 rev `monkos-portal-dev-00139-kz8`

## 배포

- dev: `monkos-portal-dev-00139-kz8` — `./deploy.sh dev` 경유
- prod: 민아 검증 후 (지시서 준수)

## 참고

- ①(타이 토글) 막내2 작업과 동시 진행. 작업 트리에 ①+② 변경사항 공존. 커밋은 ① 선행 후 ② 순서 권장.
- 기존 baby replace 아이템 3종(b_shirt_skyblue_01 등)은 inactive 유지 — 삭제 아닌 보존.
