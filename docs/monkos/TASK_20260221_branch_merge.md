# 지시서: main↔develop 브랜치 통합 + 브랜치 전략 확립

```
[2026-02-21 11:35 KST] iMac/쌍아 → 막내
```

## 역할 선언

> **너는 "막내"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내 → iMac/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | main↔develop 브랜치 통합 정리 |
| **브랜치** | `develop` (작업), `main` (머지 대상) |
| **긴급도** | **높음** — 양방향 분기 67+47커밋, 방치 시 격차 확대 |

## ⚠️ 준수 조항

- **헌법 제8조**: 파괴적 명령 절대 금지 (`--force`, `reset --hard`, `clean -f`)
- **법률 제6장**: 브랜치/커밋 규칙

---

## 배경

2/19 17:56 (`96b29a1`) 이후 main과 develop이 양방향 분기.
- **develop +67커밋**: photolab 기능 개발 (코칭/퍼널/카메라/CF Functions)
- **main +47커밋**: n8n/마케팅 인프라/command 우체통/docs

드라이런 결과: **충돌 없이 auto-merge 가능** 확인 완료.

---

## 작업 순서

### STEP 1: develop에 main 합류

```bash
git checkout develop
git pull origin develop
git merge origin/main --no-ff -m "[merge] main → develop 통합 (2/19~2/21 분기 해소)"
```

- 충돌 발생 시: 파일별로 확인 후 해결 (양쪽 변경 모두 살릴 것)
- `.gitignore`, `monkos_AI/idphoto-kr/public/index.html`만 auto-merge 대상 (드라이런 확인)

### STEP 2: develop 검증

```bash
# 머지 후 주요 파일 존재 확인
ls functions/api/          # CF Functions 전원 존재?
ls MONK_kr/ai_lab/photolab/  # photolab 파일 전원 존재?
ls monkos-ops/             # ops 구조 온전?
```

### STEP 3: develop → main 머지

```bash
git checkout main
git pull origin main
git merge develop --no-ff -m "[merge] develop → main 통합 완료 — 프로덕션 동기화"
```

### STEP 4: 양쪽 push

```bash
git push origin main
git checkout develop
git push origin develop
```

### STEP 5: 동기화 확인

```bash
git log --oneline main..develop   # 0이어야 함
git log --oneline develop..main   # 0이어야 함
```

---

## 머지 후 브랜치 전략 (이후 영구 적용)

```
작업 → develop에서만 작업/push
        ↓
develop에서 검증 완료
        ↓
develop → main 머지 (--no-ff)
        ↓
main = 프로덕션 정본
```

**main direct push 금지** — 모든 변경은 develop 경유.
작가님이 "프로덕션으로 가라" 지시 시에도 develop commit → main merge 순서 준수.

---

## 금지 사항

- `git push --force` 절대 금지
- `git reset --hard` 절대 금지
- 머지 중 한쪽 변경 임의 폐기 금지 (양쪽 다 살릴 것)
- main 브랜치에 직접 commit 금지

---

## 완료 조건

1. `main..develop` = 0커밋, `develop..main` = 0커밋
2. 주요 파일/폴더 존재 확인 완료
3. 양쪽 push 완료
4. 완료 보고 발신
