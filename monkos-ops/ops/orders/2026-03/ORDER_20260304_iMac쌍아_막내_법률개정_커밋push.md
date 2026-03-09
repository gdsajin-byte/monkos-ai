---
type: ORDER
date: 2026-03-04
from: iMac/쌍아
to: 막내 (단독)
priority: MEDIUM
scope: 법률 개정 커밋 + push
---

# 지시서: 법률 제3장 3조 신설 — 커밋+push

> **[2026-03-04 11:06 KST] iMac/쌍아 → 막내**

---

## 배경

세션 마감 시 push 승인 대기로 인한 누락이 반복됨. 작가님+쌍아 합의로 법률 제3장에 세션 마감 절차 조항(3조)을 신설하고, CLAUDE.md 세션 마감 섹션을 법률 참조로 격상함.

**변경 파일은 이미 수정 완료 상태**. 커밋+push만 수행.

---

## 변경된 파일

| 파일 | 변경 내용 |
|------|----------|
| `governance/laws/ch3_session_log.md` | 3조 신설 (세션 마감 절차: push 완료 = 마감), 기존 3조→4조 번호 이동 |
| `CLAUDE.md` | 세션 마감 절차 메모 → 법률 제3장 3조 참조로 격상 |

---

## 절차

### 1. 변경 확인
```bash
git diff governance/laws/ch3_session_log.md
git diff CLAUDE.md
```

### 2. 스테이징 + 커밋
```bash
git add governance/laws/ch3_session_log.md CLAUDE.md
git commit -m "[법률] ch3 3조 신설 — 세션 마감 시 push 완료 의무화

- ch3_session_log.md: 3조 세션 마감 절차 신설 (push 미완료=세션 미마감)
- CLAUDE.md: 세션 마감 절차 메모 → 법률 참조로 격상
- 근거: 2026-03-04 작가님+쌍아 합의

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 3. push
```bash
git push origin develop
```

---

## 완료 조건

- [ ] 두 파일 커밋 완료
- [ ] develop push 완료
- [ ] 커밋 태그: `[법률]`

## ⚠️ 준수 조항
- **헌법 제1조**: 타임스탬프 `date` 명령 취득
- **헌법 제2조**: 완료 보고 의무
- **헌법 제8조**: 파괴적 명령 금지

## 보고
- 형식: `[시각] iMac/막내 → iMac/쌍아`

---

**— iMac/쌍아 지시서 발행 완료 —**
