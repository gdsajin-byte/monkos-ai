---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내
portfolio: PF_STUDIO, PF_IDPHOTO
status: 대기
---

# 지시서 — 스튜디오 여성 정장 복원 + 프롬프트 보강

> **[2026-06-17 14:22 KST] iMac/쌍아 → iMac/막내**
> 스튜디오(studio.monkos.ai)에서 먼저 수정·배포·품질 검증 후 라이브(idphoto-kr/jp) 적용 예정. 본 지시서는 스튜디오만 대상.

## 배경

- 3/2 v5 리라이트 시 `buildPromptV5()`에 `gender === 'f' ? 'blouse' : 'dress shirt'` 분기가 정확히 구현돼 있었음
- 3/12 `d7038907` 커밋에서 "셔츠 프롬프트 보정"으로 성별 분기 제거, `'collared dress shirt'` 하드코딩 — **regression**
- 결과: 여성이 정장 선택 시 남성 패턴(칼라 드레스셔츠+재킷) 출력
- 스튜디오에는 `OUTFIT_KEYWORDS`에 성별별 17종 프리셋이 정의돼 있으나 **미연결 dead code**

## Task 1 — buildPromptV5() 여성 정장 복원

**대상**: `monkos_AI/studio/server.js`

**현행 (line 272)**:
```js
const top = 'collared dress shirt';
```

**수정 — 3/2 원본 복원 + 확장**:
```js
// 여성: blazer + blouse 패턴, 남성: suit + dress shirt 패턴
if (gender === 'f') {
  const topItem = 'silk blouse';
  parts.push(`[OUTFIT] Dress this person in a ${suit} formal business blazer with a ${shirt} ${topItem}${tieClause}.`);
} else {
  const topItem = 'collared dress shirt';
  parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${topItem}${tieClause}.`);
}
```

핵심 변경:
- 여성: `suit` → `blazer`, `dress shirt` → `silk blouse`
- 남성: 현행 유지
- 넥타이 절(tieClause): 여성도 코드상 넥타이 선택 가능하지만, 프롬프트에 포함은 유지 (UI에서 gender별 필터링은 별도 과제)

## Task 2 — 부수 버그 수정 2건

막내1 전수조사에서 발견된 건:

**2-A: "this child" 호칭 버그**

현행 (line 298):
```js
} else if (clothing === 'change') {
  parts.push(`[OUTFIT] Dress this child in a clean ${clothingColor || 'white'} top, age-appropriate and neat.`);
```

`clothing === 'change'`는 아동 전용 의도인데, 성인이 이 값을 보내면 "this child"로 호칭. 서버 가드 추가:

```js
} else if (clothing === 'change') {
  const isChild = (age === 'baby' || age === 'child');
  const subject = isChild ? 'this child' : 'this person';
  parts.push(`[OUTFIT] Dress ${subject} in a clean ${clothingColor || 'white'} top, ${isChild ? 'age-appropriate and ' : ''}neat.`);
```

**2-B: 비논리 조합 서버 검증**

`buildPromptV5()` 진입 시 기본 가드 추가:
```js
// baby/child + suit/casual 비논리 조합 방어
if ((age === 'baby' || age === 'child') && clothing === 'suit') {
  clothing = 'default';
}
```

## Task 3 — 배포 + 스튜디오 검증

1. `monkos_AI/studio/deploy.sh` 경유 배포
2. 배포 후 studio.monkos.ai에서 직접 테스트:
   - **여성 + 성인 + 정장 + 네이비 + 노타이** → blazer + blouse 패턴 확인
   - **여성 + 성인 + 정장 + 그레이 + 노타이** → 동일
   - **남성 + 성인 + 정장 + 네이비 + 네이비 넥타이** → 기존과 동일 확인 (regression 없음)
   - **여성 + 성인 + 캐주얼** → 변경 없음 확인
3. Before/After 스크린샷 보고서에 포함

## ⚠️ 준수 조항

- **스튜디오만 수정·배포**. idphoto-kr/jp는 수정하지 말 것
- 배포: `deploy.sh` 경유 (ch5 2조)
- 프롬프트 내용은 내부 기밀 (헌법 4조 3항)
- 시크릿 생성/추측 금지 (헌법 4조 1항)

## 완료 기준

- [ ] buildPromptV5 gender 분기 복원 (여성 blazer+blouse / 남성 suit+dress shirt)
- [ ] "this child" 호칭 버그 수정
- [ ] baby+suit 비논리 조합 가드
- [ ] 스튜디오 배포 완료
- [ ] 여성 정장 생성 테스트 — Before/After 스크린샷 포함 보고
- [ ] 남성 정장 regression 없음 확인
