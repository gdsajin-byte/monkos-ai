---
type: order
date: 2026-07-06
device: iMac
agent: 쌍아 → 막내
status: 대기
---

**[2026-07-06 16:05 KST]** iMac/쌍아 → 막내

# SPECS 대륙 카드 리디자인 — 이미지 선명 + 좌하단 흰 텍스트

## 방향
레퍼런스(ID PASS 앱)처럼: 이미지 전면 노출, 색상 overlay 없음,
하단에 얇은 어둠 gradient만, 굵은 흰 텍스트 좌하단 배치.

## 수정 대상 파일
`monkos_AI/portal/lib/cms/render-specs.js`

---

## 수정 1 — CSS 블록

**현재:**
```css
.continent-card .overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
}
.continent-card .c-name { font-size: 18px; font-weight: 800; color: #1a1a1a; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.continent-card .c-name-en { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.continent-card .c-count { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
```

**수정 후:**
```css
.continent-card .overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: flex-start; justify-content: flex-end; padding: 12px 14px; gap: 2px;
}
.continent-card .c-name { font-size: 20px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 6px rgba(0,0,0,0.7); line-height: 1.1; }
.continent-card .c-name-en { display: none; }
.continent-card .c-count { font-size: 11px; color: rgba(255,255,255,0.75); text-shadow: 0 1px 4px rgba(0,0,0,0.7); }
```

---

## 수정 2 — JS 템플릿 inline style (overlay 배경)

**현재** (line ~1190):
```js
<div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}33,${cm.gradient[1]}33)">
```

**수정 후:**
```js
<div class="overlay" style="background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)">
```

- 색상 gradient 완전 제거
- 하단 55% → 상단 투명 dark vignette으로 교체 (텍스트 가독성 확보)

---

## 완료 조건
1. `monkos.ai/specs` → 여권 선택 → 대륙 카드: 이미지 원본 색상 선명하게 표시
2. 텍스트(한글 대륙명 + 개국 수) 좌하단에 흰색 굵은 글씨로 명확히 표시
3. 영문 대륙명(ASIA, EUROPE 등) 화면에 노출 안 됨
4. 배포 후 rev 번호 보고

## ⚠️ 준수 조항
- 배포: `./deploy.sh prod` 경유 필수 (ch5 2조)
- 완료 보고: 수발신 헤더 + ✅ 형식, COMPLETION 파일 생성 필수
