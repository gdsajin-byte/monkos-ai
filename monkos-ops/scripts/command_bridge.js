/**
 * MONKOS Command Bridge
 * Firestore 실시간 리스너 → Claude CLI 실행 → 결과 알림
 *
 * 사용법:
 *   node scripts/monkos/command_bridge.js
 *   (백그라운드: pm2 start scripts/monkos/command_bridge.js --name monkos-bridge)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { spawn } = require('child_process');
const https = require('https');

// === 설정 ===
const AI_NAME = 'ssanga';  // 쌍아
const PROJECT_DIR = 'c:\\Users\\smuse73\\developer\\monk_project';
const NOTIFY_API = 'https://us-central1-monkos-3c6e4.cloudfunctions.net/notifyWriter';

// Firebase 초기화 (서비스 계정 키 필요)
// 키 파일: apps/MonkosChat/functions/serviceAccountKey.json
const serviceAccount = require('../../apps/MonkosChat/functions/serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// === 헬퍼 함수 ===

function notify(type, content) {
  const data = JSON.stringify({ aiName: AI_NAME, type, content });

  const url = new URL(NOTIFY_API);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`[알림] ${type}: ${content.substring(0, 50)}...`);
  });
  req.on('error', (e) => console.error('[알림 실패]', e.message));
  req.write(data);
  req.end();
}

function runClaude(command) {
  return new Promise((resolve, reject) => {
    console.log(`[실행] claude -p "${command.substring(0, 50)}..."`);

    const claude = spawn('claude', ['-p', command, '--print'], {
      cwd: PROJECT_DIR,
      shell: true
    });

    let output = '';
    let error = '';

    claude.stdout.on('data', (data) => {
      output += data.toString();
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

async function processCommand(doc) {
  const data = doc.data();
  const commandId = doc.id;
  const command = data.command;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[명령 수신] ${command}`);
  console.log(`${'='.repeat(60)}`);

  // 상태 업데이트: 처리 중
  await doc.ref.update({ status: 'processing', startedAt: new Date() });
  notify('info', `명령 실행 시작: ${command.substring(0, 30)}...`);

  try {
    const result = await runClaude(command);

    // 완료 처리
    await doc.ref.update({
      status: 'completed',
      completedAt: new Date(),
      result: result.substring(0, 5000)  // Firestore 제한
    });

    notify('complete', `완료: ${command.substring(0, 20)}... → ${result.substring(0, 100)}...`);
    console.log(`[완료] ${result.substring(0, 200)}...`);

  } catch (err) {
    // 에러 처리
    await doc.ref.update({
      status: 'failed',
      error: err.message,
      failedAt: new Date()
    });

    notify('error', `실패: ${command.substring(0, 20)}... → ${err.message}`);
    console.error(`[실패] ${err.message}`);
  }
}

// === 메인: Firestore 실시간 리스너 ===

console.log(`
╔════════════════════════════════════════════════════════════╗
║  MONKOS Command Bridge - ${AI_NAME}                              ║
║  Firestore 실시간 감시 중...                                ║
║  종료: Ctrl+C                                              ║
╚════════════════════════════════════════════════════════════╝
`);

const queueRef = db.collection('commands').doc(AI_NAME).collection('queue');

// 대기 중인 명령 감시
queueRef
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'asc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // 새 명령 도착!
        processCommand(change.doc);
      }
    });
  }, (err) => {
    console.error('[Firestore 에러]', err);
    notify('critical', `Bridge 에러: ${err.message}`);
  });

// 하트비트 (30분마다)
setInterval(() => {
  console.log(`[하트비트] ${new Date().toLocaleTimeString()} - 감시 중`);
}, 1800000);

notify('info', 'Command Bridge 시작됨');
