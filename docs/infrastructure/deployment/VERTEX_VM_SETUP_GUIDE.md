# 🚀 Vertex AI VM 즉시 세팅 가이드

**대상**: 대표님 (260만원 크레딧 활용)
**소요 시간**: 2시간
**목표**: 오늘 저녁 VM 가동 시작

---

## 📋 준비물 체크

- [x] GCP 계정 (gen-lang-client-0105707468)
- [x] 260만원 크레딧
- [x] 웹 브라우저
- [ ] 커피 ☕

---

## 🎯 Step 1: VM 인스턴스 생성 (30분)

### 1-1. GCP Console 접속

```
https://console.cloud.google.com/compute/instances
```

### 1-2. "인스턴스 만들기" 클릭

### 1-3. 설정값 입력

| 항목 | 설정값 | 이유 |
|------|--------|------|
| **이름** | `monk-dev-master` | 마스터 개발 서버 |
| **리전** | `us-west1` | 저렴 |
| **영역** | `us-west1-b` | 기본값 |
| **머신 패밀리** | `범용` | |
| **시리즈** | `E2` | 가성비 최고 |
| **머신 유형** | `e2-standard-4` | 4 vCPU, 16GB RAM |
| **부팅 디스크** | `Ubuntu 22.04 LTS` | 안정성 |
| **디스크 크기** | `100GB` | 충분 |
| **방화벽** | `HTTP, HTTPS 트래픽 허용` | 웹 접속용 |

### 1-4. 고급 옵션

#### 네트워킹 탭
- **외부 IP**: 임시 (나중에 고정으로 변경 가능)
- **방화벽 태그**: `code-server`

### 1-5. "만들기" 클릭!

**예상 비용**: ~$120/월 (크레딧 사용)
**크레딧 수명**: 약 17개월

---

## 🎯 Step 2: SSH 접속 (5분)

### 2-1. VM 목록에서 SSH 버튼 클릭

GCP가 자동으로 브라우저 터미널 열어줌

### 2-2. 접속 확인

```bash
# 현재 사용자 확인
whoami

# 시스템 정보
cat /etc/os-release

# 디스크 용량
df -h
```

---

## 🎯 Step 3: 기본 패키지 설치 (10분)

### 3-1. 시스템 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

### 3-2. 필수 도구 설치

```bash
# 기본 개발 도구
sudo apt install -y \
  git \
  curl \
  wget \
  vim \
  htop \
  build-essential

# Node.js (최신 LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Python
sudo apt install -y python3 python3-pip

# 확인
node --version
python3 --version
git --version
```

---

## 🎯 Step 4: Code Server 설치 (15분)

### 4-1. Code Server 다운로드 및 설치

```bash
# 설치
curl -fsSL https://code-server.dev/install.sh | sh

# 서비스 시작
sudo systemctl enable --now code-server@$USER

# 상태 확인
sudo systemctl status code-server@$USER
```

### 4-2. 설정 파일 수정

```bash
# 설정 파일 열기
nano ~/.config/code-server/config.yaml
```

**수정 내용**:
```yaml
bind-addr: 0.0.0.0:8080
auth: password
password: monk2026!  # 원하는 비밀번호로 변경
cert: false
```

저장: `Ctrl+X` → `Y` → `Enter`

### 4-3. 재시작

```bash
sudo systemctl restart code-server@$USER
```

---

## 🎯 Step 5: 방화벽 규칙 (10분)

### 5-1. GCP Console → VPC 네트워크 → 방화벽

```
https://console.cloud.google.com/net-security/firewall-manager
```

### 5-2. "방화벽 규칙 만들기"

| 항목 | 값 |
|------|-----|
| **이름** | `allow-code-server` |
| **대상 태그** | `code-server` |
| **소스 IP 범위** | `0.0.0.0/0` (모든 IP 허용) |
| **프로토콜 및 포트** | `tcp:8080` |

### 5-3. "만들기" 클릭

---

## 🎯 Step 6: 웹 접속 테스트 (5분)

### 6-1. VM 외부 IP 확인

```bash
# VM SSH에서 실행
curl ifconfig.me
```

또는 GCP Console에서 "외부 IP" 열 확인

### 6-2. 브라우저 접속

```
http://VM외부IP:8080
```

예: `http://34.168.123.45:8080`

### 6-3. 로그인

- 비밀번호: `monk2026!` (위에서 설정한 것)

### 6-4. VS Code 확인!

웹 브라우저에 VS Code가 떴으면 **성공**! 🎉

---

## 🎯 Step 7: monk_project 설정 (20분)

### 7-1. Git 설정

```bash
git config --global user.name "신정규"
git config --global user.email "gdsajin@gmail.com"
```

