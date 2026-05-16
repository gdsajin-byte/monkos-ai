---
type: order
date: 2026-05-16
from: iMac/쌍아
to: M4/쌍아
status: 대기
portfolio: ~
---

# 지시서: M4 SSH 원격 접속 설정 + 디바이스 프로파일 구축

> **[2026-05-16 10:33 KST] iMac/쌍아 → M4/쌍아**

## 배경

iMac에서 M4(100.121.220.14)로 SSH 접속 시도 시 `keyboard-interactive` 단계에서 서버가 연결을 끊는다.
어제(5/15) 세션에서 최초 접속 성공 후 Xcode + swift build + 서명 인증서까지 완료했으나, 오늘 재접속 불가 상태.

**증상**: `Connection closed by 100.121.220.14 port 22` (비밀번호 프롬프트 미출력)

## 작업 1: SSH 원격 로그인 활성화

### 1-1. 원격 로그인 상태 확인

```bash
# 현재 상태 확인
sudo systemsetup -getremotelogin
# 또는
sudo launchctl list | grep sshd
```

### 1-2. 원격 로그인 활성화 (꺼져 있을 경우)

```bash
sudo systemsetup -setremotelogin on
```

또는: 시스템 설정 → 일반 → 공유 → 원격 로그인 → 켜기 + "모든 사용자" 허용

### 1-3. sshd_config 확인

```bash
cat /etc/ssh/sshd_config | grep -E "PasswordAuthentication|KbdInteractive|UsePAM|AllowUsers|MaxAuthTries"
```

- `PasswordAuthentication yes` 확인 (또는 주석 상태 = 기본값 yes)
- `KbdInteractiveAuthentication yes` 확인
- `AllowUsers` 항목이 있으면 `hansonngyi` 포함 확인

### 1-4. iMac 공개키 등록

아래 공개키를 `~/.ssh/authorized_keys`에 추가:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr
```

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 1-5. 접속 검증

M4 로컬에서 자기 자신 접속 테스트:

```bash
ssh hansonngyi@localhost "echo SSH_OK"
```

## 작업 2: 디바이스 프로파일 수집

아래 정보를 수집하여 보고:

```bash
echo "=== 시스템 ===" && sw_vers && echo
echo "=== 하드웨어 ===" && sysctl -n machdep.cpu.brand_string && sysctl -n hw.memsize | awk '{print $0/1073741824 " GB"}' && echo
echo "=== Xcode ===" && xcode-select -p && xcodebuild -version && echo
echo "=== Swift ===" && swift --version && echo
echo "=== iOS SDK ===" && xcodebuild -showsdks 2>/dev/null | grep -i ios && echo
echo "=== Signing ===" && security find-identity -v -p codesigning | head -5 && echo
echo "=== Tailscale ===" && /Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null || tailscale ip -4 2>/dev/null && echo
echo "=== Claude Code ===" && claude --version 2>/dev/null && echo
echo "=== Disk ===" && df -h / | tail -1 && echo
echo "=== Repo ===" && cd ~/developer/monk_project 2>/dev/null && git log --oneline -3 && echo
echo "=== MonkosCrop Build ===" && cd apps/MonkosCrop 2>/dev/null && ls -la .build/debug/MonkosCrop 2>/dev/null && echo
echo "=== iOS Platform DL ===" && xcodebuild -showsdks 2>/dev/null | grep -c iphoneos
```

## 작업 3: iOS 플랫폼 다운로드 확인

어제 세션에서 8.5GB iOS 플랫폼 다운로드가 진행 중이었다.

```bash
# 다운로드 완료 여부 확인
xcodebuild -showsdks | grep iphoneos
# 미완료 시 재시도
xcodebuild -downloadPlatform iOS
```

## 완료 기준

- [ ] iMac(100.97.103.10) → M4(100.121.220.14) SSH 접속 성공
- [ ] iMac 공개키 등록 완료
- [ ] 디바이스 프로파일 정보 수집 보고
- [ ] iOS 플랫폼 다운로드 상태 확인/완료

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- 헌법 4조 1항: API 키/비밀번호 생성 금지 (공개키는 iMac에서 제공한 것 그대로 사용)

## 보고

완료 후 `✅❌💡⏳📁🔀` 형식으로 보고. 보고서 위치: `monkos-ops/works/han/` 또는 세션 로그.
