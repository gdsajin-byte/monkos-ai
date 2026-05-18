---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] 포털 i18n 통합 — 홈 SSR 언어 분기 + 크롭앱 다국어

> **[2026-03-18 15:26 KST] iMac/쌍아 → iMac/막내**
> 포털에서 JA/EN 선택 시 블로그 카드·매거진·크롭앱이 한국어 그대로인 문제 해결.
> 2건을 하나의 지시서로 일괄 처리.

---

## 문제 요약

| 영역 | 현재 | 원인 |
|------|------|------|
| 홈 블로그 카드/매거진/뉴스 | JA 선택해도 KO | home.js가 `lang === 'ko'`로 고정 필터링 |
| /crop | JA 선택해도 KO | crop.js가 i18n 미지원, 텍스트 하드코딩 |

Firestore에 JA/EN 포스트가 이미 존재하고, idphoto-jp에 일본어 크롭앱도 존재함. **데이터는 있는데 연결이 안 됨.**

---

## Task 1: 홈 SSR 언어 분기

### 1-1. home.js 수정

**파일**: `monkos_AI/portal/lib/cms/home.js`

현재 (87줄):
```javascript
const koPosts = allPosts.filter(p => p.lang === 'ko');
const displayPosts = koPosts.length > 0 ? koPosts : allPosts;
```

변경:
- `renderHome(req, res)`에서 URL 쿼리 파라미터 `?lang=` 추출
- 해당 언어로 Firestore 포스트 필터링
- 기본값: `ko`

```javascript
const url = new URL(req.url, 'http://localhost');
const lang = url.searchParams.get('lang') || 'ko';

const langPosts = allPosts.filter(p => p.lang === lang);
const displayPosts = langPosts.length > 0 ? langPosts : allPosts;
```

### 1-2. i18n.js 수정

**파일**: `monkos_AI/portal/public/js/i18n.js`

`setLang()` 함수에서 언어 변경 시 홈 페이지 리로드 추가:

```javascript
// 언어 변경 시 홈이면 lang 파라미터 붙여서 리로드
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  window.location.href = '/?lang=' + newLang;
  return;
}
```

### 1-3. server.js 라우팅 (선택)

현재 `/` 단일 라우트. 쿼리 파라미터 방식이면 라우트 변경 불필요.
다만 SEO를 위해 `/ja/`, `/en/` 경로도 추가하면 좋음 (블로그 패턴과 일관성):

```javascript
if (urlPath === '/ja' && req.method === 'GET') {
  req.url = '/?lang=ja';
  return renderHome(req, res);
}
```

→ 이 부분은 선택사항. 쿼리 파라미터 방식이 먼저 동작하면 충분.

---

## Task 2: 크롭앱 i18n

### 2-1. crop.js에 i18n 딕셔너리 내장

**파일**: `monkos_AI/portal/public/crop/crop.js`

**소스**: `monkos_AI/idphoto-jp/public/crop.js`에서 일본어 텍스트 추출

crop.js 상단에 i18n 객체 추가:

```javascript
const CROP_I18N = {
  ko: {
    passport: '여권/신분증', id: '반명함',
    upload: '정면 얼굴 사진(어깨~가슴선 노출)을 업로드하세요',
    crown: '정수리 드래그', chinLock: '턱끝 고정', scale: '스케일',
    photo: '사진 선택', reset: '초기화', preview: '미리보기', download: '다운로드',
    top: '상단', face: '얼굴', bottom: '하단', eyePos: '눈위치',
    inSpec: '규격 내', outSpec: '범위 초과',
    blocked: '다운로드 차단',
    // ... 나머지 메시지
  },
  ja: {
    passport: 'パスポート', id: '証明写真',
    upload: '正面顔写真（肩〜胸元露出）をアップロードしてください',
    crown: '頭頂ドラッグ', chinLock: '顎先固定', scale: 'スケール',
    photo: '写真選択', reset: 'リセット', preview: 'プレビュー', download: 'ダウンロード',
    top: '上部', face: '顔', bottom: '下部', eyePos: '目の位置',
    inSpec: '規格内', outSpec: '範囲超過',
    blocked: 'ダウンロード制限',
    // ... 나머지
  },
  en: {
    passport: 'Passport', id: 'ID Photo',
    upload: 'Upload a front-facing photo (shoulders visible)',
    crown: 'Crown drag', chinLock: 'Chin lock', scale: 'Scale',
    photo: 'Choose Photo', reset: 'Reset', preview: 'Preview', download: 'Download',
    top: 'Top', face: 'Face', bottom: 'Bottom', eyePos: 'Eye position',
    inSpec: 'In spec', outSpec: 'Out of range',
    blocked: 'Download blocked',
  }
};
```

### 2-2. 언어 감지

crop.js 초기화 시:

```javascript
const cropLang = localStorage.getItem('monkos_lang') || 'ko';
const t = CROP_I18N[cropLang] || CROP_I18N.ko;
```

### 2-3. 텍스트 적용

현재 하드코딩된 한국어 텍스트를 `t.xxx`로 교체:
- SPECS 객체의 label → `t.passport`, `t.id`
- 버튼 텍스트 → `t.photo`, `t.reset`, `t.preview`, `t.download`
- 알림/경고 메시지 → `t.inSpec`, `t.outSpec`, `t.blocked`
- index.html의 정적 텍스트도 JS에서 동적 교체

### 2-4. index.html 수정

**파일**: `monkos_AI/portal/public/crop/index.html`

- 정적 한국어 텍스트에 `id` 또는 `data-i18n` 속성 추가
- crop.js 로드 시 텍스트 교체

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/lib/cms/home.js` | 홈 SSR — lang 필터링 추가 |
| `monkos_AI/portal/public/js/i18n.js` | setLang() — 리로드 로직 추가 |
| `monkos_AI/portal/public/crop/crop.js` | 크롭앱 — i18n 딕셔너리 내장 |
| `monkos_AI/portal/public/crop/index.html` | 크롭앱 — 텍스트 요소 ID 추가 |
| `monkos_AI/idphoto-jp/public/crop.js` | 일본어 텍스트 **소스** (참조만) |
| `monkos_AI/portal/server.js` | 라우팅 (선택적 /ja/ 추가) |

---

## 검증

- [ ] 포털 홈 → JA 선택 → 블로그 카드/매거진/뉴스가 일본어로 표시
- [ ] 포털 홈 → EN 선택 → 영어 포스트 표시 (데이터 있는 경우)
- [ ] 포털 홈 → KO 선택 → 기존과 동일 (회귀 없음)
- [ ] /crop → JA 선택 후 진입 → 일본어 UI
- [ ] /crop → KO 기본 → 기존과 동일
- [ ] /crop → EN → 영어 UI

---

## ⚠️ 준수 조항

- 헌법 제5조 2항: 기존 디자인 정체성 보존
- 법률 ch2: 코딩 규칙 준수
- **Firestore 데이터 수정 없음** — 읽기 필터만 변경
- **기존 KO 동작 회귀 금지** — lang 파라미터 없으면 KO 기본

---

## 완료 보고

커밋 해시 + dev 배포 확인.
형식: `✅❌💡⏳📁🔀`
