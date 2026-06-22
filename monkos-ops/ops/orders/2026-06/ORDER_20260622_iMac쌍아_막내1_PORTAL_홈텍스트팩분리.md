---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내1
status: 대기
portfolio: PF_PROFILES
---

# 지시서: 포털 홈 페이지 텍스트팩 분리 (P1-b)

## 배경
- P1-a(서버단 언어 감지 + 쿠키 통합) 배포 완료 (00322)
- 홈 페이지(`renderHome`)만 한국어 하드코딩 — 내부 페이지는 이미 i18n 텍스트팩으로 다국어 렌더링 중
- `renderHome(req, res, 'ja')`로 호출은 되지만, 내부 텍스트가 한국어 고정이라 일본어 렌더 안 됨
- 설계서: `DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md` §4 P1-b 참조

## 작업 항목

### 1. home.js — 텍스트팩(I18N) 도입

**파일**: `monkos_AI/portal/lib/cms/home.js` (510행)

render-headshot.js의 I18N 패턴을 참고하여, 홈 페이지 텍스트를 `ko/en/ja` 3개 국어로 분리:

```javascript
const I18N = {
  ko: {
    h1: '전문 스튜디오가 개발한',
    h1_accent: 'AI 증명사진',
    h1_suffix: '서비스',
    subtitle: '여권·비자·규격 대응 ✦ 링크드인·프로페셔널·이력서 헤드샷.\n셀카 한 장이면 끝.',
    badge: '✦ 200+국가 규격 검수 · ICAO 준수 · 5가지 스타일',
    stats: { countries: '200+개국', icao: 'ICAO', styles: '5가지' },
    statsLabel: { countries: '여권·비자 규격', icao: '국제 표준 준수', styles: '헤드샷 스타일' },
    // ... 기타 텍스트
  },
  en: {
    h1: 'AI ID Photos & Headshots',
    h1_accent: '',
    h1_suffix: '— Built by a Professional Studio',
    subtitle: 'Passport · Visa · ICAO-compliant ID photos.\nLinkedIn · Corporate · Creative headshots.\nOne selfie is all you need.',
    badge: '✦ 200+ country specs · ICAO compliant · 5 headshot styles',
    stats: { countries: '200+', icao: 'ICAO', styles: '5 Styles' },
    statsLabel: { countries: 'Passport & Visa Specs', icao: 'International Standard', styles: 'Headshot Styles' },
    // ...
  },
  ja: {
    h1: 'プロスタジオが開発した',
    h1_accent: 'AI証明写真',
    h1_suffix: 'サービス',
    subtitle: 'パスポート·ビザ·規格対応 ✦ LinkedIn·プロフェッショナル·履歴書ヘッドショット。\nセルフィー1枚で完了。',
    badge: '✦ 200+カ国規格検査 · ICAO準拠 · 5つのスタイル',
    stats: { countries: '200+カ国', icao: 'ICAO', styles: '5種類' },
    statsLabel: { countries: 'パスポート·ビザ規格', icao: '国際標準準拠', styles: 'ヘッドショットスタイル' },
    // ...
  },
};
```

### 2. renderHome에 lang 인자 활용

현재 `renderHome(req, res, forceLang)` 시그니처는 이미 있음. `forceLang`으로 텍스트팩 선택:

```javascript
export function renderHome(req, res, forceLang = null) {
  const lang = forceLang || req.lang || 'ko';
  const d = I18N[lang] || I18N.ko;
  // 이하 HTML 템플릿에서 하드코딩 텍스트 → d.h1, d.subtitle 등으로 교체
}
```

### 3. HTML 내 하드코딩 텍스트 교체

홈 페이지 HTML에서 한국어 문자열을 찾아 `${d.키}` 또는 `${escapeHtml(d.키)}`로 교체. 레이아웃·CSS는 변경하지 않음.

### 4. 홈 전용 네비 언어 스위처

현재 홈에만 있는 자체 언어 네비(KO·EN·JA)가 있다면 setLang() 연동 확인. 없다면 스킵(P2 범위).

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- 기존 한국어 홈 레이아웃·디자인 변경 없음 (텍스트만 교체)
- 영어/일본어 텍스트가 부자연스러우면 최소한의 번역으로 골격만 잡기 (완벽한 번역보다 구조 우선)

## 검증
- [ ] `monkos.ai/` (한국어) — 기존과 동일 (regression 없음)
- [ ] `monkos.ai/ja/` — 일본어 텍스트 표시
- [ ] `monkos.ai/en/` — 영어 텍스트 표시
- [ ] Accept-Language: ja 브라우저로 `monkos.ai/` 접속 → 일본어 렌더 (P1-a 연동)

## 대상 파일
1. `monkos_AI/portal/lib/cms/home.js` — I18N 텍스트팩 추가 + renderHome lang 적용
