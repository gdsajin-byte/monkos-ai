---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: JP 크롭앱 클론 — KR crop.html/js/css 복사 + 일본어 번역
priority: P1
category: 프론트엔드
---

# 지시서: JP 크롭앱 클론

> **[2026-03-12 18:16 KST]** iMac/쌍아 → iMac/막내
> KR 크롭앱(crop.html/js/css)을 JP에 복사 + 일본어 전환

---

## 개요

KR `public/crop.html`, `crop.js`, `crop.css` 3파일을 JP `public/`에 복사한 뒤,
**아래 항목만** 변경한다. 로직/레이아웃/스타일은 동일 유지.

---

## 1. 파일 복사

```
monkos_AI/idphoto-kr/public/crop.html → monkos_AI/idphoto-jp/public/crop.html
monkos_AI/idphoto-kr/public/crop.js   → monkos_AI/idphoto-jp/public/crop.js
monkos_AI/idphoto-kr/public/crop.css  → monkos_AI/idphoto-jp/public/crop.css
```

---

## 2. 규격 데이터 변경 (crop.js 상단)

JP 규격은 KR과 동일(여권 35×45, 증명 30×40)하나 **label/warn 텍스트**를 일본어로.

```javascript
// KR 현재
const SPECS = {
  passport: { id: 'passport', label: '여권/신분증', wMm: 35, hMm: 45, faceMin: 32, faceMax: 36, faceTarget: 34, topDefault: 5, bottomDefault: 6, pxW: 413, pxH: 531, warn: '눈썹/이마 노출 필수 · 무표정 정면' },
  id:       { id: 'id',       label: '반명함',      wMm: 30, hMm: 40, faceMin: 24, faceMax: 32, faceTarget: 28, topDefault: 4, bottomDefault: 5, pxW: 354, pxH: 472, warn: '헤어/의상 정돈 · 좋은 인상의 표정' },
};

// JP 변경
const SPECS = {
  passport: { id: 'passport', label: 'パスポート', wMm: 35, hMm: 45, faceMin: 32, faceMax: 36, faceTarget: 34, topDefault: 5, bottomDefault: 6, pxW: 413, pxH: 531, warn: '眉毛・額の露出必須 · 無表情で正面' },
  id:       { id: 'id',       label: '証明写真',    wMm: 30, hMm: 40, faceMin: 24, faceMax: 32, faceTarget: 28, topDefault: 4, bottomDefault: 5, pxW: 354, pxH: 472, warn: 'ヘア・服装を整える · 好印象の表情' },
};
```

---

## 3. UI 텍스트 번역 (crop.html + crop.js)

### crop.html — 고정 텍스트

| KR | JP |
|----|-----|
| 규격 맞춤 자르기 | 規格カスタムクロップ |
| 여권/신분증 | パスポート |
| 반명함 | 証明写真 |
| 최적 | 最適 |
| 허용 | 許容 |
| 이탈 | 範囲外 |
| 정수리 | 頭頂部 |
| 턱 | あご |
| 얼굴 | 顔 |
| 눈 위치 | 目の位置 |
| ← 돌아가기 | ← 戻る |
| ↻ 초기화 | ↻ リセット |
| 👁 미리보기 | 👁 プレビュー |
| 📥 다운로드 | 📥 ダウンロード |
| 🔍 샘플 사진으로 체험하기 | 🔍 サンプル写真で体験 |
| 내 사진 올리기 | 写真をアップロード |
| FaceMesh 분석 중... | FaceMesh 分析中... |

### crop.js — 동적 텍스트 (경고/안내)

| KR | JP |
|----|-----|
| 사진을 확대하세요 | 写真を拡大してください |
| 사진을 축소하세요 | 写真を縮小してください |
| 눈 위치가 중간에서 벗어났습니다 | 目の位置が中央から外れています |
| 얼굴이 중심에서 벗어났습니다 | 顔が中心から外れています |
| 다운로드 가능 | ダウンロード可能 |
| 다운로드 불가 | ダウンロード不可 |
| ICAO 허용범위 | ICAO 許容範囲 |
| 얼굴 크기 | 顔のサイズ |
| 허용범위 | 許容範囲 |
| 미달 | 未満 |
| 초과 | 超過 |

### crop.js — 모달 텍스트

| KR | JP |
|----|-----|
| 규격 크롭 다운로드 | 規格クロップダウンロード |
| 규격에 맞게 잘린 사진을 다운로드합니다 | 規格に合わせてクロップした写真をダウンロードします |
| 수치를 확인했습니다 | 数値を確認しました |
| AI 보정 사진의 크롭/수정 결과물입니다 | AI補正写真のクロップ・修正結果です |
| 다운로드 | ダウンロード |
| 경고 무시하고 다운로드 | 警告を無視してダウンロード |
| 취소 | キャンセル |

---

## 4. thankyou 연동

JP `thankyou.html`에 크롭 버튼이 있다면 `goToCrop()` 함수가 `/crop.html`로 이동하도록 확인.
없다면 KR과 동일하게 크롭 버튼 추가 (단, JP 땡큐 페이지 구조에 맞게).

→ **이 건은 별도 후속 지시서로 분리**. 이번 지시서는 crop 3파일 클론만 수행.

---

## 5. 변경하지 않는 것

- crop.css — 그대로 복사 (스타일 동일)
- FaceMesh CDN 경로 — 동일
- 다운로드 로직 — 동일 (`<a download>` 방식)
- 규격 수치(mm/px) — KR/JP 동일

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- JP `server.js` 수정 없음 — 순수 클라이언트 파일 3개 추가만
- `lang="ja"` 설정 확인 (crop.html `<html>` 태그)

## 커밋 + 배포

- 1커밋으로 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**
