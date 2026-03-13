/**
 * MONKOS Portal v4 — chat.js
 * 챗봇 (하단바 + 모달 패턴)
 */

var chatOpen = false;
var sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
var isLoading = false;

function openChat(initialMsg) {
  var modal = document.getElementById('chatModal');
  if (!modal) return;
  chatOpen = true;
  modal.classList.add('open');

  var body = document.getElementById('chatBody');
  // 첫 오픈 시 웰컴 메시지
  if (body && body.children.length === 0) {
    addMessage(t.chatWelcome, 'bot');
  }
  // 초기 메시지가 있으면 전송
  if (initialMsg) {
    addMessage(initialMsg, 'user');
    doSend(initialMsg);
  }
}

function closeChat() {
  var modal = document.getElementById('chatModal');
  if (modal) modal.classList.remove('open');
  chatOpen = false;
}

function addMessage(text, type) {
  var body = document.getElementById('chatBody');
  if (!body) return;
  var div = document.createElement('div');
  div.className = 'chat-msg ' + type;
  if (type === 'bot') {
    div.innerHTML = '<div class="from">MONKOS AI</div><div class="bubble">' +
      text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') +
      '</div>';
  } else {
    div.innerHTML = '<div class="bubble">' +
      text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') +
      '</div>';
  }
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function showTyping() {
  var body = document.getElementById('chatBody');
  if (!body) return;
  var div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typingIndicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideTyping() {
  var el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

async function doSend(msg) {
  isLoading = true;
  showTyping();
  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, sessionId: sessionId, lang: lang }),
    });
    var data = await res.json();
    hideTyping();
    if (data.reply) {
      addMessage(data.reply, 'bot');
      sessionId = data.sessionId || sessionId;
    } else if (data.error) {
      addMessage('Error: ' + data.error, 'bot');
    }
  } catch (err) {
    hideTyping();
    addMessage('Connection error. Please try again.', 'bot');
  }
  isLoading = false;
}

function sendMessage() {
  var input = document.getElementById('cbInput');
  if (!input) return;
  var msg = input.value.trim();
  if (!msg || isLoading) return;
  input.value = '';
  // 모달이 닫혀있으면 열기 + 메시지 전송
  if (!chatOpen) {
    openChat(msg);
  } else {
    addMessage(msg, 'user');
    doSend(msg);
  }
}
