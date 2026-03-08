---
type: ORDER
date: 2026-03-03
from: M1/쌍아
to: 막내2
priority: HIGH
scope: thankyou.html + thankyou.js 전면 재작성
depends: 없음 (막내1과 병렬 가능 — 파일 분리)
parallel: 막내1 result.js 정리와 병렬
---

# 지시서 C: thankyou.html v5 엔딩 페이지 구현

> **[2026-03-03 05:12 KST] M1/쌍아 → 막내2**

---

## 목표

v5 디자인 확정안(철창이 스펙시트) 기준으로 thankyou.html/js를 전면 재작성. result.js에서 다운로드 성공 후 이 페이지로 전환됨.

---

## 참조 문서

- **UI 스펙시트 (정본)**: `monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달_1.md`
- 막내2 보고서: `REPORT_20260303_막내2_포스트다운로드_데이터흐름_전수조사.md` (§3 GAP 테이블)

---

## 진입 조건

- **진입 경로**: result.js doDownload() 성공 → `navigateTo('thankyou.html')`
- **sessionStorage에서 읽는 데이터**:

| 키 | 내용 | 쓰기 주체 |
|----|------|----------|
| `monkos_cropped` | 크롭 완성본 (원본 화질, 워터마크 없음) | result.js doDownload() |
| `monkos_captured` | 촬영 원본 | camera.js |
| `monkos_compare` | 전후비교 합성 이미지 (워터마크 없음) | result.js generateCompareImage() |
| `_mo_p` | 풀 원본 (크롭 전) | result.js doDownload() |
| `monkos_format` | 선택 규격 (`passport` / `id`) | prep.js |
| `store.user` | 유저 정보 + 크레딧 잔액 | sharedInit() |

---

## 페이지 구조 (스펙시트 §2 기준, 위→아래)

### 1. 헤더 (공통 앱 헤더)
- 기존 앱 헤더 그대로 (`#header`). MONKOS 로고 + 크레딧 뱃지
- step-label: "완료"

### 2. 셀레브레이션 (§2-2)
```
🎉 (pulse 애니)
"증명사진이 완성되었습니다!"
"아래에서 다운로드해 주세요"
```
- 🎉: 32px, pulse 2s infinite (scale 1→1.08)

### 3. 완성본 이미지 (§2-3)
- `loadSessionData('cropped')` 표시
- 높이 220px, border-radius 16px
- 하단 센터에 규격명: `PHOTO_SPECS[format].name` (11px)

### 4. 다운로드 버튼 (§2-4)
```
📥 다운로드
```
- 풀 와이드, 보라 그라데이션
- **동작**: `monkos_cropped`를 JPEG 변환 → 갤러리 저장 / share API
- 기존 thankyou.js `saveToPhotos()` 로직 재활용 가능

### 5. 전후 비교 저장 (§2-5)
```
[B→A 썸네일] 📸 전후 비교 저장    [저장]
              갤러리에 저장 · 무료
```
- **동작**: `sessionStorage.getItem('monkos_compare')` → JPEG 변환 → 갤러리 저장
- 합성은 result.js에서 이미 완료. 여기서는 꺼내서 저장만
- 썸네일: monkos_compare 이미지의 축소 미리보기 (56×56)

### 6. 구분선 (§2-6)

### 7. 내 크레딧 잔고 (§2-7)
```
내 크레딧                    {balance}c
```
- `store.user.credits` 바인딩
- 비로그인 시 숨김

### 8. 풀샷 원본 받기 20c (§2-8)
```
📸 풀샷 원본 받기                [20c]
  크롭되지 않은 풀 원본 사진
```
- **동작**:
  1. `_mo_p`에서 풀 원본 로드
  2. `store.user.credits < 20` → `navigateTo('charge.html?return=thankyou&action=full')`
  3. 충분 → `pipe.run('creditUse', {type:'full_original'})` → JPEG 변환 → 다운로드
  4. 성공 후 버튼 텍스트 → "📸 풀샷 다시 저장하기" (재다운로드 무과금)
- 비로그인 시 숨김 (직결제 사용자는 user.id 없음)
- `_mo_p` 없으면 카드 자체 숨김

### 9. 인화 서비스·CS (§2-9)
```
🖨️ 인화 서비스 · CS             [Telegram →]
  몽크사진관 공식 채널
```
- 점선 테두리 (앱 외부 링크 구분)
- 텔레그램 딥링크: `t.me/monkos_bot`

### 10. SNS 인증 이벤트 100c (§2-10)
```
🎉 SNS 인증 이벤트                100c
  전후 비교를 SNS에 올리고 인증하면
```
- **동작**: 텔레그램 봇 인증 채널로 이동
- 로그인 시에만 표시

### 11. 발급 보장 (§2-11)
```
🛡️ 발급 보장
반려 시 100c를 지급해 드립니다
[반려되셨다면 여기를 눌러주세요 →]
```
- CTA: 텔레그램 봇 반려 인증 채널

### 12. 홈으로 돌아가기 (§2-12)
- 고스트 버튼, `navigateTo('/')`

---

## 뒤로가기 방어

thankyou.js init()에서:
```javascript
history.replaceState(null, '', location.href);
window.addEventListener('popstate', () => {
  history.replaceState(null, '', location.href);
});
```
→ 브라우저 뒤로가기로 result.html 재진입 차단

---

## 디자인 토큰 (스펙시트 §4)

```
bg: #0A0E17 / card: #111827 / border: #1E293B
accent: #8B5CF6 / gold: #F59E0B / green: #10B981 / telegram: #229ED9
text: #F1F5F9 / sub: #94A3B8 / muted: #64748B
```

기존 `app.css` 변수 활용. 신규 스타일은 thankyou.html 내 `<style>` 또는 `app.css` 하단에 추가.

---

## charge.html 복귀 처리

풀샷 20c 잔액 부족 시 `charge.html?return=thankyou&action=full`로 이동.
- charge.html의 goBack()은 `params.get('return')` → `thankyou.html`로 복귀
- 복귀 시 init()에서 `_mo_p` 로드 + 풀샷 버튼 재활성화
- `pending_action` 설정: `sessionStorage.setItem('monkos_pending_action', 'full_original')`
- init()에서 pending_action='full_original' 감지 시 자동 풀샷 다운로드 진행

---

## import 구성

```javascript
import {
  store, Monk, PHOTO_SPECS, CREDIT_COST,
  sharedInit, loadSessionData, navigateTo,
  buyCreditsKR, API, pipe, fetchLatestCredits
} from './shared.js';
```

---

## 완료 조건

- [ ] thankyou.html 전면 재작성 (스펙시트 §2-2 ~ §2-12 전부 구현)
- [ ] 크롭 완성본 표시 + 다운로드 동작
- [ ] 전후비교 이미지 sessionStorage에서 로드 + 저장 동작
- [ ] 풀샷 원본 20c 결제 + 다운로드 + 재다운로드 무과금
- [ ] 뒤로가기 방어 (history.replaceState)
- [ ] charge.html 복귀 → 풀샷 자동 진행
- [ ] 비로그인 시 로그인 필요 기능 숨김 처리
- [ ] 디자인 토큰 준수 (다크 테마)
- [ ] 커밋 태그: `[feat]`

## 보고

- 형식: `[시각] M1/막내2 → M1/쌍아`
- 커밋+push 승인 대기
