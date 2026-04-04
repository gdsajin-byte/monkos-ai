---
type: order
id: ORDER_20260314_iMac쌍아_막내_포털SEO_hreflang_한국어기본
date: "2026-03-14 19:15 KST"
status: pending
from: iMac/쌍아
to: 막내
priority: P1
---

# 지시: 포털 SEO — 한국어 기본 전환 + hreflang 3서비스 양방향

## 배경

monkos.ai 포털이 `lang="ja"`, title/OG 전부 일본어로 설정되어 있어 한국에서 검색 시 일본어로 노출됨. 포털은 한국어 기본이어야 하며, 3서비스 간 hreflang 양방향 링크가 필요.

## 작업 1: portal (monkos.ai) — 한국어 기본 전환

### 1-1. index.html

**`<html lang>` 변경:**
```html
<html lang="ko">
```

**`<title>` 변경:**
```html
<title>MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진</title>
```

**`<meta description>` 변경:**
```html
<meta name="description" content="AI 실시간 코칭으로 완벽한 증명사진을 촬영하세요. 여권, 비자, 이력서, 취업사진 지원. 고품질 AI 증명사진 생성.">
```

**OG 태그 변경:**
```html
<meta property="og:title" content="MONKOS AI | AI 증명사진">
<meta property="og:description" content="AI 코치가 촬영을 실시간 가이드. 증명사진 · 여권사진 · 이력서사진 촬영.">
<meta property="og:locale" content="ko_KR">
<meta property="og:locale:alternate" content="ja_JP">
```

**hreflang 교체 (기존 3줄 → 새 3줄):**
```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/">
<link rel="alternate" hreflang="ja" href="https://idphoto-jp.monkos.ai/">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/">
```

### 1-2. thankyou.html

- `<html lang="ja">` → `<html lang="ko">`
- `<title>` → `MONKOS AI — 감사합니다`
- `<meta description>` → `MONKOS AI를 이용해주셔서 감사합니다.`
- hreflang 불필요 (noindex 페이지)

### 1-3. 나머지 포털 HTML

credits.html, privacy.html, terms.html, refund.html 등:
- `<html lang="ko">` 확인 (이미 ko면 유지)
- `<html lang="ja">` 인 파일이 있으면 `ko`로 변경
- 일본어 title/description이 있으면 한국어로 교체

## 작업 2: idphoto-jp (idphoto-jp.monkos.ai) — hreflang 추가

모든 `<head>` 섹션에 hreflang 3줄 추가 (index.html 필수, 나머지 SEO 대상 페이지):

```html
<link rel="alternate" hreflang="ja" href="https://idphoto-jp.monkos.ai/">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/">
```

- `og:locale` 누락 시 추가: `<meta property="og:locale" content="ja_JP">`
- `<html lang="ja">` 유지 (정상)

## 작업 3: idphoto-kr (idphoto-kr.monkos.ai) — hreflang 추가

모든 `<head>` 섹션에 hreflang 3줄 추가:

```html
<link rel="alternate" hreflang="ko" href="https://idphoto-kr.monkos.ai/">
<link rel="alternate" hreflang="ja" href="https://idphoto-jp.monkos.ai/">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/">
```

- `og:locale` 누락 시 추가: `<meta property="og:locale" content="ko_KR">`
- `<html lang="ko">` 유지 (정상)

## 작업 4: 3서비스 배포

```bash
# portal — deploy.sh 경유 (ch5 2조), 서비스명: monkos-portal, 리전: us-central1
cd monkos_AI/portal && ./deploy.sh prod

# idphoto-jp
cd monkos_AI/idphoto-jp && gcloud builds submit --tag gcr.io/gen-lang-client-0105707468/monkos-idphoto-jp && gcloud run deploy monkos-idphoto-jp --image gcr.io/gen-lang-client-0105707468/monkos-idphoto-jp --region asia-northeast1 --platform managed

# idphoto-kr
cd monkos_AI/idphoto-kr && gcloud builds submit --tag gcr.io/gen-lang-client-0105707468/monkos-idphoto-kr && gcloud run deploy monkos-idphoto-kr --image gcr.io/gen-lang-client-0105707468/monkos-idphoto-kr --region asia-northeast1 --platform managed
```

## 작업 5: 커밋

```
[seo] 포털 한국어 기본 전환 + 3서비스 hreflang 양방향
```

커밋 후 push.

## 검증

배포 후 확인:
1. `curl -s https://monkos.ai/ | grep -E 'lang=|hreflang|og:locale'`
2. `curl -s https://idphoto-jp.monkos.ai/ | grep -E 'lang=|hreflang|og:locale'`
3. `curl -s https://idphoto-kr.monkos.ai/ | grep -E 'lang=|hreflang|og:locale'`

## 산출물

완료 보고: `monkos-ops/ops/reports/COMPLETION_20260314_막내_{HHMMSS}.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 헌법 제4조: 포털 obfuscate.mjs가 gtag 스킵하도록 이미 보정됨 — gtag 블록 건드리지 말 것
- 법률 ch5: 배포 전 로컬 확인
