/**
 * iPhone → iMac 파일 업로드 서버
 *
 * 사용법: node iphone_capture/upload_server.js
 * 접속: https://100.97.103.10:9000 (iPhone Safari/Chrome)
 * 저장: iphone_capture/ 폴더
 */
import { createServer } from 'https';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 9000;
const SAVE_DIR = __dirname;

// SSL — monk-cam 인증서 재활용
const CERT_DIR = join(__dirname, '..', 'apps', 'monk-cam', 'demo');
const sslOptions = {
    key: readFileSync(join(CERT_DIR, 'key.pem')),
    cert: readFileSync(join(CERT_DIR, 'cert.pem')),
};

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>iPhone Upload</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#111;color:#fff;font-family:-apple-system,sans-serif;
  min-height:100vh;display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding:20px;gap:16px}
h1{font-size:18px;opacity:0.5;letter-spacing:2px}
.btn{display:block;width:100%;max-width:320px;padding:16px;
  border-radius:12px;border:none;font-size:16px;font-weight:600;
  cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent}
.btn-pick{background:#3b82f6;color:#fff}
.btn-cam{background:#22c55e;color:#000}
.btn:active{opacity:0.7}
#status{font-size:13px;color:#666;text-align:center;min-height:40px;line-height:1.5}
.ok{color:#22c55e} .err{color:#ef4444}
#preview{max-width:90%;max-height:200px;border-radius:8px;display:none}
</style>
</head>
<body>
<h1>UPLOAD</h1>
<input type="file" id="file-pick" accept="image/*,video/*" multiple hidden>
<input type="file" id="file-cam" accept="image/*" capture="environment" hidden>
<button class="btn btn-pick" onclick="document.getElementById('file-pick').click()">
  사진 선택 (복수 가능)
</button>
<button class="btn btn-cam" onclick="document.getElementById('file-cam').click()">
  카메라 촬영 → 즉시 업로드
</button>
<img id="preview">
<div id="status">대기 중...</div>
<script>
function upload(files) {
  if (!files.length) return;
  const status = document.getElementById('status');
  const preview = document.getElementById('preview');
  const total = files.length;
  let done = 0, fail = 0;
  status.className = '';
  status.textContent = '업로드 중... 0/' + total;

  Array.from(files).forEach(f => {
    const fd = new FormData();
    fd.append('file', f);
    fetch('/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => {
        done++;
        if (done === 1 && f.type.startsWith('image/')) {
          preview.src = URL.createObjectURL(f);
          preview.style.display = 'block';
        }
        status.className = 'ok';
        status.textContent = done + '/' + total + ' 완료 — ' + d.name;
      })
      .catch(() => {
        fail++;
        status.className = 'err';
        status.textContent = '실패 ' + fail + '건';
      });
  });
}
document.getElementById('file-pick').onchange = e => upload(e.target.files);
document.getElementById('file-cam').onchange = e => upload(e.target.files);
</script>
</body>
</html>`;

const server = createServer(sslOptions, (req, res) => {
    if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(HTML);
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
            try {
                const buf = Buffer.concat(chunks);
                // multipart/form-data 파싱 (간이)
                const boundary = req.headers['content-type'].split('boundary=')[1];
                const parts = parseMultipart(buf, boundary);

                if (parts.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'no file' }));
                    return;
                }

                const part = parts[0];
                const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const ext = extname(part.filename) || '.jpg';
                const name = `${ts}_${part.filename}`;
                const savePath = join(SAVE_DIR, name);

                writeFileSync(savePath, part.data);
                console.log(`[저장] ${name} (${(part.data.length / 1024).toFixed(0)}KB)`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, name }));
            } catch (err) {
                console.error('[오류]', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// 간이 multipart 파서
function parseMultipart(buf, boundary) {
    const parts = [];
    const sep = Buffer.from('--' + boundary);
    let pos = 0;

    while (pos < buf.length) {
        const start = buf.indexOf(sep, pos);
        if (start === -1) break;

        const nextStart = buf.indexOf(sep, start + sep.length);
        if (nextStart === -1) break;

        const partBuf = buf.slice(start + sep.length, nextStart);
        const headerEnd = partBuf.indexOf('\r\n\r\n');
        if (headerEnd === -1) { pos = nextStart; continue; }

        const header = partBuf.slice(0, headerEnd).toString();
        const fnMatch = header.match(/filename="([^"]+)"/);
        if (!fnMatch) { pos = nextStart; continue; }

        // data: headerEnd + 4 ~ end - 2 (trailing \r\n)
        let data = partBuf.slice(headerEnd + 4);
        if (data[data.length - 1] === 10 && data[data.length - 2] === 13) {
            data = data.slice(0, -2);
        }

        parts.push({ filename: fnMatch[1], data });
        pos = nextStart;
    }

    return parts;
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Upload] https://0.0.0.0:${PORT}`);
    console.log(`iPhone: https://100.97.103.10:${PORT}`);
    console.log(`저장 경로: ${SAVE_DIR}`);
});
