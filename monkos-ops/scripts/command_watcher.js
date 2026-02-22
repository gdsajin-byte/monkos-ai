/**
 * MONKOS Command Watcher
 * commands/ 폴더 감시 → 새 커멘드 감지 → 텔레그램 알림
 *
 * 사용법:
 *   node scripts/monkos/command_watcher.js
 *   (백그라운드: nohup node scripts/monkos/command_watcher.js > /tmp/command_watcher.log 2>&1 &)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// === 설정 ===
const PROJECT_DIR = process.platform === 'win32'
    ? 'c:\\Users\\smuse73\\developer\\monk_project'
    : '/mnt/c/Users/smuse73/developer/monk_project';
const COMMANDS_DIR = path.join(PROJECT_DIR, 'commands');
const POLL_INTERVAL = 30000; // 30초

// 텔레그램 설정 (.env 로드)
const ENV_PATH = path.join(PROJECT_DIR, 'apps', 'MonkosChat', 'functions', '.env');
const envVars = loadEnv(ENV_PATH);
const BOT_TOKEN = envVars.TELEGRAM_BOT_TOKEN;
const CHAT_ID = envVars.WRITER_CHAT_ID;

// === .env 파서 ===
function loadEnv(filePath) {
    const vars = {};
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
        }
    } catch (e) {
        console.error('[.env 로드 실패]', e.message);
    }
    return vars;
}

// === 파일명 파싱 ===
// 20260218_1101_iMac쌍아_to_4060막내_mirror서버설치.md
const CMD_PATTERN = /^(\d{8}_\d{4})_(.+)_to_(.+)_(.+)\.md$/;

function parseCommandFile(filename) {
    const match = filename.match(CMD_PATTERN);
    if (!match) return null;
    const [, timestamp, sender, receiver, subject] = match;
    const date = `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
    const time = `${timestamp.slice(9, 11)}:${timestamp.slice(11, 13)}`;
    return { date, time, sender, receiver, subject };
}

// === 텔레그램 발송 ===
function sendTelegram(text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: 'Markdown'
        });

        const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`);
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
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// === git pull ===
function gitPull() {
    try {
        execSync('git pull --rebase origin main', {
            cwd: PROJECT_DIR,
            stdio: 'pipe',
            timeout: 15000
        });
        return true;
    } catch (e) {
        console.error('[git pull 실패]', e.message);
        return false;
    }
}

// === 커멘드 스캔 ===
function scanCommands() {
    try {
        const files = fs.readdirSync(COMMANDS_DIR)
            .filter(f => f.endsWith('.md') && f !== 'README.md');
        return new Set(files);
    } catch (e) {
        console.error('[스캔 실패]', e.message);
        return new Set();
    }
}

// === 메인 루프 ===
let knownFiles = scanCommands();

async function check() {
    const pulled = gitPull();
    if (!pulled) return;

    const currentFiles = scanCommands();
    const newFiles = [...currentFiles].filter(f => !knownFiles.has(f));

    for (const file of newFiles) {
        const parsed = parseCommandFile(file);
        if (!parsed) {
            console.log(`[무시] 파싱 불가: ${file}`);
            continue;
        }

        const msg = [
            '📨 *새 커멘드*',
            '━━━━━━━━━━━━',
            `발신: ${parsed.sender}`,
            `수신: ${parsed.receiver}`,
            `제목: ${parsed.subject}`,
            `시간: ${parsed.date} ${parsed.time}`,
            '━━━━━━━━━━━━'
        ].join('\n');

        try {
            await sendTelegram(msg);
            console.log(`[알림 발송] ${parsed.sender} → ${parsed.receiver}: ${parsed.subject}`);
        } catch (e) {
            console.error('[텔레그램 발송 실패]', e.message);
        }
    }

    knownFiles = currentFiles;
}

// === 시작 ===
if (!BOT_TOKEN || !CHAT_ID) {
    console.error('[오류] TELEGRAM_BOT_TOKEN 또는 WRITER_CHAT_ID가 없습니다.');
    console.error('[경로]', ENV_PATH);
    process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║  📨 MONKOS Command Watcher                               ║
║  ${POLL_INTERVAL / 1000}초 간격 감시 중...                                    ║
║  커멘드 폴더: commands/                                   ║
║  종료: Ctrl+C                                             ║
╚════════════════════════════════════════════════════════════╝
`);

console.log(`[초기] 기존 커멘드 ${knownFiles.size}건 인식`);

// 즉시 1회 체크
check();

// 주기적 체크
setInterval(check, POLL_INTERVAL);

// 1시간마다 하트비트
setInterval(() => {
    console.log(`[💓] ${new Date().toLocaleTimeString('ko-KR')} - 감시 중 (${knownFiles.size}건)`);
}, 3600000);
