# MONKOS thankyou.html UI 스펙시트

> **작성**: 철창이 | **기준**: v5 퍼널 프로토타입 엔딩 페이지 (proto.jsx L1019-1176)
> **용도**: 쌍아 → 막내 기술 지시서 첨부용
> **날짜**: 2026-03-03

---

## 1. 페이지 진입 조건

- **진입 경로**: result.html에서 다운로드 70c 결제 성공 → `navigateTo('thankyou.html')`
- **필수 전달 데이터** (sessionStorage 또는 URL params):
  - `generatedImageUrl` — 완성된 증명사진 URL
  - `originalImageUrl` — 원본(촬영) 사진 URL (전후비교용)
  - `formatType` — "passport" | "id"
  - `formatLabel` — "여권 규격 35×45mm" | "증명사진 3×4cm 반명함" 등
  - `creditBalance` — 현재 잔고
  - `sessionId` — 생성 세션 식별자 (풀샷 요청 시 필요)
- **뒤로가기 방어**: `history.replaceState()`로 result.html 재진입 차단
- **도착 = 다운로드 완료 증명**: 별도 `downloadComplete` 플래그 불필요

---

## 2. 레이아웃 구조 (위→아래 순서)

### 2-1. 헤더 (공통 앱 헤더)
- MONKOS 로고 + 챗봇 아이콘 (좌)
- 크레딧 잔고 뱃지 (우): `Cr {creditBalance}c` 골드 컬러

