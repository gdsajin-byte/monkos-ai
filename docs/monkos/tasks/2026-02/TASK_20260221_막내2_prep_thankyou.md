# 지시서: prep 챗봇 UI + thankyou 규격 크롭 후작업

```
[2026-02-21 15:32 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내2"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내1이 result.*, shared.js를 동시 수정 중
> - **네 수정 범위**: `prep.html`, `prep.js`, `thankyou.html`, `thankyou.js`, `app.css`

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | prep 챗봇 UI 껍데기 + thankyou 규격 크롭 후작업 |
| **수정 파일** | `MONK_kr/ai_lab/photolab/prep.html`, `prep.js`, `thankyou.html`, `thankyou.js`, `app.css` |
| **브랜치** | `develop` |
| **긴급도** | 높음 |

## ⚠️ 준수 조항

- **헌법 제10조**: 프록시 금지 — 챗봇은 UI만, API 연결하지 않음
- **법률 제2장**: monk.js Store/Pipe 패턴 유지

## ⚠️ 파일 충돌 방지

- `result.*` 수정 금지 (막내1 담당)
- `shared.js` 수정 금지 (막내1이 store 필드 추가 중)
- `camera.*`, `config.js`, `monk.js` 수정 금지

---

## PART A: prep 페이지 — 챗봇 UI 껍데기

### 배경

준비실에서 키오스크 퍼널 진행 중 사용자가 궁금한 점을 물어볼 수 있는 채팅 UI.
API 연결은 Cloud Run에서 하므로, 여기서는 **UI 컴포넌트만** 만든다.

### 목표 레이아웃

```
┌─────────────────────────────┐
│  [키오스크 퍼널 — 기존 유지]  │
│                              │
│                              │
│              💬              │  ← 플로팅 챗 버튼 (우측 하단)
└─────────────────────────────┘

💬 클릭 시:

┌─────────────────────────────┐
│  MONKOS 준비실 코치     ✕   │  ← 챗 헤더
│─────────────────────────────│
│                              │
│  안녕하세요! 촬영 준비에      │  ← 초기 인사 메시지
│  궁금한 점이 있으시면         │
│  물어보세요 😊               │
│                              │
│─────────────────────────────│
│  [메시지 입력...]    [전송]  │  ← 입력 영역
└─────────────────────────────┘
```

### TASK A-1: 챗봇 플로팅 버튼 (prep.html)

`#prep-screen` 닫기 태그 앞에 추가:

```html
<!-- 챗봇 플로팅 버튼 -->
<button id="chat-fab" onclick="toggleChat()" style="
    position:fixed; bottom:24px; right:16px; z-index:50;
    width:52px; height:52px; border-radius:50%; border:none;
    background:linear-gradient(135deg, #a78bfa, #7c3aed);
    color:#fff; font-size:24px; cursor:pointer;
    box-shadow:0 4px 16px rgba(167,139,250,0.4);
    display:flex; align-items:center; justify-content:center;
">💬</button>

<!-- 챗봇 패널 -->
<div id="chat-panel" style="
    display:none; position:fixed; bottom:88px; right:16px; left:16px; z-index:50;
    max-width:360px; margin-left:auto;
    background:#0d1117; border:1px solid rgba(167,139,250,0.2);
    border-radius:16px; overflow:hidden;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
    max-height:60vh; display:none; flex-direction:column;
">
    <!-- 헤더 -->
    <div style="padding:12px 16px; background:rgba(167,139,250,0.08); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:#a78bfa; font-size:14px;">MONKOS 준비실 코치</span>
        <button onclick="toggleChat()" style="background:none; border:none; color:#8892a8; font-size:18px; cursor:pointer;">✕</button>
    </div>

    <!-- 메시지 영역 -->
    <div id="chat-messages" style="flex:1; overflow-y:auto; padding:12px 16px; min-height:200px; max-height:40vh;">
        <div class="chat-bubble bot">
            안녕하세요! 촬영 준비에 궁금한 점이 있으시면 물어보세요 😊
        </div>
    </div>

    <!-- 입력 영역 -->
    <div style="padding:8px 12px; border-top:1px solid rgba(167,139,250,0.1); display:flex; gap:8px;">
        <input id="chat-input" type="text" placeholder="메시지 입력..."
               style="flex:1; background:#1a1f2e; border:1px solid rgba(167,139,250,0.15); border-radius:8px; padding:8px 12px; color:#fff; font-size:14px; outline:none;"
               onkeydown="if(event.key==='Enter')sendChat()">
        <button onclick="sendChat()" style="background:#a78bfa; border:none; border-radius:8px; padding:8px 14px; color:#fff; font-weight:600; font-size:14px; cursor:pointer;">전송</button>
    </div>
</div>
```

