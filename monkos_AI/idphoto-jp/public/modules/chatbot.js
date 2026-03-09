/**
 * modules/chatbot.js — 공유 챗봇 위젯 (idphoto-jp 전 페이지)
 * Phase 5b: 동적 DOM 생성 + /api/chat (channel: 'idphoto-jp')
 */

import { API } from '../config.js';

// ─── 상태 ───
let _chatOpen = false;
let _sessionId = `idphoto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
let _isLoading = false;

// ─── DOM 참조 (init 후 설정) ───
let _panel, _backdrop, _messages, _input, _sendBtn;

// ─── CSS 주입 ───
const CHAT_CSS = `
.chat-backdrop {
  display: none; position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  z-index: 999;
}
.chat-backdrop.open { display: block; }
.chat-panel {
  position: fixed; bottom: 0; left: 0; right: 0;
  width: 100vw; max-height: 70vh;
  background: linear-gradient(180deg, #1e1e3a 0%, #161630 100%);
  border: 1.5px solid rgba(167, 139, 250, 0.35);
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.7), 0 0 80px rgba(167,139,250,0.15);
  z-index: 1000;
  display: none; flex-direction: column; overflow: hidden;
}
.chat-panel.open { display: flex; }
.chat-header {
  padding: 16px; border-bottom: 1px solid rgba(167,139,250,0.2);
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, rgba(167,139,250,0.2), rgba(129,140,248,0.12), rgba(192,132,252,0.08));
}
.chat-header-dot { width: 10px; height: 10px; background: #34d399; border-radius: 50%; }
.chat-header-title { font-weight: 700; font-size: 0.9rem; color: #f8fafc; flex: 1; }
.chat-close {
  background: none; border: none; color: #8892a8;
  font-size: 1.3rem; cursor: pointer; padding: 0 4px; line-height: 1;
}
.chat-close:hover { color: #f8fafc; }
.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  min-height: 160px; max-height: 300px;
  background: rgba(12,12,28,0.6);
}
.chat-msg {
  max-width: 85%; padding: 10px 14px; border-radius: 12px;
  font-size: 0.9rem; line-height: 1.5; word-break: break-word;
}
.chat-msg.bot { background: #1a1a35; color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 4px; }
.chat-msg.user { background: #a78bfa; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
.chat-msg a { color: #a78bfa; text-decoration: underline; }
.chat-msg.user a { color: #e0d4ff; }
.chat-input-wrap {
  padding: 12px; border-top: 1px solid rgba(167,139,250,0.15);
  display: flex; gap: 8px; background: rgba(20,20,42,0.9);
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
.chat-input {
  flex: 1; background: #0a0a1a; border: 1px solid rgba(167,139,250,0.12);
  color: #e2e8f0; border-radius: 10px; padding: 10px 14px;
  font-size: 0.9rem; outline: none;
}
.chat-input:focus { border-color: #a78bfa; }
.chat-send {
  background: #a78bfa; color: #fff; border: none;
  border-radius: 10px; padding: 10px 16px;
  font-size: 0.9rem; font-weight: 700; cursor: pointer;
}
.chat-send:disabled { opacity: 0.5; cursor: default; }
.typing-indicator {
  display: flex; gap: 4px; padding: 10px 14px;
  background: #1a1a35; border-radius: 12px;
  align-self: flex-start; border-bottom-left-radius: 4px;
}
.typing-indicator span {
  width: 6px; height: 6px; background: #8892a8;
  border-radius: 50%; animation: chatTypingDot 1.4s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes chatTypingDot { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
`;

// ─── DOM 생성 ───
function _injectDOM() {
  // CSS
  const style = document.createElement('style');
  style.id = 'chatbot-styles';
  style.textContent = CHAT_CSS;
  document.head.appendChild(style);

  // Backdrop
  _backdrop = document.createElement('div');
  _backdrop.className = 'chat-backdrop';
  _backdrop.id = 'chatBackdrop';
  _backdrop.addEventListener('click', toggleChat);

  // Panel
  _panel = document.createElement('div');
  _panel.className = 'chat-panel';
  _panel.id = 'chatPanel';
  _panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-dot"></div>
      <div class="chat-header-title">MONKOS AI</div>
      <button class="chat-close" id="chatCloseBtn" aria-label="閉じる">&times;</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg bot">こんにちは！MONKOS AI証明写真サービスについてお気軽にお問い合わせください。</div>
    </div>
    <div class="chat-input-wrap">
      <input class="chat-input" id="chatInput" type="text" placeholder="メッセージを入力してください..." autocomplete="off">
      <button class="chat-send" id="chatSendBtn">&#9654;</button>
    </div>
  `;

  document.body.appendChild(_backdrop);
  document.body.appendChild(_panel);

  // 참조
  _messages = _panel.querySelector('#chatMessages');
  _input = _panel.querySelector('#chatInput');
  _sendBtn = _panel.querySelector('#chatSendBtn');

  // 이벤트
  _panel.querySelector('#chatCloseBtn').addEventListener('click', toggleChat);
  _sendBtn.addEventListener('click', _sendMessage);
  _input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _sendMessage();
  });
}

// ─── 토글 ───
function toggleChat() {
  _chatOpen = !_chatOpen;
  _panel.classList.toggle('open', _chatOpen);
  _backdrop.classList.toggle('open', _chatOpen);
  if (_chatOpen) {
    _input.focus();
    // index.html 전용: 로고 말풍선 숨김
    const bubble = document.getElementById('logoBubble');
    if (bubble) bubble.classList.add('hide');
  }
}

// ─── 메시지 추가 ───
function _addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  _messages.appendChild(div);
  _messages.scrollTop = _messages.scrollHeight;
}

// ─── 전송 ───
async function _sendMessage() {
  const text = _input.value.trim();
  if (!text || _isLoading) return;
  _input.value = '';
  _addMessage(text, 'user');

  _isLoading = true;
  _sendBtn.disabled = true;

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  _messages.appendChild(typing);
  _messages.scrollTop = _messages.scrollHeight;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: _sessionId, lang: 'ja', channel: 'idphoto-jp' }),
    });
    const data = await res.json();
    if (typing.parentNode) typing.remove();
    _addMessage(data.reply || data.message || '申し訳ございません。しばらくしてからもう一度お試しください。', 'bot');
    if (data.sessionId) _sessionId = data.sessionId;
  } catch {
    if (typing.parentNode) typing.remove();
    _addMessage('ネットワークエラーが発生しました。しばらくしてからもう一度お試しください。', 'bot');
  }

  _isLoading = false;
  _sendBtn.disabled = false;
}

// ─── 초기화 (헤더 로고 바인딩) ───
export function initChatbot() {
  _injectDOM();

  // 헤더 로고/타이틀 클릭 → 챗봇 열기
  // index.html: .logo-chat-trigger#logoChatTrigger
  // camera/result/thankyou/charge: #header h1
  const logoTrigger = document.getElementById('logoChatTrigger');
  if (logoTrigger) {
    logoTrigger.style.cursor = 'pointer';
    logoTrigger.addEventListener('click', toggleChat);
  } else {
    const header = document.getElementById('header');
    if (header) {
      const h1 = header.querySelector('h1');
      if (h1) {
        h1.style.cursor = 'pointer';
        h1.addEventListener('click', toggleChat);
      }
    }
  }
}
