---
type: guide
date: 2026-09-20
from: M2/쌍아
to: 꾸
subject: "IMAGE PRO 프로필 상품 홍보용 프롬프트 모음"
portfolio: PF_KKU
status: 전달
---

**[2026-09-20 16:16 KST]** M2/쌍아 → 꾸

# IMAGE PRO 프로필 프롬프트

## 쓰기 전에 (지난번 "말을 잘 못 알아듣는다" 원인)

1. **영어로 쓴다.** 한글 프롬프트는 자주 어긋난다.
2. **한 문장에 한 가지만.** 길게 이어 쓰면 뒤쪽을 버린다.
3. **금지할 것은 Avoid 칸(negativePrompt)에.** 본문에 "~하지 마"라고 쓰면 오히려 그걸 그린다.
4. **모델**: 홍보물은 `ultra`(gemini-3-pro-image), 시안 뽑을 땐 `fast`.
5. **비율**: 인스타 정사각 `1:1` / 인스타 세로 `4:5` / 블로그 대표 `16:9` / 스토리 `9:16`

---

## 1. 프로필 상품 — 스튜디오 분위기 컷 (인스타 피드)

```
Editorial photography studio interior, single softbox lighting a seamless
light-grey backdrop. A wooden stool and a folded charcoal blazer on it.
Warm neutral color grading, shallow depth of field, calm premium mood.
No people. Shot on 85mm, f/2.0.
```
Avoid: `text, watermark, logo, cluttered props, harsh shadows, oversaturated`
비율 `4:5` · 모델 `ultra`

## 2. 비즈니스 프로필 — 무드 컷 (링크드인·명함 소구)

```
Close-up of a crisp white dress shirt collar and a navy blazer lapel on a hanger,
studio rim light from the left, deep grey background, minimal and confident mood.
No face, no person.
```
Avoid: `face, hands, text, logo, wrinkles, dust`
비율 `1:1` · 모델 `ultra`

## 3. 가족사진 — 따뜻한 배경 컷

```
Empty photography studio set for a family portrait: warm beige backdrop,
soft diffused daylight, a low bench, a knitted blanket in cream tone.
Cozy, gentle, film-like color. No people.
```
Avoid: `people, faces, toys, text, neon, heavy vignette`
비율 `16:9` · 모델 `ultra`

## 4. 블로그 대표 이미지 — 규격 안내 글용

```
Flat lay on a matte grey desk: a passport, a printed 35x45mm photo sheet,
a ruler, and a pen, arranged neatly. Top-down view, soft even lighting,
clean editorial look, generous empty space on the right for text.
```
Avoid: `text, letters, numbers, watermark, hands, clutter`
비율 `16:9` · 모델 `ultra`

## 5. 인스타 카드뉴스 배경 (글씨 올릴 용도)

```
Minimal gradient background in warm ivory and soft grey, subtle paper texture,
large empty center area, soft top-left light falloff.
```
Avoid: `text, objects, patterns, high contrast, noise`
비율 `1:1` · 모델 `fast`

---

## 손볼 때 바꾸는 단어

| 바꾸고 싶은 것 | 바꿀 단어 |
|---|---|
| 더 밝게 | `soft diffused daylight` → `bright airy high-key lighting` |
| 더 고급스럽게 | `premium` → `luxury editorial, muted tones` |
| 배경색 | `light-grey backdrop` → `deep navy backdrop` 등 |
| 계절감 | 문장 끝에 `autumn mood, warm amber tones` 추가 |

## 하지 말 것

- **AI로 만든 인물 사진을 "몽크사진관 촬영 결과물"로 올리지 않는다.** 포트폴리오·후기는 실제 촬영분만. (헌법 4조 4항)
- 사람 얼굴이 나오는 홍보 이미지는 초상권 문제가 생기므로 **사람 없는 컷**으로 쓴다.
