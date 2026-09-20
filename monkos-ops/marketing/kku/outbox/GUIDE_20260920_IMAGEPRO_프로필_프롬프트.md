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

---

# 인물 프로필 사진 프롬프트 (본편 — 꾸 요청 2026-09-20)

## 문장 조립 순서 (이 순서로 쓰면 잘 알아듣는다)

`누가` → `표정` → `옷` → `배경` → `조명` → `구도/렌즈` → `분위기`

```
Professional studio portrait of a Korean woman in her early 30s,
gentle closed-lip smile, wearing a charcoal blazer over a white shirt,
plain light-grey seamless backdrop,
soft large softbox from the left with a subtle rim light,
upper-body framing, shot on 85mm f/2.0,
natural skin texture, calm and confident mood.
```
Avoid: `plastic skin, over-smoothing, heavy makeup, distorted hands, extra fingers, text, watermark, harsh shadows`
비율 `4:5` · 모델 `ultra`

> **핵심**: `natural skin texture`를 꼭 넣는다. 빼면 피부가 플라스틱처럼 나온다.

---

## 1. 비즈니스 프로필 — 남성

```
Professional studio portrait of a Korean man in his late 30s,
composed neutral expression with a slight smile,
navy suit with a white dress shirt, no tie,
deep charcoal gradient backdrop,
key light from the right at 45 degrees with soft fill,
chest-up framing, shot on 85mm f/2.0,
natural skin texture, trustworthy executive mood.
```
Avoid: `plastic skin, over-smoothing, distorted hands, text, watermark, busy background`
비율 `4:5`

## 2. 비즈니스 프로필 — 여성

```
Professional studio portrait of a Korean woman in her early 40s,
warm confident smile,
ivory blouse under a beige tailored jacket,
soft warm-grey backdrop,
beauty dish above with a reflector below,
upper-body framing, shot on 85mm f/2.0,
natural skin texture, approachable professional mood.
```
Avoid: `plastic skin, over-smoothing, heavy makeup, text, watermark`
비율 `4:5`

## 3. 링크드인·이력서용 (밝고 깔끔)

```
Clean corporate headshot of a Korean woman in her late 20s,
friendly open smile showing teeth,
light-blue shirt,
bright white seamless backdrop,
high-key lighting, two softboxes at equal power,
head and shoulders framing, shot on 105mm f/2.8,
natural skin texture, bright and open mood.
```
Avoid: `shadows on background, plastic skin, text, watermark, harsh contrast`
비율 `1:1`

## 4. 강사·작가 프로필 (분위기 있게)

```
Editorial portrait of a Korean man in his 50s,
thoughtful expression looking slightly off camera,
dark knit sweater,
deep navy textured background,
single softbox from the side creating gentle falloff,
upper-body framing, shot on 85mm f/1.8,
natural skin texture, film-like grain, warm cinematic mood.
```
Avoid: `plastic skin, over-smoothing, flat lighting, text, watermark`
비율 `4:5`

## 5. SNS 프로필 (캐주얼)

```
Natural-light portrait of a Korean woman in her mid 20s,
relaxed genuine laugh,
cream knit cardigan,
soft blurred indoor background near a large window,
warm afternoon daylight,
close-up framing, shot on 50mm f/1.4,
natural skin texture, airy and friendly mood.
```
Avoid: `studio strobe look, plastic skin, text, watermark, cluttered background`
비율 `1:1`

## 6. 가족 프로필

```
Studio family portrait of a Korean family of four,
parents in their 40s and two children, all smiling naturally,
matching beige and cream knitwear,
warm ivory seamless backdrop,
broad soft lighting with gentle shadows,
full upper-body group framing, shot on 50mm f/4,
natural skin texture, warm and gentle mood.
```
Avoid: `distorted faces, extra limbs, merged bodies, plastic skin, text, watermark`
비율 `16:9` 또는 `4:5`

---

## 바꿔 쓰는 단어표

| 바꾸고 싶은 것 | 바꿀 자리 | 예시 |
|---|---|---|
| 나이 | `in her early 30s` | `in his early 20s` / `in her 60s` |
| 표정 | `gentle closed-lip smile` | `bright open smile` / `calm neutral expression` |
| 배경색 | `light-grey seamless backdrop` | `deep navy` / `warm ivory` / `pure white` |
| 밝기 | `soft large softbox` | `high-key lighting` (밝게) / `single hard light` (강하게) |
| 얼굴 크기 | `upper-body framing` | `head and shoulders` (크게) / `three-quarter length` (작게) |
| 느낌 | `calm and confident mood` | `warm and friendly` / `cinematic and moody` |

## 잘 안 나올 때

| 증상 | 처방 |
|---|---|
| 피부가 인형같다 | 본문에 `natural skin texture, visible pores` 추가 |
| 손가락이 이상하다 | `chest-up framing`으로 바꿔 손을 화면 밖으로 |
| 얼굴이 서양인 같다 | `Korean`을 문장 맨 앞 `누가` 자리로 옮긴다 |
| 배경이 지저분하다 | Avoid에 `busy background, props, furniture` |
| 글씨가 박힌다 | Avoid에 `text, letters, watermark, logo` |
| 너무 어둡다 | `soft fill light, bright exposure` 추가 |

## 주의

- 여기서 나온 인물은 **실존 인물이 아니다.** 홍보 이미지·분위기 참고용으로만 쓰고,
  **"몽크사진관 촬영 결과물"이나 후기 사진으로 올리지 않는다** (헌법 4조 4항).
