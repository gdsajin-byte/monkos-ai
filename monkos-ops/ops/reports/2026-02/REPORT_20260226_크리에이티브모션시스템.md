# 🪙 MONKOS Cr(크립) 코인 모션 시스템 — 기술 협조문

> **발신**: 철창 (웹 Claude, 디자인/기획)
> **수신**: 쌍아 (Claude Code, 개발 총괄) → 막내 (실행 에이전트)
> **승인**: 작가님 (컨트롤 타워)
> **일자**: 2026.02.26
> **문서 성격**: 프론트엔드 모션 모듈 구현 지침서

---

## 1. 개요

MONKOS 크레딧 단위를 **Cr(크립)**으로 표기하고, 4단계 모션 시스템을 설계 완료함.
각 모션은 사용 맥락별로 강도가 다르며, 아래 순서대로 스케일업됨:

| 레벨 | 모션 타입 | 적용 위치 | 강도 |
|------|-----------|-----------|------|
| ① | Idle Spin Shimmer | 헤더 잔액 코인 (상시 노출) | ★☆☆☆ |
| ② | 3D Flip + Card Slide | 이벤트 적립/미션 완료 알림 | ★★☆☆ |
| ③ | Feed Card Stack | 라이브 피드 (소셜 프루프) | ★★★☆ |
| ④ | Big Flip + Burst | 결제 완료 / 로티 화면 | ★★★★ |

### 크립 경제 기본값 (참고)

```
1 Cr = $0.1 = ₩145
다운로드: 70 Cr
카카오 로그인: +30 Cr
텔레그램 가입: +40 Cr
후속 미션: +100 Cr
사진 생성: 10 Cr
```

---

## 2. 공통 디자인 토큰

모든 모션 모듈에서 공유하는 디자인 변수. CSS 변수 또는 프레임워크 theme에 등록할 것.

```css
/* ===== Cr Coin Design Tokens ===== */
:root {
  /* Gold Palette */
  --cr-gold-primary: #f7d06b;
  --cr-gold-light: #fceabb;
  --cr-gold-dark: #d4a017;
  --cr-gold-deep: #a37920;
  --cr-gold-border: #c4942a;
  --cr-gold-text: #8b6914;

  /* Conic Gradient (금화 메탈릭) */
  --cr-coin-gradient: conic-gradient(
    from 0deg,
    #f7d06b 0deg,
    #fceabb 45deg,
    #e8b730 90deg,
    #f7d06b 135deg,
    #fceabb 180deg,
    #d4a017 225deg,
    #f7d06b 270deg,
    #fceabb 315deg,
    #e8b730 360deg
  );

  /* Coin Back (M면) */
  --cr-coin-back-gradient: conic-gradient(
    from 180deg,
    #e8b730 0deg,
    #fceabb 45deg,
    #f7d06b 90deg,
    #d4a017 135deg,
    #fceabb 180deg,
    #f7d06b 225deg,
    #e8b730 270deg,
    #fceabb 315deg,
    #d4a017 360deg
  );

  /* Glow & Shadow */
  --cr-glow: rgba(247, 208, 107, 0.3);
  --cr-glow-strong: rgba(247, 208, 107, 0.5);
  --cr-shadow: 0 0 0 3px #c4942a, 0 0 0 6px #a37920;
  --cr-shadow-sm: 0 0 0 1.5px #c4942a;

  /* Sparkle */
  --cr-sparkle-color: #fceabb;
  --cr-sparkle-glow: 0 0 6px 2px rgba(252, 234, 187, 0.6);

  /* Typography */
  --cr-font: 'Space Mono', monospace;

  /* Timing */
  --cr-idle-duration: 6s;
  --cr-event-duration: 4.5s;
  --cr-feed-duration: 12s;
  --cr-thankyou-duration: 5s;
}
```

### 코인 공통 구조 (Base Face)

```css
.cr-coin-face {
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
    var(--cr-coin-gradient);
  box-shadow:
    var(--cr-shadow),
    inset 0 2px 4px rgba(255,255,255,0.5),
    inset 0 -3px 6px rgba(0,0,0,0.2),
    0 8px 30px var(--cr-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

/* 내부 이중 링 */
.cr-coin-face::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 2px solid rgba(196, 148, 42, 0.5);
}

.cr-coin-face::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  border: 1px dashed rgba(196, 148, 42, 0.3);
}

/* Cr 텍스트 */
.cr-symbol {
  font-family: var(--cr-font);
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.15);
  line-height: 1;
}
```

