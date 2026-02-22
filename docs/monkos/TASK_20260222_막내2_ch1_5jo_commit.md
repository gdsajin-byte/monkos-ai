# 지시서: ch1 5조 세션 자동 인식 프로토콜 커밋

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내2

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 법률 제6장 (브랜치/커밋): develop 브랜치

## 배경
ch1 에이전트 체계에 5조(세션 자동 인식 프로토콜) 신설 완료. 쌍아가 직접 편집했으므로 커밋+push만 필요.

## 작업

### 1. 변경 파일 확인
```bash
git diff docs/infrastructure/laws/ch1_agent_system.md
```
- 5조 신설 확인 (VSCode extension → 쌍아 / CLI → 막내, hostname 매핑)

### 2. 커밋+push
```bash
git add docs/infrastructure/laws/ch1_agent_system.md
git commit -m "[법률] ch1 5조 신설 — 세션 자동 인식 프로토콜 (VSCode/CLI + hostname)"
git push origin develop
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `docs/infrastructure/laws/ch1_agent_system.md` |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
