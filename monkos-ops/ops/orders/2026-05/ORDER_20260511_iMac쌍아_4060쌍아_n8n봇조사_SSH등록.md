---
type: order
from: iMac/쌍아
to: 4060/쌍아
date: 2026-05-11
project: PF_AUTOPILOT 텔레그램 체계
priority: 높음
portfolio: PF_AUTOPILOT
deadline: 수신 즉시
---

# 지시서: n8n 텔레그램 봇 전수 조사 + iMac SSH 키 등록

## 배경

- PF_AUTOPILOT에서 텔레그램 보고/지시 체계를 구축 중
- 4060에서 n8n Docker가 운용되며, 커밋 시 자동 메시지를 보내는 텔레그램 봇이 있음
- iMac에서 4060 원격 접근 시 SSH 키 인증 실패 — 공개키 미등록 상태
- 이 두 건을 4060 현지에서 처리 요청

## 임무

### 1. iMac SSH 공개키 등록

아래 공개키를 4060의 `~/.ssh/authorized_keys`에 추가:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr
```

```bash
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 2. n8n Docker 상태 확인

```bash
docker ps --format '{{.Names}} | {{.Ports}} | {{.Status}}'
docker ps -a --format '{{.Names}} | {{.Status}}' | grep -i n8n
```

n8n이 내려가 있으면 `docker start <컨테이너명>`으로 기동.

### 3. n8n 텔레그램 봇 전수 조사

n8n 웹 UI 또는 API로 아래 정보를 추출:

**3-1. 워크플로우 목록**
```bash
N8N_KEY="(n8n API 키)"; curl -s -H "X-N8N-API-KEY: $N8N_KEY" "http://localhost:5678/api/v1/workflows" | python3 -m json.tool
```

**3-2. 텔레그램 관련 워크플로우에서 추출할 정보**
- 봇 토큰 (어떤 봇을 사용하는지)
- 발신 대상 채팅 ID
- 트리거 조건 (커밋 push? webhook?)
- 발신 메시지 형식

**3-3. 보고서에 포함할 내용**

| 항목 | 값 |
|------|-----|
| 봇 이름/핸들 | @??? |
| 봇 토큰 변수명 | ??? |
| 발신 채팅 ID | ??? |
| 트리거 | 커밋 push / webhook / cron |
| 메시지 형식 | 텍스트 / 마크다운 |
| 워크플로우 수 | N개 |
| 기타 텔레그램 관련 워크플로우 | 있으면 전수 |

## 산출물

`REPORT_20260511_4060쌍아_n8n텔레그램봇_조사.md`
→ `monkos-ops/ops/reports/2026-05/` 배치 → push

## ⚠️ 준수 조항

- **헌법 4조 1항**: 봇 토큰 값을 보고서에 직접 기재하지 않음. 변수명/위치만 기록
- SSH 키 등록 후 iMac에서 접속 테스트는 iMac 쌍아가 수행

## 완료 기준

- [ ] iMac SSH 공개키 등록 → `ssh 4060 "echo ok"` 성공
- [ ] n8n Docker 상태 확인 (가동 중 or 기동 완료)
- [ ] 텔레그램 봇 전수 조사 보고서 작성
- [ ] push 완료