- 실제 고객 사진을 올려 바꾸는 방식(I2I)은 프롬프트 쓰는 법이 다르다. 필요하면 별도 요청.

---

# 한글판 프롬프트 (꾸 확인 2026-09-20 — 한글도 인식됨)

> 순서는 영문판과 같다: `누가` → `표정` → `옷` → `배경` → `조명` → `구도` → `분위기`
> 한글로 쓸 때는 **쉼표로 끊어** 나열한다. 줄글로 쓰면 뒷부분을 흘린다.

## 기본형

```
한국인 30대 초반 여성의 전문 스튜디오 프로필 사진,
입을 다문 부드러운 미소,
흰 셔츠 위에 차콜 그레이 재킷,
잡티 없는 밝은 회색 무지 배경,
왼쪽에서 들어오는 큰 소프트박스 조명과 은은한 윤곽광,
상반신 구도, 85mm 렌즈 조리개 2.0,
피부 결이 살아있는 자연스러운 질감, 차분하고 신뢰감 있는 분위기
```
Avoid: `플라스틱 피부, 과도한 보정, 진한 화장, 손가락 왜곡, 글씨, 워터마크, 강한 그림자`
비율 `4:5` · 모델 `ultra`

## 1. 비즈니스 프로필 — 남성

```
한국인 30대 후반 남성의 전문 스튜디오 프로필 사진,
살짝 미소 띤 차분한 표정,
넥타이 없이 흰 드레스셔츠와 네이비 정장,
짙은 차콜 그라데이션 배경,
오른쪽 45도에서 들어오는 주광과 부드러운 보조광,
가슴 위 구도, 85mm 렌즈 조리개 2.0,
피부 결이 살아있는 자연스러운 질감, 믿음직한 임원 분위기
```
Avoid: `플라스틱 피부, 과도한 보정, 손가락 왜곡, 글씨, 워터마크, 산만한 배경`

## 2. 비즈니스 프로필 — 여성

```
한국인 40대 초반 여성의 전문 스튜디오 프로필 사진,
따뜻하고 자신감 있는 미소,
아이보리 블라우스에 베이지 테일러드 재킷,
따뜻한 회색 배경,
위쪽 뷰티디시 조명과 아래 반사판,
상반신 구도, 85mm 렌즈 조리개 2.0,
피부 결이 살아있는 자연스러운 질감, 편안하고 전문적인 분위기
```
Avoid: `플라스틱 피부, 과도한 보정, 진한 화장, 글씨, 워터마크`

## 3. 링크드인·이력서용

```
한국인 20대 후반 여성의 깔끔한 기업용 증명 프로필,
치아가 보이는 밝고 친근한 미소,
하늘색 셔츠,
완전히 하얀 무지 배경,
양쪽 소프트박스를 같은 세기로 쓴 밝은 하이키 조명,
얼굴과 어깨까지 구도, 105mm 렌즈 조리개 2.8,
피부 결이 살아있는 자연스러운 질감, 밝고 열린 분위기
```
Avoid: `배경 그림자, 플라스틱 피부, 글씨, 워터마크, 강한 대비`
비율 `1:1`

## 4. 강사·작가 프로필

```
한국인 50대 남성의 매거진풍 인물 사진,
카메라 옆을 응시하는 사려 깊은 표정,
짙은 색 니트 스웨터,
질감 있는 짙은 네이비 배경,
측면에서 들어오는 소프트박스 하나로 만든 부드러운 명암,
상반신 구도, 85mm 렌즈 조리개 1.8,
피부 결이 살아있는 자연스러운 질감, 필름 그레인, 따뜻한 시네마틱 분위기
```
Avoid: `플라스틱 피부, 과도한 보정, 밋밋한 조명, 글씨, 워터마크`

## 5. SNS 프로필 (캐주얼)

```
한국인 20대 중반 여성의 자연광 인물 사진,
편안하게 활짝 웃는 표정,
크림색 니트 가디건,
큰 창가의 흐릿한 실내 배경,
따뜻한 오후 자연광,
클로즈업 구도, 50mm 렌즈 조리개 1.4,
피부 결이 살아있는 자연스러운 질감, 가볍고 친근한 분위기
```
Avoid: `스튜디오 스트로브 느낌, 플라스틱 피부, 글씨, 워터마크, 산만한 배경`
비율 `1:1`

## 6. 가족 프로필

```
한국인 4인 가족의 스튜디오 가족사진,
40대 부모와 두 자녀, 모두 자연스럽게 미소,
베이지와 크림톤으로 맞춘 니트 의상,
따뜻한 아이보리 무지 배경,
부드러운 그림자가 지는 넓은 확산 조명,
네 명 상반신이 모두 들어오는 구도, 50mm 렌즈 조리개 4.0,
피부 결이 살아있는 자연스러운 질감, 따뜻하고 포근한 분위기
```
Avoid: `얼굴 왜곡, 팔다리 추가, 신체 뭉개짐, 플라스틱 피부, 글씨, 워터마크`
비율 `16:9` 또는 `4:5`

---

## 한글로 쓸 때 주의

1. **쉼표로 끊어 나열한다.** "~하고 ~해서 ~인데" 줄글은 뒷부분을 흘린다.
2. **"~하지 마"는 본문에 쓰지 않는다.** 반드시 Avoid 칸으로.
3. **`한국인`을 맨 앞에** 둔다. 뒤로 가면 서양인 얼굴이 나온다.
4. 결과가 흔들리면 **같은 내용을 영문판으로 한 번 더** 돌려본다. 영문이 더 안정적일 때가 있다.
