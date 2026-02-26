/**
 * MONKOS Queue Sync
 * Firestore 명령 → work_queue.md 파일로 동기화
 *
 * 사용법: node scripts/monkos/queue_sync.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const AI_NAME = 'ssanga';
const API_BASE = 'https://us-central1-monkos-3c6e4.cloudfunctions.net';
const QUEUE_FILE = path.join(__dirname, '../../docs/monkos/work_queue.md');
const POLL_INTERVAL = 5000;  // 5초

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ commands: [] }); }
      });
    }).on('error', reject);
  });
}

function updateQueueFile(commands) {
  const now = new Date().toLocaleString('ko-KR');

  let content = `# MONKOS Work Queue - 쌍아

> 이 파일은 텔레그램에서 전달된 작업 지시를 담습니다.
> 세션 시작 시 이 파일을 확인하고 작업을 수행하세요.
> **마지막 동기화**: ${now}

---

## 📋 대기 중인 작업

`;

  if (commands.length === 0) {
    content += `_현재 대기 중인 작업 없음_\n`;
  } else {
    commands.forEach((cmd, i) => {
      const time = cmd.createdAt ? new Date(cmd.createdAt._seconds * 1000).toLocaleString('ko-KR') : '알 수 없음';
      content += `### ${i + 1}. [${time}]
- **명령**: ${cmd.command}
- **ID**: \`${cmd.id}\`
- **상태**: ${cmd.status || 'pending'}

`;
    });
  }

  content += `---

## 📝 작업 완료 시

작업 완료 후 다음 명령으로 완료 처리:
\`\`\`bash
curl -X POST "${API_BASE}/completeCommand" -H "Content-Type: application/json" -d '{"aiName":"${AI_NAME}","commandId":"[ID]"}'
\`\`\`

또는 텔레그램 알림:
\`\`\`bash
curl -X POST "${API_BASE}/notifyWriter" -H "Content-Type: application/json" -d '{"aiName":"${AI_NAME}","type":"complete","content":"[작업 내용] 완료"}'
\`\`\`
`;

  fs.writeFileSync(QUEUE_FILE, content, 'utf8');
  return commands.length;
}

async function sync() {
  try {
    const response = await httpGet(`${API_BASE}/getCommands?aiName=${AI_NAME}`);
    const count = updateQueueFile(response.commands || []);

    if (count > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] 📋 ${count}개 작업 동기화됨 → work_queue.md`);
    }
  } catch (err) {
    console.error('[동기화 에러]', err.message);
  }
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║  📋 MONKOS Queue Sync                                       ║
║  Firestore → work_queue.md                                  ║
║  ${POLL_INTERVAL/1000}초 간격 동기화                                       ║
╚════════════════════════════════════════════════════════════╝
`);

// 즉시 1회 실행
sync();

// 주기적 동기화
setInterval(sync, POLL_INTERVAL);