### 2-2. 셀레브레이션 영역
```
🎉 (pulse 애니메이션)
"증명사진이 완성되었습니다!"
"아래에서 다운로드해 주세요"
```
- 🎉 이모지: `font-size: 32px`, pulse 애니 (scale 1→1.08, 2s infinite)
- 타이틀: `18px`, `font-weight: 900`, 그라데이션 텍스트 (#F1F5F9 → #E2E8F0)
- 서브: `12px`, color: #94A3B8

### 2-3. 완성본 이미지
- 높이 220px, `border-radius: 16px`
- 배경: light gradient (프리뷰 로딩 전)
- 규격명 표시: `11px`, 하단 센터 (예: "여권 규격 35×45mm")
- 마진 바텀: 12px

### 2-4. 다운로드 버튼
```
📥 다운로드
```
- **풀 와이드**, `padding: 14px`, `border-radius: 14px`
- `background: linear-gradient(135deg, #8B5CF6, #6D28D9)` (보라 그라데이션)
- `color: #fff`, `15px`, `font-weight: 700`
- **동작**: 고해상도 원본 이미지 파일 저장 트리거
- 마진 바텀: 8px

### 2-5. 전후 비교 저장
```
[B→A 썸네일] 📸 전후 비교 저장    [저장]
              갤러리에 저장 · 무료
```
- 레이아웃: `flex`, 좌측 56×56 썸네일 + 중앙 텍스트 + 우측 저장 버튼
- 썸네일: `border-radius: 8px`, 다크 그라데이션 배경, "B → A" 텍스트
- 제목: `12px`, `font-weight: 700`
- 서브: `10px`, color: #64748B
- 저장 버튼: 초록 소프트 배경 (`rgba(16,185,129,0.10)`), `11px`, `font-weight: 700`, color: #10B981
- **동작**: 원본+완성본 나란히 합성 → 갤러리 저장 (무료, 크레딧 차감 없음)
- 마진 바텀: 16px

### 2-6. 구분선
- `height: 1px`, background: #1E293B
- 마진 바텀: 16px

### 2-7. 내 크레딧 잔고
```
내 크레딧                    {balance}c
```
- 레이아웃: `flex`, `justify-content: space-between`
- 라벨: `12px`, color: #94A3B8
- 잔고: `18px`, `font-weight: 800`, color: #F59E0B (골드)
- 배경: #111827 (card), `padding: 10px 16px`, `border-radius: 10px`
- 마진 바텀: 12px

### 2-8. 풀샷 원본 받기 (업셀)
```
📸 풀샷 원본 받기                [20c]
  크롭되지 않은 풀 원본 사진
  눌러서 미리보기 → 다운로드
```
- 카드 스타일: `padding: 14px 16px`, `border-radius: 12px`, 배경 #111827, 보더 #1E293B
- 제목: `13px`, `font-weight: 700`
- 설명: `10px`, color: #94A3B8
- 하단 안내: `10px`, color: #64748B
- 가격 뱃지: `padding: 6px 14px`, 보라 소프트 배경, `13px`, `font-weight: 800`, color: #8B5CF6
- **동작**: 탭 → 풀샷 미리보기 → 20c 차감 확인 → 다운로드
  - 잔고 부족 시 → 충전 화면 이동 (charge.html) → 복귀 후 자동 진행
- 카드 내부 마진 바텀: 8px (다음 카드와의 간격)

### 2-9. 인화 서비스·CS (외부 링크)
```
🖨️ 인화 서비스 · CS             [Telegram →]
  몽크사진관 공식 채널
```
- 카드 스타일: `padding: 14px 16px`, `border-radius: 12px`
- **점선 테두리**: `border: 1px dashed #1E293B` (앱 내부 기능이 아님을 시각적으로 구분)
- 배경: `#11182780` (반투명)
- 텔레그램 뱃지: `padding: 6px 12px`, 배경 `#229ED915`, 보더 `#229ED930`, color: #229ED9
- **동작**: 텔레그램 봇 딥링크 (`t.me/monkos_bot`)
- 마진 바텀: 16px (2-8과 2-9를 묶는 flex column gap: 8px)

### 2-10. SNS 인증 이벤트
```
🎉 SNS 인증 이벤트                100c
  전후 비교를 SNS에 올리고 인증하면
```
- 카드 스타일: `padding: 14px 16px`, `border-radius: 14px`
- 배경: `linear-gradient(135deg, rgba(245,158,11,0.08), rgba(236,72,153,0.08))` (골드→핑크)
- 보더: `1px solid #F59E0B25`
- 제목: `13px`, `font-weight: 800`, color: #F59E0B
- 설명: `11px`, color: #94A3B8
- 보상: `22px`, `font-weight: 900`, color: #F59E0B
- **동작**: 텔레그램 봇 인증 채널로 이동
- 마진 바텀: 16px

### 2-11. 발급 보장
```
        🛡️ 발급 보장
  반려 시 100c를 지급해 드립니다
  [반려되셨다면 여기를 눌러주세요 →]
```
- 카드 스타일: `padding: 14px 16px`, `border-radius: 12px`, `text-align: center`
- 배경: `rgba(16,185,129,0.10)` (초록 소프트), 보더: `1px solid #10B98120`
- 뱃지: 🛡️ + "발급 보장" `13px`, `font-weight: 800`, color: #10B981
- 설명: `11px`, color: #94A3B8
- CTA 버튼: `padding: 8px 20px`, `border-radius: 8px`, 배경 #229ED9 (텔레그램 블루), color: #fff, `11px`, `font-weight: 700`
- **동작**: 텔레그램 봇 반려 인증 채널로 이동
- 마진 바텀: 16px

### 2-12. 홈으로 돌아가기
```
[홈으로 돌아가기]
```
- 풀 와이드, `padding: 14px`, `border-radius: 14px`
- 고스트 버튼: `background: transparent`, `border: 1px solid #1E293B`
- `color: #94A3B8`, `14px`, `font-weight: 600`
- **동작**: `navigateTo('index.html')` (홈)

---

## 3. 다국어 텍스트 매핑

| # | 요소 | KO | JA | EN |
|---|------|----|----|-----|
| 2-2 | 셀레브레이션 타이틀 | 증명사진이 완성되었습니다! | 証明写真が完成しました！ | Your ID Photo is Ready! |
| 2-2 | 셀레브레이션 서브 | 아래에서 다운로드해 주세요 | 下のボタンからダウンロード | Download below |
| 2-4 | 다운로드 | 📥 다운로드 | 📥 ダウンロード | 📥 Download |
| 2-5 | 전후비교 제목 | 📸 전후 비교 저장 | 📸 ビフォーアフター保存 | 📸 Save Before & After |
| 2-5 | 전후비교 서브 | 갤러리에 저장 · 무료 | ギャラリーに保存・無料 | Save to Gallery · Free |
| 2-7 | 잔고 라벨 | 내 크레딧 | マイクレジット | My Credits |
| 2-8 | 풀샷 제목 | 📸 풀샷 원본 받기 | 📸 フルショット原本 | 📸 Full Shot Original |
| 2-8 | 풀샷 설명 | 크롭되지 않은 풀 원본 사진 | トリミングなしのフル原本 | Uncropped full original |
| 2-9 | 인화/CS 제목 | 🖨️ 인화 서비스 · CS | 🖨️ 印刷サービス · お問い合わせ | 🖨️ Print Service · Support |
| 2-9 | 인화/CS 서브 | 몽크사진관 공식 채널 | モンク写真館 公式チャンネル | MONKOS Official Channel |
| 2-10 | SNS 이벤트 제목 | 🎉 SNS 인증 이벤트 | 🎉 SNS認証イベント | 🎉 SNS Verification Event |
| 2-10 | SNS 이벤트 설명 | 전후 비교를 SNS에 올리고 인증하면 | ビフォーアフターをSNSに投稿して認証すると | Post before & after on SNS |
| 2-11 | 발급보장 뱃지 | 🛡️ 발급 보장 | 🛡️ 合格保証 | 🛡️ Approval Guaranteed |
| 2-11 | 발급보장 설명 | 반려 시 100c를 지급해 드립니다 | 不合格の場合、100cを付与します | 100c refund if rejected |
| 2-11 | 발급보장 CTA | 반려되셨다면 여기를 눌러주세요 → | 不合格の方はこちら → | Rejected? Tap here → |
| 2-12 | 홈 버튼 | 홈으로 돌아가기 | ホームに戻る | Back to Home |

---

## 4. 디자인 토큰 (다크 테마)

```
bg:         #0A0E17
card:       #111827
border:     #1E293B
accent:     #8B5CF6  (보라)
gold:       #F59E0B
green:      #10B981
telegram:   #229ED9
text:       #F1F5F9
sub:        #94A3B8
muted:      #64748B
dim:        #475569
```

---

## 5. ⚠️ 규격추가 없음

v5 프로토타입 확정 기준, **"다른 규격 추가 10c"는 포함하지 않는다.**
다규격 기능은 차후 재설계 대상이며 thankyou.html 초기 버전에서 제외.

---

## 6. 핫픽스 (thankyou와 무관, result.js 즉시 적용)

| # | 이슈 | 수정 |
|---|------|------|
| C2 | 다운로드 버튼 연속 클릭 이중차감 | 클릭 즉시 `btn.disabled = true` + 로딩 상태 |

---

## 7. result.html → thankyou.html 분리 시 제거 대상

result.js에서 제거할 코드 범위 (쌍아/막내 참고):

- `cropAndShowPostDownload()` 함수 전체
- 포스트 다운로드 UI (갤러리 저장, 풀원본, SNS 이벤트, 발급보장 표시)
- `showThankYou()` 5초 오버레이 로직
- 규격 탭 관련 코드 잔존분
- `downloadComplete` 상태 관리 로직 (thankyou 도착이 곧 완료 증명)

**대체**: 다운로드 70c 결제 성공 콜백에서 `navigateTo('thankyou.html')` 1줄

---

*끝. 쌍아는 이 스펙시트 + 막내1/2 보고서를 합쳐 기술 지시서 작성 후 작가님 승인 요청.*
