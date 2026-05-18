---
type: order
from: M1/쌍아
to: M1/막내
date: 2026-04-05 08:09 KST
priority: P1
subject: works 레포 CDP 포트 배당 교정 — 디바이스별 분기 폐지, 통일 원칙 적용 + push
tags: [works, cdp, port, cleanup]
status: open
origin: 작가님 교정 — "디바이스 간 분기 불필요, 동일 디바이스 내 멀티 에이전트만 분기"
---

# 지시서: works CDP 포트 배당 교정 + push

**[2026-04-05 08:09 KST] M1/쌍아 → M1/막내**

---

## 배경

CDP 포트 배당 원칙이 변경됨:
- **구**: 디바이스별 고정 포트 (M4=9230, M2=9231)
- **신**: 전 디바이스 9222 기본, 동일 디바이스 내 멀티 에이전트 시에만 9223~ 추가

> 이유: localhost는 각 머신에 귀속. 디바이스 간 포트 충돌은 물리적 불가능.

---

## 수정 대상 (6개 파일)

works 서브모듈(`monkos-ops/works/`) 내 작업.

### 1. `CLAUDE.md` — L118, L124

**변경 전:**
```
- **포트**: M4=9230, M2=9231
```
```
config/cdp/cdp_setup.sh start 9230 # M4용 시작
```

**변경 후:**
```
- **포트**: 전 디바이스 9222 기본. 멀티 에이전트 시 9223~ 추가
```
```
config/cdp/cdp_setup.sh start      # 기본 포트(9222)로 시작
```

### 2. `config/MONKOS_GUIDELINES.md` — L63

**변경 전:**
```
- 포트 배당: M4=9230, M2=9231, iMac=9222~9225
```

**변경 후:**
```
- 포트 배당: 전 디바이스 9222 기본. 동일 디바이스 내 멀티 에이전트 시 9223~9225 추가
```

### 3. `config/COWORK_GLOBAL_INSTRUCTION_M2.md` — L47~48

**변경 전:**
```
- M2 전용 포트: 9231
- 시작: ./config/cdp/cdp_setup.sh start 9231
```

**변경 후:**
```
- 기본 포트: 9222 (전 디바이스 동일)
- 시작: ./config/cdp/cdp_setup.sh start
```

### 4. `config/cdp/CDP_SETUP_GUIDE.md` — L36~37, L47~54, L81, L96

**§2 디버깅 크롬 시작** (L36~37):
```bash
# 변경 전
./cdp_setup.sh start 9230    # M4용
./cdp_setup.sh start 9231    # M2용

# 변경 후
./cdp_setup.sh start          # 기본 포트(9222)로 시작
./cdp_setup.sh start 9223     # 같은 디바이스에서 2번째 에이전트 시
```

**§3 포트 배당표** (L47~54):

변경 후:
```markdown
> 디바이스 간 분기 불필요 (localhost 격리). 동일 디바이스 내 동시 에이전트 수만큼 분기.

| 포트 | 용도 |
|------|------|
| 9222 | 기본 (작가님/단독 에이전트) |
| 9223 | 동시 가동 2번째 에이전트 |
| 9224 | 동시 가동 3번째 에이전트 |
| 9225 | 동시 가동 4번째 에이전트 |

- 전 디바이스(M1/M4/M2/iMac) 동일 번호 체계
- 단독 에이전트면 9222 하나로 충분
```

**§4 Python 예제** (L81):
```python
# 변경 전
async with CDP(port=9230) as cdp:  # M4는 9230

# 변경 후
async with CDP(port=9222) as cdp:  # 기본 포트
```

**§5 종료 예제** (L96):
```bash
# 변경 전
./cdp_setup.sh stop 9230   # 특정 포트 종료

# 변경 후
./cdp_setup.sh stop 9222   # 특정 포트 종료
```

### 5. `config/cdp/cdp_setup.sh` — L192~193

**변경 전:**
```
echo "  9230   | M4 (한)"
echo "  9231   | M2 (꾸)"
```

**변경 후:**
```
echo "  -------|------------------"
echo "  9222   | 기본 (단독 에이전트)"
echo "  9223   | 동시 가동 2번째"
echo "  9224   | 동시 가동 3번째"
echo "  9225   | 동시 가동 4번째"
echo ""
echo "전 디바이스 동일 체계. 단독이면 9222만."
```

### 6. `.claude/rules/cdp-browser.md` (본진)

본진 rules 파일에도 포트 배당표가 있으면 동일 원칙으로 수정.

---

## 수정 금지

- `ops/reports/REPORT_20260402_M2민아_CDP세팅완료_및_개선요청.md` — **세션 기록, append-only**

---

## 커밋 + push

### works 서브모듈 커밋 + push:

```bash
cd monkos-ops/works
git add -A
git commit -m "[fix] CDP 포트 배당 교정 — 디바이스별 분기 폐지, 전 디바이스 9222 통일"
git push origin main
```

### 본진 서브모듈 참조 갱신:

```bash
cd /Users/developer/monk_project
git add monkos-ops/works
git commit -m "[sync] works submodule — CDP 포트 배당 교정 반영"
```

---

## 검증

```bash
cd monkos-ops/works
grep -rn "9230\|9231" --include="*.md" --include="*.sh" . | grep -v "ops/reports/"
```
→ 0건이어야 함 (보고서 제외)

---

## ⚠️ 준수 조항

- 세션 기록(ops/reports/) 수정 절대 금지
- 완료 보고 `✅❌💡⏳📁🔀` 형식
