---
type: order
date: 2026-07-06
device: iMac
agent: 쌍아 → 막내
status: 대기
---

**[2026-07-06 15:33 KST]** iMac/쌍아 → 막내

# SPECS 카드 overlay 대폭 축소 — 이미지 선명하게

## 방향
overlay를 10~15%로 축소해 배경 이미지가 거의 원본 그대로 보이게.
텍스트는 흰색 + text-shadow로 가독성 유지.

## 수정 대상 파일
`monkos_AI/portal/lib/cms/render-specs.js`

---

## 수정 1 — 종류 카드(여권/비자/신분증/기타) — CSS

**현재 코드:**
```css
.purpose-card .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.purpose-card .p-name { font-size: 18px; font-weight: 800; color: #1a1a1a; }
.purpose-card .p-sub { font-size: 10px; font-weight: 700; color: #6c4fff; letter-spacing: 2px; font-family: monospace; }
```

**수정 후:**
```css
.purpose-card .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.15), rgba(0,0,0,0.05));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.purpose-card .p-name { font-size: 18px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 6px rgba(0,0,0,0.7); }
.purpose-card .p-sub { font-size: 10px; font-weight: 700; color: #ffffff; letter-spacing: 2px; font-family: monospace; text-shadow: 0 1px 4px rgba(0,0,0,0.8); opacity: 0.85; }
```

---

## 수정 2 — 대륙 카드 overlay — inline style (JS 템플릿)

**현재 코드** (line ~1186):
```js
<div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}88,${cm.gradient[1]}88)">
```

**수정 후:**
```js
<div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}33,${cm.gradient[1]}33)">
```

- `88`(53%) → `33`(20%)로 축소

---

## 완료 조건
1. `monkos.ai/specs` 여권/비자/신분증/기타 카드 배경 이미지 원본 대비 85% 이상 선명하게 보임
2. 카드 텍스트 흰색으로 명확히 가독 가능
3. 대륙 카드 배경 이미지 이미지 tint 크게 줄어있음
4. 배포 후 rev 번호 보고

## ⚠️ 준수 조항
- 배포: `./deploy.sh prod` 경유 필수 (ch5 2조)
- 완료 보고: 수발신 헤더 + ✅ 형식, COMPLETION 파일 생성 필수
