---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내
portfolio: PF_STUDIO
status: 대기
---

# 지시서 — 스튜디오 여성 의상 3종 패턴 + 넥타이 분리

> **[2026-06-17 15:33 KST] iMac/쌍아 → iMac/막내**
> 1차 복원(bc99559e) 후 작가님 실측 피드백: silk blouse 목선 과도 노출 + 여성에게 넥타이 불필요 + 한국/일본/링크드인 3종 패턴 분기 필요.

## 배경

작가님 실측 결과:
- 1차 복원의 `silk blouse`가 V넥으로 파여서 증명사진에 부적절
- 여성 취업사진 패턴은 크게 3가지: 일본 리쿠트 스츠(칼라 셔츠) / 한국 모던(라운드넥 블라우스) / 링크드인(비즈니스 캐주얼)
- 여성에게 넥타이 옵션은 불필요 — UI에서 숨김 + 프롬프트에서 제거

## Task 1 — 여성 의상 3종 패턴 (백엔드)

**대상**: `monkos_AI/studio/server.js` — `buildPromptV5()` 여성 suit 분기

1차에서 넣은 여성 분기를 아래로 교체:

```js
if (gender === 'f') {
  const FEMALE_OUTFIT = {
    black: `black formal blazer with a white collared dress shirt buttoned to top`,
    navy: `${suit} modern business blazer with a ${shirt} neat round-neck blouse`,
    charcoal: `${suit} smart casual blazer with a ${shirt} relaxed professional top`,
  };
  const outfitDesc = FEMALE_OUTFIT[suitColor] || FEMALE_OUTFIT['navy'];
  parts.push(`[OUTFIT] Dress this person in a ${outfitDesc}.`);
} else {
  const topItem = 'collared dress shirt';
  parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${topItem}${tieClause}.`);
}
```

| suitColor | 패턴 | 레퍼런스 |
|-----------|------|---------|
| **black** | 클래식 — 블랙 블레이저 + 흰색 칼라 셔츠 단추 끝까지 | 일본 리쿠트 스츠, 한국 공채 |
| **navy** (기본) | 모던 — 네이비 블레이저 + 라운드넥 블라우스 | 한국 현대 취업사진 |
| **charcoal** | 프로페셔널 — 차콜 스마트캐주얼 블레이저 + 자연스러운 톤 | 링크드인, IT/스타트업 |

핵심: 여성에서 `${tieClause}` 완전 제거. 남성은 현행 유지.

## Task 2 — UI 넥타이 숨김 (프론트)

**대상**: `monkos_AI/studio/public/app.html`

- gender === 'f' 선택 시 넥타이 옵션 섹션 숨김 (display: none)
- gender === 'm' 선택 시 넥타이 섹션 다시 표시
- gender 선택 이벤트 리스너에서 toggle

## Task 3 — 배포 + 6건 테스트

`deploy.sh` 경유 스튜디오 배포 후 **동일 여성 사진**으로 6건 테스트:

| # | 조건 | 기대 결과 |
|---|------|----------|
| 1 | 여성 + 정장 + **블랙** | 클래식: 블랙 블레이저 + 칼라 셔츠 단추 끝까지 |
| 2 | 여성 + 정장 + **네이비** | 모던: 네이비 블레이저 + 라운드넥 블라우스 |
| 3 | 여성 + 정장 + **그레이** | 프로페셔널: 차콜 블레이저 + 자연스러운 톱 |
| 4 | 남성 + 정장 + 네이비 + 넥타이 | 기존과 동일 (regression 없음) |
| 5 | 여성 + 캐주얼 | 변경 없음 확인 |
| 6 | 여성 + 정장 선택 | UI에서 넥타이 섹션 숨김 확인 |

- 6건 Before/After 스크린샷을 보고서에 포함

## ⚠️ 준수 조항

- **스튜디오만** 수정·배포. idphoto-kr/jp 수정 금지
- 배포: `deploy.sh` 경유 (ch5 2조)
- 시크릿 생성/추측 금지 (헌법 4조 1항)

## 완료 기준

- [ ] 여성 3종 패턴 분기 (black=클래식 / navy=모던 / charcoal=프로페셔널)
- [ ] 여성 tieClause 완전 제거
- [ ] 프론트 넥타이 섹션 gender별 토글
- [ ] 스튜디오 배포 완료
- [ ] 6건 테스트 스크린샷 포함 보고
