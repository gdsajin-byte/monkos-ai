---
type: order
id: ORDER_20260408_iMac쌍아_막내_크롭앱_Electron_Win빌드
date: 2026-04-08
from: iMac/쌍아
to: iMac/막내
status: 대기
priority: 긴급 (D-1)
---

# 지시서 — 크롭앱 Electron Windows 포터블 빌드 + USB 패키징

> **[2026-04-08 14:30 KST]** iMac/쌍아 → iMac/막내

## 목적

디딤돌 대면평가 (4/9) 현장 시연용.
현장은 **Windows PC** — 브라우저 의존성 없이 `.exe` 더블클릭으로 실행되는 자체 앱 형태.

## 대상

- 오프라인 크롭앱 번들: `~/Desktop/쌍아/crop-offline/`  (검증 완료)
- USB 마운트: `/Volumes/MONKOS_USB/` (exFAT 800GB)

## 작업

### 1. Electron 프로젝트 셋업

`~/Desktop/쌍아/crop-electron/` 에 생성:

```
crop-electron/
├── package.json
├── main.js          ← Electron main process
└── app/             ← crop-offline 복사본
    ├── index.html
    ├── crop.css
    ├── crop.js
    ├── monkos-icon.svg
    ├── favicon-32.png
    ├── apple-touch-icon.png
    └── mediapipe/   ← 로컬 번들 전체
```

### 2. main.js 구현

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// 내장 HTTP 서버 (WASM CORS 우회)
const MIME = {
  '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
  '.wasm':'application/wasm', '.data':'application/octet-stream',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg'
};

const PORT = 18888;
const APP_DIR = path.join(__dirname, 'app');

const server = http.createServer((req, res) => {
  let filePath = path.join(APP_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

app.whenReady().then(() => {
  server.listen(PORT, '127.0.0.1', () => {
    const win = new BrowserWindow({
      width: 480,
      height: 860,
      title: 'MONKOS 증명사진 크롭',
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    win.loadURL(`http://127.0.0.1:${PORT}`);
  });
});

app.on('window-all-closed', () => {
  server.close();
  app.quit();
});
```

### 3. package.json

```json
{
  "name": "monkos-crop",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build-win": "electron-packager . monkos-crop --platform=win32 --arch=x64 --overwrite --out=dist"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-packager": "^17.1.2"
  }
}
```

### 4. 빌드

```bash
cd ~/Desktop/쌍아/crop-electron
npm install
npm run build-win
```

산출물: `dist/monkos-crop-win32-x64/monkos-crop.exe`

### 5. USB 패키징

```bash
# 크롭앱
cp -r dist/monkos-crop-win32-x64 /Volumes/MONKOS_USB/MONKOS_CROP

# EXAONE 챗봇 (이미 빌드된 것)
cp -r ~/Desktop/쌍아/monkos-chat /Volumes/MONKOS_USB/MONKOS_CHAT
```

USB 최종 구조:
```
MONKOS_USB/
├── MONKOS_CROP/           ← 크롭앱 (더블클릭: monkos-crop.exe)
│   ├── monkos-crop.exe
│   ├── resources/
│   └── ...
├── MONKOS_CHAT/           ← EXAONE 챗봇 (별도 실행 방법 README)
└── README.txt             ← 시연 가이드
```

### 6. 검증

- [ ] Windows 환경에서 `monkos-crop.exe` 더블클릭 → 앱 창 뜸
- [ ] 사진 업로드 → 478포인트 FaceMesh 자동 감지
- [ ] ICAO 크롭 + 다운로드 정상
- [ ] 인터넷 연결 없이 전 기능 동작

> ⚠️ Windows 실기 테스트가 불가하면 Mac에서 빌드 성공 + 파일 구조 검증까지만 보고.

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/토큰 포함 금지
- 헌법 4조 2항: 원본 `monkos_AI/portal/public/crop/` 수정 금지
- Electron 빌드는 `~/Desktop/쌍아/crop-electron/` 에서만 작업

## 보고

- 빌드 성공 → USB 복사 완료 → ✅ 보고 + USB 내 파일 목록
- 빌드 실패 → ❌ 에러 로그 첨부