### TASK A-2: 챗봇 JS (prep.js)

`init()` 함수 앞에 추가:

```javascript
// ─── 챗봇 UI (껍데기 — API 미연결) ───

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  if (!panel) return;
  const isOpen = panel.style.display === 'flex';
  panel.style.display = isOpen ? 'none' : 'flex';
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  if (!input || !messages || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  // 사용자 메시지
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  messages.appendChild(userBubble);

  // 봇 응답 (placeholder — API 연결 전)
  setTimeout(() => {
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    botBubble.textContent = '준비실 코치 기능은 곧 연결됩니다! 촬영 준비를 먼저 진행해 주세요 😊';
    messages.appendChild(botBubble);
    messages.scrollTop = messages.scrollHeight;
  }, 500);

  messages.scrollTop = messages.scrollHeight;
  Monk.log('챗봇 메시지: ' + text);
}
```

window 노출에 추가:

```javascript
Object.assign(window, {
  kioskSelect, kioskNext, kioskBack, kioskReset,
  kioskJumpTo, kioskSkipGender, startShooting,
  toggleChat, sendChat,  // 추가
});
```

### TASK A-3: 챗봇 버블 스타일 (app.css)

app.css 맨 끝에 추가:

```css
/* ─── 챗봇 버블 ─── */
.chat-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
  max-width: 85%;
  word-break: break-word;
}
.chat-bubble.bot {
  background: rgba(167, 139, 250, 0.1);
  color: #c4b5fd;
  align-self: flex-start;
}
.chat-bubble.user {
  background: #a78bfa;
  color: #fff;
  margin-left: auto;
}
#chat-messages {
  display: flex;
  flex-direction: column;
}
```

---

## PART B: thankyou 페이지 — 규격 크롭 후작업 표시 개선

### 배경

현재 thankyou는 크롭된 사진 1장만 표시. result에서 워터마크 프리뷰로 기대감을 올렸으니, thankyou에서 **규격 정보 + 활용 가이드**를 보여줘 만족도를 높인다.

### 목표 레이아웃

```
┌─────────────────────────────┐
│  MONKOS AI 증명사진     ✕   │
│                              │
│       [크롭된 사진]          │
│                              │
│    여권 · 35×45mm · 300dpi   │  ← 규격 정보 (신규)
│    413×531px                 │
│                              │
│  ✅ 고화질 원본 다운로드 완료  │
│  💎 8c 사용 · 잔여 42c       │
│                              │
│  ──────────────────────────  │
│  💡 이 사진은 아래 용도에      │  ← 활용 가이드 (신규)
│     바로 사용할 수 있습니다    │
│  · 여권 신청 (온라인/오프라인) │
│  · 주민등록증 / 운전면허증     │
│  · 비자 신청                  │
│  ──────────────────────────  │
│                              │
│  [📲 다시 저장] [📸 추가 촬영]│
│  [🏠 메인]                    │
└─────────────────────────────┘
```

### TASK B-1: 규격 정보 전달 (thankyou.js)

sessionStorage에서 규격 정보 읽어 표시:

