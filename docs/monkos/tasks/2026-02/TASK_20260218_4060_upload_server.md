# 지시서: 4060 iPhone 업로드 서버 구축

[2026-02-18 18:07 KST] iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = iMac 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = 4060 WSL 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `4060/막내 → iMac/쌍아` 형식

## 목표

iPhone에서 촬영한 사진을 4060으로 직접 업로드할 수 있는 HTTPS 서버 구축.
iMac에서 동일 서버(`iphone_capture/upload_server.js`)가 이미 동작 중이며, 4060에도 같은 환경을 구축한다.

## 작업 순서

### 1. git pull (최신 코드 받기)

```bash
cd /mnt/c/Users/smuse73/developer/monk_project
git pull origin develop
```

### 2. iphone_capture 폴더 확인

```bash
mkdir -p iphone_capture
```

### 3. SSL 인증서 생성

4060에는 monk-cam 인증서가 없으므로 자체 생성한다.

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout iphone_capture/key.pem \
  -out iphone_capture/cert.pem \
  -subj '/CN=localhost' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:100.118.31.62'
```

### 4. upload_server.js SSL 경로 수정 (4060 전용)

`iphone_capture/upload_server.js` 파일에서 SSL 인증서 경로를 수정한다.
**원본 파일은 건드리지 말고**, 로컬 복사본을 만들어서 수정:

```bash
cp iphone_capture/upload_server.js iphone_capture/upload_server_local.js
```

`upload_server_local.js`에서 아래 부분을 수정:

**변경 전:**
```javascript
const CERT_DIR = join(__dirname, '..', 'apps', 'monk-cam', 'demo');
const sslOptions = {
    key: readFileSync(join(CERT_DIR, 'key.pem')),
    cert: readFileSync(join(CERT_DIR, 'cert.pem')),
};
```

**변경 후:**
```javascript
const sslOptions = {
    key: readFileSync(join(__dirname, 'key.pem')),
    cert: readFileSync(join(__dirname, 'cert.pem')),
};
```

또한 하단 콘솔 출력의 IP를 4060 Tailscale IP로 수정:

**변경 전:**
```javascript
console.log(`iPhone: https://100.97.103.10:${PORT}`);
```

**변경 후:**
```javascript
console.log(`iPhone: https://100.118.31.62:${PORT}`);
```

### 5. 서버 구동

```bash
node iphone_capture/upload_server_local.js
```

정상 출력 예상:
```
[Upload] https://0.0.0.0:9000
iPhone: https://100.118.31.62:9000
저장 경로: /mnt/c/Users/smuse73/developer/monk_project/iphone_capture
```

### 6. 검증

- 브라우저에서 `https://100.118.31.62:9000` 접속 가능한지 확인
- 업로드 페이지가 정상 렌더링되는지 확인

## 주의사항

- `upload_server_local.js`와 `key.pem`, `cert.pem`은 gitignore 대상(`iphone_capture/`)이므로 커밋 불필요
- 포트 9000 방화벽 확인 — Tailscale 내부 통신이므로 보통 열려있음
- tmux 세션에서 실행 권장: `tmux new -s upload` → 서버 구동 → `Ctrl+B D`로 분리

## 완료 보고 형식

```
---
## 완료 보고
[YYYY-MM-DD HH:MM KST] 4060/막내 → iMac/쌍아

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {발견사항}
---
```
