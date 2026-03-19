---
type: order
from: iMac/쌍아
to: iMac/막내 (sshm2 원격 실행)
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — M2(꾸) works 클론 + 코웍이 세팅

**[2026-03-19 12:46 KST] iMac/쌍아 → iMac/막내**

## 배경

꾸(M2, 몽크사진관)에 monkos-works 레포를 클론하고 코웍이(Claude Desktop) 환경을 세팅한다.
iMac에서 `sshm2`로 원격 실행. (`source ~/.bash_profile && sshm2 "명령"`)

## 사전 확인

```bash
source ~/.bash_profile
sshm2 "echo \$HOME && which git && git --version"
# → /Users/mac 예상. git 미설치면 xcode-select --install 필요
```

---

## Task 1: git + gh 설치 확인

```bash
# git 없으면
sshm2 "xcode-select --install" 2>/dev/null

# gh 없으면
sshm2 "brew install gh" 2>/dev/null
# brew 없으면 → brew 먼저 설치
# sshm2 '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
```

**판단 기준**: git만 있으면 clone 가능. gh는 PAT 인증으로 대체 가능하니 필수 아님.

---

## Task 2: monkos-works 클론

```bash
# PAT 방식 clone (작가님이 PAT 값 제공 필요 — 아래 {PAT} 자리)
sshm2 "cd ~/Desktop && git clone https://{PAT}@github.com/gdsajin-byte/monkos-works.git works"

# 확인
sshm2 "ls ~/Desktop/works/"
```

**PAT**: M1에서 발급한 monkos-works 전용 PAT 공용 사용 (M1/M4/M2 동일)

---

## Task 3: git config 설정

```bash
sshm2 "cd ~/Desktop/works && git config user.name 'kku-m2' && git config user.email 'info@monkos.ai'"
```

---

## Task 4: uv 설치

```bash
sshm2 "curl -LsSf https://astral.sh/uv/install.sh | sh"
sshm2 "source ~/.zshrc && which uvx"
# → uvx 풀 경로 확인 (예: /Users/mac/.local/bin/uvx)
```

---

## Task 5: Claude Desktop config 수정

**경로**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Claude Desktop이 설치되어 있어야 함. 미설치 시 → 작가님에게 보고 후 대기.

```bash
# 기존 config 백업
sshm2 "cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.bak" 2>/dev/null

# uvx 풀 경로를 Task 4에서 확인한 값으로 대체 (아래 {UVX_PATH} 자리)
sshm2 "cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'CEOF'
{
  \"preferences\": {
    \"localAgentModeTrustedFolders\": [
      \"/Users/mac/Desktop/works\"
    ],
    \"coworkScheduledTasksEnabled\": true,
    \"ccdScheduledTasksEnabled\": true,
    \"sidebarMode\": \"task\",
    \"coworkWebSearchEnabled\": true
  },
  \"mcpServers\": {
    \"git\": {
      \"command\": \"{UVX_PATH}\",
      \"args\": [\"mcp-server-git\", \"--repository\", \"/Users/mac/Desktop/works\"]
    }
  }
}
CEOF"
```

**⚠️ 주의**: 홈 디렉토리가 `/Users/mac`인지 Task 사전확인에서 반드시 검증. 다르면 전부 보정.

---

## Task 6: 동작 테스트

```bash
# works 폴더 내용 확인
sshm2 "cd ~/Desktop/works && git log --oneline -3"

# push 테스트 (kku/ 에 테스트 파일)
sshm2 "cd ~/Desktop/works && echo '# M2 연결 테스트' > kku/TEST_CONNECTION.md && git add kku/TEST_CONNECTION.md && git commit -m '[works] M2/꾸 연결 테스트' && git push origin main"

# 본진에서 subtree pull로 수신 확인
cd /Users/jeong-kyushin/developer/monk_project
scripts/mk-pull.sh
ls monkos-ops/works/kku/TEST_CONNECTION.md
```

---

## 완료 조건

- [ ] M2 홈 디렉토리 확인 (/Users/mac 또는 다른 값)
- [ ] `~/Desktop/works/` clone 완료
- [ ] git config (user.name, user.email) 설정
- [ ] uvx 설치 + 풀 경로 확인
- [ ] Claude Desktop config 수정 (uvx 풀 경로 반영)
- [ ] push 테스트 → 본진 subtree pull 수신 확인

## ⚠️ 준수 조항

- works 내 파일 삭제 절대 금지
- PAT/SSH key 값은 보고에 포함 금지 (헌법 제4조 1항)
- Claude Desktop 재시작은 작가님/꾸 직접 실행 (원격 GUI 불가)