```javascript
function displaySpecInfo() {
  const style = loadSessionData('style');
  const purpose = loadSessionData('purpose');

  // PHOTO_SPECS가 shared.js에서 export되고 있으므로 import 추가 필요
  // import에 PHOTO_SPECS 추가

  const specInfoEl = document.getElementById('spec-info');
  if (!specInfoEl || !style) return;

  // config.js의 PHOTO_SPECS 참조
  const spec = PHOTO_SPECS[style];
  if (!spec) return;

  specInfoEl.innerHTML = `
    <div style="font-weight:600; color:#a78bfa;">${spec.name}</div>
    <div style="color:#8892a8; font-size:13px; margin-top:4px;">
      ${spec.widthMM}×${spec.heightMM}mm · 300dpi
    </div>
  `;
  specInfoEl.style.display = 'block';
}
```

thankyou.js import 수정:

```javascript
// 기존
import { store, Monk, sharedInit, loadSessionData, navigateTo } from './shared.js';
// 변경
import { store, Monk, PHOTO_SPECS, sharedInit, loadSessionData, navigateTo } from './shared.js';
```

`displayPhoto()` 끝에 `displaySpecInfo()` 호출 추가.

### TASK B-2: 규격 정보 + 활용 가이드 HTML (thankyou.html)

`ty-preview` div 뒤에 추가:

```html
<!-- 규격 정보 -->
<div id="spec-info" style="display:none; text-align:center; padding:8px 16px;"></div>

<!-- 활용 가이드 -->
<div id="usage-guide" style="
    margin:12px 16px; padding:12px 16px;
    background:rgba(167,139,250,0.05);
    border:1px solid rgba(167,139,250,0.1);
    border-radius:12px; font-size:13px; color:#8892a8;
">
    <div style="font-weight:600; color:#c4b5fd; margin-bottom:6px;">
        💡 이 사진은 아래 용도에 바로 사용할 수 있습니다
    </div>
    <div id="usage-list"></div>
</div>
```

### TASK B-3: 용도별 활용 가이드 데이터 (thankyou.js)

```javascript
const USAGE_GUIDE = {
  passport: [
    '여권 신청 (온라인/오프라인)',
    '주민등록증 / 운전면허증',
    '비자 신청',
  ],
  student_id: [
    '학생증 발급',
    '수험표 사진',
  ],
  employee_id: [
    '사원증 발급',
    '출입카드 사진',
    '사내 프로필',
  ],
  resume: [
    '이력서 / 자기소개서',
    '입사지원 온라인 프로필',
    'LinkedIn / 포트폴리오',
  ],
  color_portrait: [
    'SNS 프로필',
    '블로그 / 포트폴리오',
    '명함 사진',
  ],
};

function displayUsageGuide() {
  const purpose = loadSessionData('purpose');
  const listEl = document.getElementById('usage-list');
  const guideEl = document.getElementById('usage-guide');
  if (!listEl || !guideEl) return;

  const items = USAGE_GUIDE[purpose];
  if (!items) {
    guideEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = items.map(item =>
    `<div style="padding:2px 0;">· ${item}</div>`
  ).join('');
}
```

`displayPhoto()` 끝에 `displayUsageGuide()` 호출 추가.

### TASK B-4: SNS 공유 섹션 정리 (thankyou.html)

기존 `ty-share-section` 유지하되, 텔레그램 이벤트 링크의 안내 문구를 자연스럽게 정리:

- "캡쳐" → "캡처" (맞춤법)
- 나머지 기존 유지

---

## 금지 사항

- `result.*` 수정 금지 (막내1 담당)
- `shared.js` 수정 금지 (막내1 담당)
- `config.js`, `monk.js` 수정 금지
- `camera.*` 수정 금지
- API 호출 추가/변경 금지 (프론트 UI만)
- 챗봇 API 연결 금지 (placeholder 응답만)

---

## 완료 조건

1. prep 페이지에 챗봇 플로팅 버튼 + 채팅 패널 UI 동작
2. 챗봇 메시지 입출력 UI 동작 (placeholder 응답)
3. thankyou 페이지에 규격 정보 표시 (이름/mm/dpi)
4. thankyou 페이지에 용도별 활용 가이드 표시
5. app.css에 챗봇 버블 스타일 추가
6. 완료 보고 발신