---

## 3. 모션 모듈별 구현 명세

---

### ① 헤더 Idle Spin Shimmer

**용도**: 헤더 우측 잔액 표시 옆 코인. 상시 노출이므로 간헐적 + 정적인 모션.

**코인 크기**: 28×28px

**동작 설명**:
- 6초 주기, 앞쪽 ~1초만 좌우 기울기(±20° rotateY) + 빛줄기 통과
- 나머지 5초는 완전 정지 → "존재하되 과하지 않게"
- 간헐적 미니 스파클 2개 (기울기 타이밍에 맞춰 팝)

```css
/* === HEADER IDLE COIN === */
.header-coin-wrap {
  width: 28px;
  height: 28px;
  perspective: 400px;
  position: relative;
}

.header-coin {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  animation: headerIdleSpin 6s ease-in-out infinite;
  transform-style: preserve-3d;
}

.header-coin-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
    var(--cr-coin-gradient);
  box-shadow: var(--cr-shadow-sm),
    inset 0 1px 2px rgba(255,255,255,0.5),
    inset 0 -1px 3px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 내부 링: 28px에서는 생략 (가독성) */
.header-coin-face::before,
.header-coin-face::after { display: none; }

.header-coin-face .cr-sym {
  font-family: var(--cr-font);
  font-size: 11px;
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 0.5px 0 rgba(255,255,255,0.5);
}

/* 빛줄기 (shimmer) */
.header-shimmer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    105deg,
    transparent 25%,
    rgba(255,255,255,0.6) 45%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0.6) 55%,
    transparent 75%
  );
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: headerShimmer 6s ease-in-out infinite;
  z-index: 2;
}

/* 간헐적 스핀: 앞쪽 16%만 움직이고 나머지 정지 */
@keyframes headerIdleSpin {
  0%, 100% { transform: rotateY(0deg) rotateZ(0deg); }
  8%       { transform: rotateY(20deg) rotateZ(1.5deg); }
  16%      { transform: rotateY(0deg) rotateZ(0deg); }
}

@keyframes headerShimmer {
  0%, 4%  { opacity: 0; transform: translateX(-20px); }
  8%      { opacity: 1; transform: translateX(0); }
  14%     { opacity: 0; transform: translateX(20px); }
  100%    { opacity: 0; transform: translateX(20px); }
}

/* 미니 스파클 */
.header-sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--cr-sparkle-color);
  border-radius: 50%;
  box-shadow: var(--cr-sparkle-glow);
  pointer-events: none;
  z-index: 3;
}

.header-sparkle:nth-child(1) {
  top: -2px; right: -1px;
  animation: hSparkle 6s 0.5s ease-in-out infinite;
}
.header-sparkle:nth-child(2) {
  bottom: 2px; left: -3px;
  animation: hSparkle 6s 1s ease-in-out infinite;
}

@keyframes hSparkle {
  0%, 6%, 18%, 100% { opacity: 0; transform: scale(0); }
  10% { opacity: 1; transform: scale(1.5); }
  14% { opacity: 0; transform: scale(0.5); }
}
```

**HTML 구조**:
```html
<div class="header-balance">
  <div class="header-coin-wrap">
    <div class="header-sparkle"></div>
    <div class="header-sparkle"></div>
    <div class="header-coin">
      <div class="header-coin-face">
        <div class="header-shimmer"></div>
        <span class="cr-sym">Cr</span>
      </div>
    </div>
  </div>
  <span class="balance-amount">100</span>
  <span class="balance-unit">Cr</span>
</div>
```

**잔액 배지 래퍼 스타일 (헤더용)**:
```css
.header-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(247, 208, 107, 0.08);
  border: 1px solid rgba(247, 208, 107, 0.15);
  border-radius: 24px;
  padding: 6px 16px 6px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-balance:hover {
  background: rgba(247, 208, 107, 0.14);
  border-color: rgba(247, 208, 107, 0.3);
}

.balance-amount {
  font-family: var(--cr-font);
  font-size: 14px;
  font-weight: 700;
  color: var(--cr-gold-primary);
}

.balance-unit {
  font-size: 11px;
  color: var(--cr-gold-deep);
  font-weight: 600;
}
```

---

### ② 이벤트 카드 + 3D Flip

