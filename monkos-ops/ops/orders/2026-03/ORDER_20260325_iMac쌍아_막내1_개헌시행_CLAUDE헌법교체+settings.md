---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내1
subject: 개헌 시행 ① — CLAUDE.md 헌법 5축 교체 + settings.json deny 이동 + 경계일자
priority: 최고
related: governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md
---

# 지시서 — 개헌 시행 ① CLAUDE.md 헌법 교체 + settings.json

**[2026-03-25 15:00 KST] iMac/쌍아 → 막내1**

---

## 배경

헌법 5축 재편 개헌안이 만장일치로 확정되었다. 본 지시서는 CLAUDE.md 헌법 본문 교체와 settings.json deny 이동을 실행한다.

---

## 작업 1: CLAUDE.md 헌법 본문 교체

### 입력

- 개헌 청구안의 §3 "신규 헌법 전문 (초안)": `governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md`
- 현행 CLAUDE.md의 헌법 부분: `# MONK.KR 프로젝트 헌법` ~ `## 법률 인덱스` 직전까지

### 실행

1. 현행 CLAUDE.md를 Read
2. `## 헌법 — 제1조~제7조` 부터 법률 인덱스 테이블 직전까지를 **개헌 청구안 §3의 5축 본문으로 교체**
3. 섹션 헤더를 `## 헌법 — 5축 체계` 로 변경
4. **제5조(메타) 1항 문서 위계 테이블**: 청구안의 보정된 4계층 버전 사용 (헌법/법률/명령/규정 4행)
5. 제5조(메타)에 **동기화 의무** 1줄 추가:
   ```
   - 법률 개정 시 대응하는 `.claude/rules/` 및 `.claude/skills/` 파일을 동시 갱신한다.
   ```
6. 법률 인덱스, 규정 참조 테이블은 **현행 유지** (변경 없음)

### 경계일자 추가

7. CLAUDE.md의 규정 참조 테이블 아래, 파일 최하단에 다음을 추가:

```markdown
---

## 개정 이력

> 개정: 03-25 — 헌법 5축 재편 (7조→5조 위상 정렬, 정본 단일 원칙 신설, 4계층 문서 위계 확장). 만장일치, AMENDMENT_20260325
> ⚠️ 2026-03-25 이전 문서의 "헌법 N조" 참조는 구(舊) 7조 체계 기준이다. 매핑: governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md §4
```

---

## 작업 2: settings.json deny Git 공유 이동

### 현황

- `.claude/settings.json` (Git 공유): allow 2건만, deny 없음
- `.claude/settings.local.json` (로컬): deny 5건 포함

### 실행

1. `.claude/settings.json`을 Read
2. 다음 deny 규칙을 추가 (기존 allow는 유지):

```json
{
  "permissions": {
    "allow": [기존 유지],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(git clean -f *)",
      "Bash(git checkout -- *)"
    ]
  }
}
```

3. `.claude/settings.local.json`의 deny는 **삭제하지 않고 그대로 둔다** (이중 보호)

---

## 검증

- [ ] CLAUDE.md가 200줄 이하인지 확인 (`wc -l CLAUDE.md`)
- [ ] 5축 본문의 조번호가 1~5조로 정확한지
- [ ] settings.json이 유효한 JSON인지 (`cat .claude/settings.json | python3 -m json.tool`)
- [ ] 법률 인덱스, 규정 참조 테이블이 변경 없이 유지됐는지

## 산출물

- 수정된 CLAUDE.md
- 수정된 `.claude/settings.json`

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/비밀정보 절대 생성 금지
- 헌법 4조 2항: 파괴적 명령 금지
- 헌법 1조 1항: 타임스탬프 `date` 명령 취득
- 헌법 1조 2항: 완료 보고 필수
- **커밋하지 말 것** — 3건 지시서 전부 완료 후 쌍아가 통합 커밋 지시
