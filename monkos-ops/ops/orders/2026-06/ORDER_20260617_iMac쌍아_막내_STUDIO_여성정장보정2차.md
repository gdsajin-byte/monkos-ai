---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내
portfolio: PF_STUDIO
status: 대기
---

# 지시서 — 스튜디오 여성 정장 보정 2차

> **[2026-06-17 15:15 KST] iMac/쌍아 → iMac/막내**
> 1차 복원(bc99559e) 후 작가님 실측 피드백: 블라우스 목선이 너무 파임 + 여성에게 넥타이 옵션 불필요.

## Task 1 — 여성 의상 3종 패턴 구현 (백엔드)

**대상**: `monkos_AI/studio/server.js` — `buildPromptV5()`

여성 정장 선택 시 suitColor 값으로 3종 패턴을 분기한다. 여성은 tieClause 제거.

```js
if (gender === 'f') {
  // 여성 3종 패턴
  const FEMALE_OUTFIT = {
    black: `black formal blazer with a white collared dress shirt buttoned to top`,           // 클래식 (일본 리쿠트형)
    navy: `${suit} modern business blazer with a ${shirt} neat round-neck blouse`,             // 모던 (한국 현대형)
    charcoal: `${suit} smart casual blazer with a ${shirt} relaxed professional top`,          // 프로페셔널 (링크드인형)
  };
  const outfitDesc = FEMALE_OUTFIT[suitColor] || FEMALE_OUTFIT['navy'];
  parts.push(`[OUTFIT] Dress this person in a ${outfitDesc}.`);
} else {
  const topItem = 'collared dress shirt';
  parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${topItem}${tieClause}.`);
}
```

3종 매핑:
| suitColor | 패턴 | 타겟 |
|-----------|------|------|
| **black** | 클래식 — 블랙 자켓 + 흰색 칼라 셔츠 단추 끝까지 | 공채, 보수적 기업, 일본 |
| **navy** (기본) | 모던 — 네이비 블레이저 + 깔끔한 라운드넥 블라우스 | 일반 취업, 이직 |
| **charcoal** | 프로페셔널 — 차콜 스마트캐주얼 블레이저 + 자연스러운 톤 | 링크드인, IT/스타트업 |

핵심: 여성 분기에서 `${tieClause}` 완전 제거. 남성은 현행 유지.

## Task 2 — UI 넥타이 숨김 (프론트)

**대상**: `monkos_AI/studio/public/app.html`

gender === 'f' 선택 시 넥타이 옵션 섹션을 숨김 처리. gender === 'm' 선택 시 다시 표시.

방법: 넥타이 섹션에 id 부여 (또는 기존 id 확인) → gender 선택 이벤트에서 display toggle.

## Task 3 — 배포 + 테스트

- `deploy.sh` 경유 스튜디오 배포
- **6건 생성 테스트** (동일 여성 사진으로):
  1. 여성 + 정장 + **블랙** → 클래식 (칼라 셔츠 단추 끝까지, 일본 리쿠트형)
  2. 여성 + 정장 + **네이비** → 모던 (라운드넥 블라우스, 한국 현대형)
  3. 여성 + 정장 + **그레이** → 프로페셔널 (스마트캐주얼, 링크드인형)
  4. 남성 + 정장 + 네이비 + 넥타이 → 기존과 동일 확인 (regression 없음)
  5. 여성 + 캐주얼 → 변경 없음 확인
  6. 여성 + 정장 → UI에서 넥타이 섹션 숨김 확인
- 6건 Before/After 스크린샷을 보고서에 포함

## ⚠️ 준수 조항

- 스튜디오만 수정. idphoto-kr/jp 수정 금지
- 배포: `deploy.sh` 경유 (ch5 2조)

## 완료 기준

- [ ] 여성 3종 패턴 분기 (black=클래식 / navy=모던 / charcoal=프로페셔널)
- [ ] 여성 tieClause 완전 제거
- [ ] 프론트 넥타이 섹션 gender별 토글
- [ ] 배포 + 6건 테스트 스크린샷