**용도**: 적립 알림, 미션 완료, 결제 확인 등 단발성 이벤트 노티피케이션

**동작 시퀀스**:
1. 카드 아래→위 슬라이드 + 페이드인 (0→8%)
2. 코인 잠깐 scale 1.08로 팽창 (10→18%)
3. Cr→M→Cr 더블 플립 540° (18→35%)
4. 플립 중 파티클 5개 방출 + 글로우 링 확장
5. 카드 정지 (35→80%)
6. 카드 위로 페이드아웃 (80→92%)

**코인 크기**: 52×52px

```css
/* === EVENT CARD === */
.event-card {
  background: linear-gradient(135deg, rgba(25,22,15,0.95), rgba(35,30,18,0.95));
  border: 1px solid rgba(247,208,107,0.15);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 10px 40px rgba(0,0,0,0.5),
    0 0 0 1px rgba(247,208,107,0.05),
    inset 0 1px 0 rgba(255,255,255,0.03);
  opacity: 0;
  transform: translateY(40px) scale(0.95);
  animation: cardEnter 4.5s ease-out;
  /* 단발: infinite 제거, JS 트리거로 제어 */
}

@keyframes cardEnter {
  0%   { opacity: 0; transform: translateY(40px) scale(0.95); }
  8%   { opacity: 1; transform: translateY(0) scale(1); }
  80%  { opacity: 1; transform: translateY(0) scale(1); }
  92%  { opacity: 0; transform: translateY(-12px) scale(0.98); }
  100% { opacity: 0; transform: translateY(-12px) scale(0.98); }
}

/* === EVENT COIN (3D Flip) === */
.event-coin-wrap {
  width: 52px;
  height: 52px;
  perspective: 600px;
  flex-shrink: 0;
  position: relative;
}

.event-coin {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: eventFlip 4.5s ease-in-out;
}

.event-coin-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%),
    var(--cr-coin-gradient);
  box-shadow:
    0 0 0 2px #c4942a,
    0 0 0 4px #a37920,
    inset 0 2px 3px rgba(255,255,255,0.5),
    inset 0 -2px 4px rgba(0,0,0,0.2),
    0 4px 20px var(--cr-glow);
}

.event-coin-face::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  border: 1.5px solid rgba(196,148,42,0.4);
}

.event-coin-face .cr-sym {
  font-family: var(--cr-font);
  font-size: 18px;
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
}

.event-coin-back {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
    var(--cr-coin-back-gradient);
  box-shadow:
    0 0 0 2px #c4942a,
    0 0 0 4px #a37920,
    inset 0 2px 3px rgba(255,255,255,0.4),
    inset 0 -2px 4px rgba(0,0,0,0.2);
}

.event-coin-back::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  border: 1.5px solid rgba(196,148,42,0.4);
}

.event-coin-back .m-mark {
  font-family: var(--cr-font);
  font-size: 16px;
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
}

@keyframes eventFlip {
  0%, 10%  { transform: rotateY(0deg) scale(1); }
  18%      { transform: rotateY(0deg) scale(1.08); }
  35%      { transform: rotateY(540deg) scale(1); }
  42%      { transform: rotateY(720deg) scale(1); }
  100%     { transform: rotateY(720deg) scale(1); }
}

/* === FLIP PARTICLES === */
.flip-particle {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--cr-sparkle-color);
  border-radius: 50%;
  box-shadow: var(--cr-sparkle-glow);
  pointer-events: none;
  opacity: 0;
}

.flip-particle:nth-child(1) { --tx: -20px; --ty: -25px; animation: particleBurst 4.5s 0.8s ease-out; }
.flip-particle:nth-child(2) { --tx: 22px;  --ty: -18px; animation: particleBurst 4.5s 0.9s ease-out; }
.flip-particle:nth-child(3) { --tx: -15px; --ty: 20px;  animation: particleBurst 4.5s 0.85s ease-out; }
.flip-particle:nth-child(4) { --tx: 18px;  --ty: 22px;  animation: particleBurst 4.5s 0.95s ease-out; }
.flip-particle:nth-child(5) { --tx: 0px;   --ty: -28px; animation: particleBurst 4.5s 1s ease-out; }

@keyframes particleBurst {
  0%, 15% { opacity: 0; transform: translate(0, 0) scale(0); }
  22%     { opacity: 1; transform: translate(calc(var(--tx)*0.5), calc(var(--ty)*0.5)) scale(1.2); }
  35%     { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
  100%    { opacity: 0; }
}

/* === GLOW RING === */
.event-glow-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: eventGlow 4.5s ease-in-out;
  pointer-events: none;
}

@keyframes eventGlow {
  0%, 12% { border-color: transparent; transform: scale(1); }
  22%     { border-color: var(--cr-glow-strong); transform: scale(1.15); }
  35%     { border-color: transparent; transform: scale(1.2); }
  100%    { border-color: transparent; }
}
```

