---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "specs-data.json 공통 FAQ·seoTitle·countryJa 일괄 보강 — 색인 장애 해소 P0"
status: 발행
portfolio: PF_SPECS
priority: 즉시
---

# 지시서 — specs 공통 FAQ + seoTitle + countryJa 일괄 보강

> **[2026-06-15 14:47 KST] iMac/쌍아 → iMac/막내**
> 작가님 지시: 공통 FAQ 위주로 일단 배포, 모호한 건 차감. 점진적 데이터 구성.
> 근거: 막내3 전수 감사 — 색인 장애 근본원인 R1(FAQ 98% 부재)·R2(seoTitle 99% 동일패턴)·R3(JA 한국어 잔류 21건)

---

## 배경

구글이 specs 1,335 URL 중 극소수만 색인하는 근본원인:
- FAQ 없음 → 페이지 깊이 부족 (thin content)
- seoTitle 동일 패턴 반복 → boilerplate 판정
- JA countryJa 미설정 → 제목에 한국어 노출 → 언어 불일치

## 임무

### 1. 공통 FAQ 일괄 삽입 (423건 — FAQ 미보유 건 전수)

기존 9건(레거시)은 건드리지 않음. 나머지 436건 중 faqs가 빈 건에 공통 FAQ를 삽입.

**공통 FAQ (3개 언어 세트):**

specs-data.json의 각 문서 데이터(size, background, type, country 등)를 활용하여 **해당 국가 규격에 맞는 구체적 답변**을 생성한다.

```json
{
  "ko": [
    {
      "q": "{country} {type} 사진 크기는?",
      "a": "{country} {type} 사진 규격은 {size}입니다. 배경은 {background}이어야 합니다."
    },
    {
      "q": "{country} {type} 사진을 집에서 찍을 수 있나요?",
      "a": "네, 규격({size})과 배경({background}) 조건만 맞으면 셀프 촬영이 가능합니다. MONKOS AI를 사용하면 배경 제거와 규격 크롭을 자동으로 처리합니다."
    },
    {
      "q": "{country} {type} 사진 배경색 규정은?",
      "a": "{country} {type} 사진은 {background} 배경이 필요합니다. 그림자나 무늬가 있으면 반려될 수 있습니다."
    }
  ],
  "en": [
    {
      "q": "What size is a {countryEn} {typeEn} photo?",
      "a": "The {countryEn} {typeEn} photo size is {size}. The background must be {backgroundEn}."
    },
    {
      "q": "Can I take a {countryEn} {typeEn} photo at home?",
      "a": "Yes, as long as you meet the size ({size}) and background ({backgroundEn}) requirements. MONKOS AI automatically removes the background and crops to the correct specs."
    },
    {
      "q": "What is the background color for a {countryEn} {typeEn} photo?",
      "a": "A {countryEn} {typeEn} photo requires a {backgroundEn} background. Shadows or patterns may cause rejection."
    }
  ],
  "ja": [
    {
      "q": "{countryJa} {typeJa}写真のサイズは？",
      "a": "{countryJa} {typeJa}写真の規格は{size}です。背景は{backgroundJa}が必要です。"
    },
    {
      "q": "{countryJa} {typeJa}写真を自宅で撮れますか？",
      "a": "はい、サイズ（{size}）と背景（{backgroundJa}）の条件を満たせば自宅撮影も可能です。MONKOS AIを使えば背景除去と規格クロップが自動で処理されます。"
    },
    {
      "q": "{countryJa} {typeJa}写真の背景色の規定は？",
      "a": "{countryJa} {typeJa}写真は{backgroundJa}の背景が必要です。影や模様があると不合格になる場合があります。"
    }
  ]
}
```

**주의:**
- `{country}`, `{countryEn}`, `{countryJa}` 등은 해당 문서의 실제 필드값으로 치환
- countryJa가 없는 건은 먼저 2번(countryJa 보강)을 선행
- typeEn/typeJa가 없는 건은 type 필드에서 매핑 (여권→Passport/パスポート, 비자→Visa/ビザ 등)
- **모호하거나 데이터가 부족한 답변은 생성하지 않음** — size·background가 비어있으면 해당 Q&A 스킵

### 2. countryJa 26건 보강

countryJa가 비어있는 26건에 일본어 국가명 삽입.

방법: countryEn 기반으로 일본어 매핑 (한국→韓国, 유럽→ヨーロッパ, 호주→オーストラリア 등).

### 3. seoTitle·seoDescription 자동생성 (442건)

기존 3건(레거시)은 건드리지 않음. 나머지 442건에:

```
seoTitle:
  ko: "{country} {type} 사진 규격 {size} — 배경·복장 가이드 | MONKOS"
  en: "{countryEn} {typeEn} Photo Size {size} — Background & Dress Code | MONKOS"
  ja: "{countryJa} {typeJa}写真規格 {size} — 背景・服装ガイド | MONKOS"

seoDescription:
  ko: "{country} {type} 사진 규격({size}, {background}). 규정·촬영 팁·AI 자동 크롭까지."
  en: "{countryEn} {typeEn} photo specs ({size}, {backgroundEn}). Requirements, tips & AI auto crop."
  ja: "{countryJa} {typeJa}写真規格（{size}、{backgroundJa}）。規定・撮影のコツ・AI自動クロップ。"
```

**seoTitle/seoDescription 필드가 specs-data.json에 없으면 신설.** 기존 ko/en/ja 분리 또는 단일 필드 — render-specs.js에서 어떻게 참조하는지 확인 후 결정.

### 4. JA 한국어 잔류 해소 (R3·R4)

- countryJa 26건 보강 (2번)으로 R3 해소
- `kr-visa` details.en/ja에 "출입국관리법" → "Immigration Control Act" / "出入国管理法"
- `kr-license` details.en/ja에 "도로교통법" → "Road Traffic Act" / "道路交通法"
- `uk-passport` resolution 필드 "인화"/"디지털" → "Print"/"Digital" / "印刷"/"デジタル"

### 5. 검증

- FAQ 삽입 후 커버리지 재측정 (목표: 98%+)
- seoTitle 고유성 확인 (중복 0건)
- JA 한국어 잔류 0건 확인
- prod 실측 3건: 임의 국가 ko/en/ja 페이지에서 FAQ·title·한국어 검증

### 6. 배포

- deploy.sh 경유 monkos.ai 배포

---

## 산출물

1. specs-data.json 보강 (FAQ·seoTitle·seoDescription·countryJa)
2. 변환 스크립트 (재사용 가능)
3. COMPLETION 보고서
4. PF_SPECS 히스토리 1행 어펜드
5. 커밋 → 배포

---

## ⚠️ 준수 조항

- 기존 9건(레거시) FAQ 덮어쓰기 금지
- 기존 3건 seoTitle 덮어쓰기 금지
- 모호한 데이터로 FAQ 생성 금지 — 확실한 필드값만 사용
- ch5 2조: 배포는 deploy.sh 경유
- 헌법 4조 2항: 파괴적 명령 금지
