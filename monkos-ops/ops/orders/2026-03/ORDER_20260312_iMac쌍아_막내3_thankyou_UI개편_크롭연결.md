---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내3
subject: thankyou 페이지 UI 개편 — 원본 표시 + 크롭앱 연결
priority: P0
category: 프론트엔드
---

# 지시서: thankyou 페이지 UI 개편 — 원본 표시 + 크롭앱 연결

> **[2026-03-12 14:23 KST]** iMac/쌍아 → iMac/막내3

---

## 배경

서버 자동크롭 제거에 따라, 땡큐 페이지는 크롭본이 아닌 **보정 원본(노크롭)**을 표시하고, 사용자가 원하면 **크롭앱으로 이동**하는 옵션을 제공합니다. 크롭앱은 무료(이미 70c 결제 완료).

## 작업 대상

| 파일 | 경로 |
|------|------|
| thankyou.html | `monkos_AI/idphoto-kr/public/thankyou.html` (380-464행) |
| thankyou.js | `monkos_AI/idphoto-kr/public/thankyou.js` (전체) |

## 변경 사항

### 1. thankyou.js

#### displayPhoto() (40-62행) — 세션 키 변경

**현재:**
```javascript
const cropped = loadSessionData('cropped');
```

**변경:**
```javascript
const image = loadSessionData('image');
```

- `monkos_image` (노크롭 원본) 로드
- `store.image = image` 저장 (기존 `store.cropped` 대체)
- 이미지 없으면 기존대로 `prep.html` 리다이렉트

#### downloadCropped() → downloadImage() 리네이밍 (65-89행)

- 함수명 `downloadCropped` → `downloadImage` (더 이상 크롭본이 아님)
- `store.cropped` → `store.image` 참조
- 파일명: `monkos_photo_` 유지 (사용자 입장에서 동일)

#### goToCrop() 신규 함수 추가

```javascript
function goToCrop() {
  const format = loadSessionData('format') || 'passport';
  // sessionStorage에 이미 image가 있으므로 crop.html에서 읽기만 하면 됨
  navigateTo(`crop.html?from=thankyou&spec=${format}`);
}
```

#### setupOriginalDownload() (109-129행)

- **기존 유지** — Signed URL 기반 원본 다운로드는 그대로 동작
- 라벨만 확인: "📸 원본(노크롭) 저장하기" + "무료" 유지

#### init() (220-260행)

- `displayPhoto()` 내부 키만 바뀌므로 init 흐름 변경 없음
- 다운로드 버튼 이벤트: `downloadCropped` → `downloadImage`
- 크롭 버튼 이벤트 추가: `btn-ty-crop` → `goToCrop`

#### window 노출

```javascript
Object.assign(window, {
  navigateTo,
  goToCrop,
});
```

### 2. thankyou.html

#### 메인 이미지 영역 (392-397행) — 변경 없음
- `#ty-photo` img 태그 그대로 사용 (노크롭 원본이 들어갈 뿐)

#### 다운로드 버튼 (400행) — 라벨 변경

**현재:**
```html
<button class="ty-download-btn" id="btn-ty-download">📥 다운로드</button>
```

**변경:**
```html
<button class="ty-download-btn" id="btn-ty-download">📥 보정 원본 다운로드</button>
```

#### 크롭 버튼 신규 추가 (다운로드 버튼 바로 아래)

```html
<!-- 크롭 조정 (무료) -->
<button class="ty-crop-btn" id="btn-ty-crop" onclick="goToCrop()">
  ✂️ 규격 크롭 조정하기 · 무료
</button>
```

**스타일 (인라인 또는 CSS 추가):**
- 다운로드 버튼과 동일한 너비
- 배경: 투명 또는 연한 보라 (`rgba(139,92,246,0.15)`)
- 텍스트: 보라 (`#8B5CF6`)
- 테두리: 1px solid `#8B5CF6`
- 위치: 다운로드 버튼 바로 아래, gap 8px

#### 기존 풀샷 원본 섹션 (422-428행) — 제거

**현재 `#ty-fullshot-section`은 불필요해짐:**
- 메인 다운로드가 이미 노크롭 원본
- Signed URL 다운로드(풀샷)와 메인 다운로드가 동일한 이미지

**처리:** `#ty-fullshot-section` 전체 `display:none` 또는 HTML 제거.
단, Signed URL은 보정 전 원본 가능성도 있으므로 — **확인 필요**:
- `monkos_originalUrl` = GCS의 보정 후 원본이면 → 섹션 제거 (중복)
- `monkos_originalUrl` = 보정 전 원본이면 → 섹션 유지 ("보정 전 원본" 라벨로)

> ⚠️ 확인: `gcsPath`가 `_generated.png`를 가리키므로 보정 후 원본입니다. 따라서 Signed URL과 메인 다운로드가 같은 파일 → **섹션 제거**.

### 3. UI 배치 정리

```
[🎉 축하 헤더]
[보정 원본 이미지]
[📥 보정 원본 다운로드]          ← 기존 다운로드 (노크롭 base64)
[✂️ 규격 크롭 조정하기 · 무료]   ← 신규 (크롭앱 이동)
[📸 전후 비교 저장]              ← 기존 유지
[───────]
[크레딧 잔고]
[🖨️ 인화 서비스 · CS]
[🎉 SNS 이벤트]
[🛡️ 발급 보장]
[💳 크레딧 안내]
[🏠 홈으로]
```

## ⚠️ 준수 조항

- **헌법 6조**: 인프라 수정 금지
- **법률 2장**: 기존 코드 패턴 유지 (ES module import, shared.js 의존)
- **헌법 7조**: 크롭 버튼은 명확히 "무료"임을 표시 (사용자 혼동 방지)

## 의존성

- **선행**: 막내2 result.js 세션 키 변경 (`monkos_image`)
- 단, HTML/CSS 작업은 병렬 가능

## 검증

- 땡큐 진입 → 노크롭 원본 이미지 표시 확인
- "보정 원본 다운로드" → JPEG 저장 정상
- "규격 크롭 조정하기" → `crop.html?from=thankyou&spec=passport` 이동 확인
- 전후비교, SNS 이벤트, 홈 버튼 기존 기능 정상
- 풀샷 원본 섹션 미표시 확인

---

**— 지시서 끝 —**