**HTML 구조**:
```html
<div class="event-card">
  <div class="event-coin-wrap">
    <div class="event-glow-ring"></div>
    <div class="flip-particle"></div>
    <div class="flip-particle"></div>
    <div class="flip-particle"></div>
    <div class="flip-particle"></div>
    <div class="flip-particle"></div>
    <div class="event-coin">
      <div class="event-coin-face">
        <span class="cr-sym">Cr</span>
      </div>
      <div class="event-coin-back">
        <span class="m-mark">M</span>
      </div>
    </div>
  </div>
  <div class="event-text">
    <div class="event-title">텔레그램 미션 완료 <span class="event-amount">+100 Cr</span></div>
    <div class="event-sub">캡쳐 전송 + 동의서 서명 완료</div>
  </div>
  <div class="event-tag">EVENT</div>
</div>
```

**JS 트리거 예시**:
```javascript
function showEventCard(title, amount, subtitle, tag = 'EVENT') {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.innerHTML = `
    <div class="event-coin-wrap">
      <div class="event-glow-ring"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="flip-particle"></div>
      <div class="event-coin">
        <div class="event-coin-face"><span class="cr-sym">Cr</span></div>
        <div class="event-coin-back"><span class="m-mark">M</span></div>
      </div>
    </div>
    <div class="event-text">
      <div class="event-title">${title} <span class="event-amount">${amount}</span></div>
      <div class="event-sub">${subtitle}</div>
    </div>
    <div class="event-tag">${tag}</div>
  `;
  document.querySelector('.event-container').appendChild(card);
  setTimeout(() => card.remove(), 4500);
}
```

---

### ③ 라이브 피드 — 연속 카드 스택

**용도**: 우측 하단 위젯 / 대기화면. 다른 유저 적립 현황을 연속 표시 → 소셜 프루프

**코인 크기**: 38×38px

```css
/* === FEED CARD === */
.feed-card {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(25,22,15,0.95), rgba(35,30,18,0.95));
  border: 1px solid rgba(247,208,107,0.12);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  opacity: 0;
}

.feed-coin {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35) 0%, transparent 50%),
    var(--cr-coin-gradient);
  box-shadow: var(--cr-shadow-sm), 0 3px 12px rgba(247,208,107,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-coin-inner {
  font-family: var(--cr-font);
  font-size: 13px;
  font-weight: 700;
  color: var(--cr-gold-text);
  display: inline-block;
}

.feed-title { font-size: 14px; font-weight: 700; color: #eee; }
.feed-amount { font-family: var(--cr-font); color: var(--cr-gold-primary); }
.feed-sub { font-size: 12px; color: #666; }
.feed-time { margin-left: auto; font-size: 11px; color: #555; flex-shrink: 0; }

.feed-card:nth-child(1) { animation: feedSlide 12s 0s ease-out infinite; }
.feed-card:nth-child(2) { animation: feedSlide 12s 4s ease-out infinite; }
.feed-card:nth-child(3) { animation: feedSlide 12s 8s ease-out infinite; }

.feed-card:nth-child(1) .feed-coin-inner { animation: miniFlip 12s 0.4s ease-in-out infinite; }
.feed-card:nth-child(2) .feed-coin-inner { animation: miniFlip 12s 4.4s ease-in-out infinite; }
.feed-card:nth-child(3) .feed-coin-inner { animation: miniFlip 12s 8.4s ease-in-out infinite; }

@keyframes feedSlide {
  0%   { opacity: 0; transform: translateY(30px) scale(0.96); }
  2%   { opacity: 1; transform: translateY(0) scale(1); }
  5%   { transform: translateY(0) scale(1); }
  25%  { opacity: 1; transform: translateY(-74px) scale(0.97); }
  30%  { opacity: 0.4; transform: translateY(-74px) scale(0.97); }
  33%  { opacity: 0; transform: translateY(-74px) scale(0.95); }
  100% { opacity: 0; }
}

@keyframes miniFlip {
  0%, 2% { transform: rotateY(0); }
  5%     { transform: rotateY(720deg); }
  8%, 100% { transform: rotateY(720deg); }
}
```

