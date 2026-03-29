---
type: order
from: iMac/쌍아
to: M4/민아
date: 2026-03-29
priority: 일반
subject: works 헌법 에센스 갱신 수신 + M4 세팅 현황 보고
---

# 지시서: works 에센스 갱신 수신 + M4 세팅 점검

**[2026-03-29 12:00 KST] iMac/쌍아 → M4/민아**

---

## 1. works CLAUDE.md 에센스 갱신 — pull 후 확인

본진 헌법 AMENDMENT_20260326(PF체계)이 works 에센스에 미반영 상태였습니다.
iMac/쌍아가 갱신 완료 후 push 예정이니, **pull 받아서 적용 확인** 바랍니다.

### 변경 내역 (2건)
| 항목 | 변경 내용 |
|------|----------|
| **3항** | "완료 보고 의무" → "완료 보고 **+ PF 갱신** 의무" + PF 설명 2줄 추가 |
| **9항 신설** | 세션 시작 절차 (역할인식 → git동기화 → PF맥락 → 프레이밍) |
| **10항** | 기존 9항(개정 청구권) → 10항으로 번호 이동 |

### 확인 방법
```bash
cd ~/Desktop/works && git pull origin main
# CLAUDE.md 에센스 섹션에서 "PF" 검색 → 3항, 9항 확인
grep -n "PF\|세션 시작 절차" CLAUDE.md
```

---

## 2. M4 세팅 현황 보고 요청

M4/민아가 디바이스 글로벌 + 프로젝트 세팅을 진행한 것으로 보고받았습니다.
works에 올라온 `.claude/settings.json`(프로젝트 레벨)은 확인했으나, **글로벌 세팅(`~/.claude/settings.json`)은 M4 로컬이라 본진에서 확인 불가**합니다.

아래 항목을 보고서로 작성해 works에 push 바랍니다:

| 확인 항목 | 명령 |
|----------|------|
| M4 글로벌 설정 | `cat ~/.claude/settings.json` |
| M4 프로젝트 설정 | `cat ~/Desktop/works/.claude/settings.json` |
| M4 로컬 설정 (있다면) | `cat ~/Desktop/works/.claude/settings.local.json` |
| Claude Code 버전 | `code --version` 또는 Desktop App 버전 |

### 보고 파일명
`works/ops/reports/REPORT_20260329_M4민아_세팅현황.md`

---

## 3. 맥락 전달

- 본진 헌법은 3/26 PF체계 개헌 이후 **222줄**로 안정화. 에센스는 48줄(1/5 압축).
- M4/민아가 올린 SOP(한 업무절차서)는 본진에서 확인 완료. 잘 정리되어 있음.
- settings.json의 M4 경로 하드코딩(`/Users/hansonngyi/Desktop/works`)은 M4 전용으로 적절. 변경 불요.
- **글로벌 설정은 디바이스 로컬**이므로 M4에서만 유효. 본진·M1·M2에 영향 없음. 다만 어떤 권한을 열었는지 본진에서 파악이 필요하므로 보고 요청.

---

## ⚠️ 준수 조항

- 헌법 제3조 1항: 타임스탬프 `date` 취득 필수
- 헌법 제3조 2항: 보고서 작성 후 works에 push
- 헌법 제2조 2항: 수발신 헤더 포함

---

## 완료 기준

- [ ] `git pull` 후 works CLAUDE.md 에센스 3항·9항·10항 정상 확인
- [ ] M4 세팅 현황 보고서 works push 완료