### 7-2. 프로젝트 클론

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/monk_project.git
cd monk_project
```

### 7-3. Code Server에서 폴더 열기

- 좌측 상단 "File" → "Open Folder"
- `/home/YOUR_USERNAME/monk_project` 선택

---

## 🎯 Step 8: GCS 자동 백업 (30분)

### 8-1. gcloud 인증

```bash
gcloud auth login
```

브라우저에서 인증 완료

### 8-2. 백업 스크립트 작성

```bash
nano ~/backup_to_gcs.sh
```

**내용**:
```bash
#!/bin/bash

# 변수 설정
PROJECT_DIR="$HOME/monk_project"
BUCKET="gs://monk-project-soul"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 백업 실행
echo "🔄 백업 시작: $TIMESTAMP"

# 작업 디렉토리 백업
gsutil -m rsync -r -x ".git/*|node_modules/*" \
  "$PROJECT_DIR" \
  "$BUCKET/vm_backup/latest/"

# 스냅샷 저장 (매일)
if [ "$(date +%H)" -eq "18" ]; then
  gsutil -m cp -r \
    "$BUCKET/vm_backup/latest/" \
    "$BUCKET/vm_backup/snapshots/$TIMESTAMP/"
  echo "📸 스냅샷 저장: $TIMESTAMP"
fi

echo "✅ 백업 완료: $(date)"
```

### 8-3. 실행 권한 부여

```bash
chmod +x ~/backup_to_gcs.sh
```

### 8-4. Cron 등록 (30분마다)

```bash
crontab -e
```

**추가**:
```cron
# monk_project 자동 백업 (30분마다)
*/30 * * * * /home/YOUR_USERNAME/backup_to_gcs.sh >> /home/YOUR_USERNAME/backup.log 2>&1
```

### 8-5. 수동 테스트

```bash
~/backup_to_gcs.sh
```

---

## 🎯 Step 9: 세션 관리 스크립트 (선택)

### 9-1. 세션 저장 스크립트

```bash
nano ~/save_session.sh
```

**내용**:
```bash
#!/bin/bash

SESSION_FILE="$HOME/.monk_session.json"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

cat > "$SESSION_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "current_dir": "$(pwd)",
  "git_branch": "$(git branch --show-current 2>/dev/null)",
  "open_files": [],
  "last_commands": $(history | tail -10 | jq -Rs .)
}
EOF

# GCS에도 저장
gsutil cp "$SESSION_FILE" "gs://monk-project-soul/vm_sessions/"

echo "✅ 세션 저장 완료: $TIMESTAMP"
```

### 9-2. 실행 권한

```bash
chmod +x ~/save_session.sh
```

### 9-3. 자동 실행 (종료 시)

```bash
echo "~/save_session.sh" >> ~/.bash_logout
```

---

## 🎯 Step 10: 최종 점검 (10분)

### ✅ 체크리스트

```bash
# 1. VM 가동 확인
uptime

# 2. Code Server 접속 확인
curl http://localhost:8080

# 3. Git 확인
git status

# 4. GCS 접근 확인
gsutil ls gs://monk-project-soul/

# 5. 백업 로그 확인
tail ~/backup.log

# 6. 디스크 용량 확인
df -h
```

### 모두 OK면 완료! 🎉

---

## 🏠 집에서 접속하는 방법

### 방법 1: 브라우저

```
http://VM외부IP:8080
```

비밀번호 입력 → 바로 작업!

### 방법 2: SSH (터미널 작업 시)

```bash
# 로컬 맥북에서
gcloud compute ssh monk-dev-master \
  --project=gen-lang-client-0105707468 \
  --zone=us-west1-b
```

---

## 📊 비용 모니터링

### GCP Console

```
https://console.cloud.google.com/billing
```

### 예상 월 비용

| 항목 | 비용 |
|------|------|
| VM (e2-standard-4) | ~$100 |
| 디스크 (100GB) | ~$10 |
| GCS 저장 | ~$5 |
| 네트워크 | ~$5 |
| **총합** | **~$120/월** |

**크레딧 수명**: 260만원 ÷ $120 = **17개월**

---

## 🚨 문제 해결

### Code Server 접속 안 됨

```bash
# 서비스 상태 확인
sudo systemctl status code-server@$USER

# 재시작
sudo systemctl restart code-server@$USER

# 로그 확인
journalctl -u code-server@$USER -f
```

### 백업 안 됨

```bash
# GCS 권한 확인
gsutil ls gs://monk-project-soul/

# 스크립트 수동 실행
bash -x ~/backup_to_gcs.sh
```

### VM 느림

```bash
# 리소스 사용량 확인
htop

# 디스크 I/O
iostat
```

---

## 🎯 다음 단계

1. ✅ VM 세팅 완료
2. 📝 **간단한 작업 해보기** (내일)
3. 🔄 **워크플로우 익히기** (이번 주)
4. 🚀 **완전 전환** (다음 주)

---

**축하합니다!** 🎉

이제 어디서든 1초 만에 작업을 이어갈 수 있습니다!

백업 걱정, 세션 끊김 걱정 끝!

---

**작성**: 쌍아(雙牙)  
**일시**: 2026-01-09  
**상태**: 실행 준비 완료 🚀