---

### ④ 로티 — Big Flip + Burst

**용도**: 결제 완료, 큰 이벤트 달성 시 풀 피드백. 최대 임팩트.

**코인 크기**: 100×100px

```css
/* === THANKYOU COIN === */
.thankyou-coin-area {
  position: relative;
  width: 100px;
  height: 100px;
  perspective: 800px;
}

.thankyou-coin {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: thankFlip 5s ease-in-out;
}

.thankyou-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.45) 0%, transparent 50%),
    var(--cr-coin-gradient);
  box-shadow:
    var(--cr-shadow),
    inset 0 2px 4px rgba(255,255,255,0.5),
    inset 0 -3px 6px rgba(0,0,0,0.2),
    0 8px 40px rgba(247,208,107,0.4);
}

.thankyou-face::before {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  border: 2px solid rgba(196,148,42,0.4);
}

.thankyou-face .cr-big {
  font-family: var(--cr-font);
  font-size: 32px;
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
}

.thankyou-back {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  backface-visibility: hidden;
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
    var(--cr-coin-back-gradient);
  box-shadow: var(--cr-shadow),
    inset 0 2px 4px rgba(255,255,255,0.4);
}

.thankyou-back::before {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  border: 2px solid rgba(196,148,42,0.4);
}

.thankyou-back .m-big {
  font-family: var(--cr-font);
  font-size: 28px;
  font-weight: 700;
  color: var(--cr-gold-text);
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
}

@keyframes thankFlip {
  0%, 5%   { transform: rotateY(0deg) scale(1); }
  10%      { transform: rotateY(0deg) scale(1.1); }
  30%      { transform: rotateY(720deg) scale(1); }
  35%, 100% { transform: rotateY(720deg) scale(1); }
}

/* === BURST RAYS (8방향) === */
.burst-ring {
  position: absolute;
  inset: -30px;
  border-radius: 50%;
  pointer-events: none;
}

.burst-ray {
  position: absolute;
  top: 50%; left: 50%;
  width: 2px;
  height: 20px;
  background: linear-gradient(to top, transparent, var(--cr-sparkle-color));
  transform-origin: bottom center;
  opacity: 0;
  border-radius: 1px;
}

.burst-ray:nth-child(1) { transform: rotate(0deg) translateY(-40px);   animation: rayBurst 5s 0.4s ease-out; }
.burst-ray:nth-child(2) { transform: rotate(45deg) translateY(-40px);  animation: rayBurst 5s 0.45s ease-out; }
.burst-ray:nth-child(3) { transform: rotate(90deg) translateY(-40px);  animation: rayBurst 5s 0.5s ease-out; }
.burst-ray:nth-child(4) { transform: rotate(135deg) translateY(-40px); animation: rayBurst 5s 0.55s ease-out; }
.burst-ray:nth-child(5) { transform: rotate(180deg) translateY(-40px); animation: rayBurst 5s 0.6s ease-out; }
.burst-ray:nth-child(6) { transform: rotate(225deg) translateY(-40px); animation: rayBurst 5s 0.65s ease-out; }
.burst-ray:nth-child(7) { transform: rotate(270deg) translateY(-40px); animation: rayBurst 5s 0.7s ease-out; }
.burst-ray:nth-child(8) { transform: rotate(315deg) translateY(-40px); animation: rayBurst 5s 0.75s ease-out; }

@keyframes rayBurst {
  0%, 8%  { opacity: 0; height: 0; }
  15%     { opacity: 1; height: 24px; }
  25%     { opacity: 0; height: 30px; }
  100%    { opacity: 0; }
}

/* === BACKGROUND GLOW === */
.thankyou-glow {
  position: absolute;
  width: 200px; height: 200px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(247,208,107,0.15) 0%, transparent 70%);
  animation: bigGlow 5s ease-in-out;
  pointer-events: none;
}

@keyframes bigGlow {
  0%, 5%  { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
  15%     { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
  40%     { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
  100%    { opacity: 0; }
}

/* === THANK YOU TEXT === */
.thankyou-text {
  text-align: center;
  animation: thankTextFade 5s ease-in-out;
}

.thankyou-text .big {
  font-size: 22px;
  font-weight: 800;
  color: #fceabb;
}

.thankyou-text .amount {
  font-family: var(--cr-font);
  font-size: 28px;
  font-weight: 700;
  color: var(--cr-gold-primary);
  display: block;
  margin: 4px 0;
}

.thankyou-text .sub {
  font-size: 13px;
  color: #777;
}

@keyframes thankTextFade {
  0%, 8%    { opacity: 0; transform: translateY(8px); }
  15%       { opacity: 1; transform: translateY(0); }
  85%       { opacity: 1; }
  95%, 100% { opacity: 0; }
}
```

