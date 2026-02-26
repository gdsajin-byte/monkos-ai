/**
 * MONKOS Command Bridge (Simple - HTTP Polling)
 * getCommands API 폴링 → Claude CLI 실행 → 결과 알림
 *
 * 사용법:
 *   node scripts/monkos/command_bridge_simple.js
 *   (백그라운드: start /B node scripts/monkos/command_bridge_simple.js)
 */

const { spawn } = require('child_process');
const https = require('https');

// === 설정 ===
const AI_NAME = 'ssanga';
const PROJECT_DIR = 'c:\\Users\\smuse73\\developer\\monk_project';
const API_BASE = 'https://us-central1-monkos-3c6e4.cloudfunctions.net';
const POLL_INTERVAL = 10000;  // 10초마다 체크

// === HTTP 헬퍼 ===

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ commands: [] });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve(result));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function notify(type, content) {
  return httpPost(`${API_BASE}/notifyWriter`, {
    aiName: AI_NAME,
    type,
    content
  }).then(() => console.log(`[알림] ${type}: ${content.substring(0, 60)}`))
    .catch(e => console.error('[알림실패]', e.message));
}

function completeCommand(commandId) {
  return httpPost(`${API_BASE}/completeCommand`, {
    aiName: AI_NAME,
    commandId
  }).catch(e => console.error('[완료처리실패]', e.message));
}

// === Claude 실행 ===

function runClaude(command) {
  return new Promise((resolve, reject) => {
    console.log(`\n[Claude 실행] ${command.substring(0, 80)}...`);

    const claude = spawn('claude', ['-p', command, '--print'], {
      cwd: PROJECT_DIR,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    let output = '';
    let error = '';

    claude.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);  // 실시간 출력
    });

    claude.stderr.on('data', (data) => {
      error += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Exit code: ${code}`));
      }
    });

    // 10분 타임아웃
    setTimeout(() => {
      claude.kill();
      reject(new Error('Timeout: 10분 초과'));
    }, 600000);
  });
}

// === 명령 처리 ===

async function processCommand(cmd) {
  const { id, command, from } = cmd;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📨 명령 수신: ${command}`);
  console.log(`   from: ${from || 'telegram'}`);
  console.log(`${'═'.repeat(60)}`);

  await notify('info', `🚀 실행 시작: ${command.substring(0, 40)}...`);

  try {
    const result = await runClaude(command);
    await completeCommand(id);

    // 결과 요약 (너무 길면 자름)
    const summary = result.length > 200
      ? result.substring(0, 200) + '...(생략)'
      : result;

    await notify('complete', `✅ ${command.substring(0, 20)}... 완료\n${summary}`);
    console.log(`\n[완료] ✅`);

  } catch (err) {
    await notify('error', `❌ 실패: ${command.substring(0, 20)}...\n${err.message}`);
    console.error(`\n[실패] ❌ ${err.message}`);
  }
}

// === 메인 루프 ===

let isProcessing = false;

async function checkCommands() {
  if (isProcessing) return;

  try {
    const response = await httpGet(`${API_BASE}/getCommands?aiName=${AI_NAME}`);

    if (response.commands && response.commands.length > 0) {
      isProcessing = true;

      for (const cmd of response.commands) {
        await processCommand(cmd);
      }

      isProcessing = false;
    }
  } catch (err) {
    console.error('[폴링 에러]', err.message);
  }
}

// === 시작 ===

console.log(`
╔════════════════════════════════════════════════════════════╗
║  🤖 MONKOS Command Bridge - ${AI_NAME}                           ║
║  ${POLL_INTERVAL/1000}초 간격 폴링 중...                                    ║
║  종료: Ctrl+C                                              ║
╚════════════════════════════════════════════════════════════╝
`);

notify('info', '🌉 Command Bridge 시작됨 (폴링 모드)');

// 즉시 1회 체크
checkCommands();

// 주기적 체크
setInterval(checkCommands, POLL_INTERVAL);

// 1시간마다 하트비트
setInterval(() => {
  console.log(`[💓] ${new Date().toLocaleTimeString()} - 감시 중`);
}, 3600000);
