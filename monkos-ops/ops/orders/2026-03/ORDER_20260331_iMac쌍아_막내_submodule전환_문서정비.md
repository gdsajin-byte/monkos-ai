---
type: order
from: iMac/쌍아
to: 막내
date: 2026-03-31
priority: 🟡 P2
subject: works subtree→submodule 전환 후속 — 법률·works CLAUDE.md 문서 정비
related: ORDER_20260331_iMac쌍아_막내_works_subtree→submodule전환.md
---

# 지시서: submodule 전환 문서 정비

**[2026-03-31 19:32 KST] iMac/쌍아 → 막내**

---

## 배경

works subtree→submodule 전환 완료 (65cb5e9). 코드/스크립트/MEMORY는 갱신됨.
법률 2건 + works CLAUDE.md에 "subtree" 문구가 잔존. 정합성 보정 필요.

---

## 작업 1: ch4_docs_structure.md — subtree→submodule (3곳)

파일: `governance/laws/ch4_docs_structure.md`

| 라인 영역 | 현재 | 수정 |
|----------|------|------|
| 198 | `(subtree)` | `(submodule)` |
| 212~214 | `works subtree` (2곳) | `works submodule` |

나머지 문맥(정본 원칙, 참조 원칙 등)은 변경 없음.

---

## 작업 2: ch1_agent_system.md — subtree→submodule (1곳)

파일: `governance/laws/ch1_agent_system.md`

| 라인 영역 | 현재 | 수정 |
|----------|------|------|
| 40 | `works subtree 한정 자유` | `works submodule 한정 자유` |

---

## 작업 3: works CLAUDE.md — submodule 안내 추가

파일: `monkos-ops/works/CLAUDE.md`

하단에 섹션 추가:

```markdown
---

## 연동 방식: git submodule

> 2026-03-31 subtree→submodule 전환. 팀원 clone에는 영향 없음.

- **본진(monk_project)**: `monkos-ops/works/`가 submodule로 연결
- **팀원 디바이스**: `~/Desktop/works/`에서 직접 `git pull` / `git push` (기존과 동일)
- **본진 동기화**: `scripts/mk-push.sh` / `scripts/mk-pull.sh`
- **M1 최초 1회**: `git pull` 후 `git submodule update --init` 실행 필요
```

works CLAUDE.md 수정 후 works 레포 내에서 커밋+push:
```bash
cd monkos-ops/works
git add CLAUDE.md
git commit -m "[docs] submodule 전환 안내 추가"
git push origin main
```

---

## 작업 4: MEMORY.md 잔존 문구 보정

파일: MEMORY.md (107~108행 부근)

| 현재 | 수정 |
|------|------|
| `main+subtree 동시` (2곳) | `main+submodule 동시` |

---

## ⚠️ 준수 조항

- 법률 수정은 문구 치환만 — 조항 구조/번호 변경 금지
- works CLAUDE.md 수정 후 works 레포에서 직접 commit+push (submodule 방식)

## 완료 기준

- [ ] ch4 subtree→submodule 3곳
- [ ] ch1 subtree→submodule 1곳
- [ ] works CLAUDE.md submodule 안내 섹션
- [ ] MEMORY.md 잔존 문구 2곳
- [ ] 커밋 + push
- [ ] 완료 보고 (`✅❌💡⏳📁🔀`)