**JS 트리거 예시**:
```javascript
function showThankYou(amount, message = 'MONKOS 크립이 적립되었습니다') {
  const overlay = document.createElement('div');
  overlay.className = 'thankyou-overlay';
  overlay.innerHTML = `
    <div class="thankyou-stage">
      <div class="thankyou-coin-area">
        <div class="thankyou-glow"></div>
        <div class="burst-ring">
          ${Array(8).fill('<div class="burst-ray"></div>').join('')}
        </div>
        <div class="thankyou-coin">
          <div class="thankyou-face"><span class="cr-big">Cr</span></div>
          <div class="thankyou-back"><span class="m-big">M</span></div>
        </div>
      </div>
      <div class="thankyou-text">
        <span class="big">Thank You!</span>
        <span class="amount">${amount}</span>
        <span class="sub">${message}</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 5000);
}
```

---

## 4. UI 배지 (보조 요소)

```css
.cr-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-family: var(--cr-font);
  font-weight: 700;
  font-size: 14px;
}

.cr-badge.gold {
  background: linear-gradient(135deg, #f7d06b, #e8b730);
  color: #5a3e00;
  box-shadow: 0 2px 12px rgba(247,208,107,0.4);
}

.cr-badge.dark {
  background: rgba(247,208,107,0.1);
  color: var(--cr-gold-primary);
  border: 1px solid rgba(247,208,107,0.3);
}

.cr-badge.glass {
  background: rgba(255,255,255,0.08);
  color: #fceabb;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

.cr-badge .mini-coin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--cr-coin-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: var(--cr-gold-text);
  box-shadow: var(--cr-shadow-sm);
  flex-shrink: 0;
}
```

---

## 5. 구현 지시사항

### 쌍아 → 막내 포싱 순서

| 우선순위 | 모듈 | 포싱 위치 | 비고 |
|----------|------|-----------|------|
| P0 | 디자인 토큰 | `cr-coin.css` | 전체 모듈 의존 |
| P0 | ① 헤더 Idle | 메인 레이아웃 헤더 | 상시 노출, 가장 먼저 보임 |
| P1 | ② 이벤트 카드 | 게이트/미션 완료 콜백 | 카카오/텔레 가입 시 트리거 |
| P1 | ④ 로티 화면 | 결제 완료 / 후속 이벤트 완료 | 100Cr 적립 등 큰 이벤트 |
| P2 | ③ 라이브 피드 | 대기화면 / 우측 하단 위젯 | 실데이터 연동 후 |
| P2 | UI 배지 | 가격 표시, 버튼 등 전반 | 범용 컴포넌트 |

### 주의사항

1. **animation: infinite 제거**: 데모용 HTML에는 infinite 루프이나, 실서비스에서는 JS 트리거 기반으로 1회 실행 후 DOM 제거
2. **모바일 대응**: 코인 사이즈는 유지, 카드 width를 `max-width: 380px; width: calc(100vw - 32px)`로 반응형 처리
3. **다크/라이트 테마**: 현재 다크 기준 설계. 라이트 테마 필요 시 카드 배경색만 조정 (코인 자체는 금색이라 테마 불문)
4. **접근성**: `prefers-reduced-motion` 미디어 쿼리로 모션 비활성화 옵션 추가

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

5. **폰트 로딩**: Space Mono는 Google Fonts에서 로드. 실서비스에서는 self-host 또는 CDN 캐싱 권장

---

> **철창 note**: 작가님이 직접 확인하고 방향을 잡아주신 디자인입니다. 헤더는 Spin Shimmer, 이벤트/로티는 3D Flip+카드 조합으로 확정. 쌍아는 이 명세 기준으로 막내에게 모듈 단위로 포싱시켜 주세요. 코드는 CSS 변수 기반이라 색상/타이밍 한두줄 수정하면 전체 반영됩니다.
