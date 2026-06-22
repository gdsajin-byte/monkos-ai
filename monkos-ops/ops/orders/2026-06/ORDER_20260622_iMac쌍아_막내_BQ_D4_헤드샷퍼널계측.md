---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기 (D2 완료 후, D3과 병렬 가능)
portfolio: PF_PORTAL
---

# 지시서: BigQuery 유저 트래킹 D4 — 헤드샷 퍼널 클라이언트 계측

## 배경
- 헤드샷 퍼널(upload→select_style→generate)이 **계측 0건** — 전환 분석의 최대 공백
- D2에서 track.js (monkTrack 헬퍼) + /api/track 완료 (선행)
- headshot.js에 monkTrack 호출을 삽입하면 됨

## 작업 항목

### 1. headshot.js — 퍼널 이벤트 삽입

**파일**: `monkos_AI/portal/public/js/headshot.js`

각 단계에 `monkTrack()` 호출 추가:

#### 사진 업로드 완료 시 (handleFile 내부, 리사이즈 후)
```javascript
// Canvas 리사이즈 후, uploadedImage 세팅 직후:
if (typeof monkTrack === 'function') {
  monkTrack('upload_image', {
    file_size: file.size,
    resized_size: uploadedImage.length,
    source: file.name ? 'gallery' : 'camera',
  });
}
```

#### 스타일 선택 시 (style 버튼 클릭)
```javascript
// selectedStyle 세팅 직후:
if (typeof monkTrack === 'function') {
  monkTrack('select_style', { style: selectedStyle });
}
```

#### 생성 버튼 클릭 시 (generate 함수 진입)
```javascript
// generateBtn click 핸들러 진입 직후, 로그인/크레딧 체크 전:
if (typeof monkTrack === 'function') {
  monkTrack('click_cta', { button_id: 'generate', style: selectedStyle });
}
```

#### 충전 모달 오픈 시 (크레딧 부족)
```javascript
// openCreditShop() 호출 직전:
if (typeof monkTrack === 'function') {
  monkTrack('open_credit_shop', {
    current_credits: credits,
    page: 'headshot',
  });
}
```

#### 생성 성공 시
```javascript
// 생성 완료 후 결과 표시 직후:
if (typeof monkTrack === 'function') {
  monkTrack('generate_complete', { style: selectedStyle });
}
```

#### 다운로드 클릭 시
```javascript
// downloadBtn click 핸들러:
if (typeof monkTrack === 'function') {
  monkTrack('click_cta', { button_id: 'download', page: 'headshot' });
}
```

### 2. 서버 화이트리스트 갱신

D2에서 만든 `/api/track`의 `ALLOWED_EVENTS`에 `generate_complete` 추가:

```javascript
const ALLOWED_EVENTS = [
  'click_cta', 'upload_image', 'select_style',
  'open_credit_shop', 'start_payment', 'session_end',
  'generate_complete',  // D4 추가
];
```

## ⚠️ 준수 조항
- `typeof monkTrack === 'function'` 가드 필수 — track.js 로드 전에 호출되면 안 됨
- 배포: `deploy.sh` 경유 (ch5 2조)

## 검증
- [ ] 헤드샷 페이지에서 사진 업로드 → BQ에 upload_image 행 확인
- [ ] 스타일 선택 → select_style 행 확인
- [ ] 생성 클릭 → click_cta(generate) 행 확인
- [ ] 생성 완료 → generate_complete 행 확인
- [ ] 전체 퍼널: upload → style → generate → complete 순서로 동일 session_id에 쌓이는지

## 대상 파일
1. `monkos_AI/portal/public/js/headshot.js` — monkTrack 호출 6곳
2. `monkos_AI/portal/server.js` — ALLOWED_EVENTS에 generate_complete 추가
