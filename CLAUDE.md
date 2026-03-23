# monkos-works — 팀 소통 채널

> **MONKOS** 팀의 산출물 공유 레포.
> 이 파일을 읽고 있다면 너는 이 레포를 클론한 에이전트다.

---

## 이 레포의 역할

```
각 디바이스 에이전트 (코웍이/한/꾸)
    → ~/Desktop/works/ 에 클론
    → 산출물 작성 후 git push

쌍아/막내 (monk_project 본진)
    → monkos-ops/works/ subtree pull 로 수신
    → 처리 후 subtree push 로 회신
```

**monk_project 본진은 홈 바깥** (`/Users/developer/`) → 팀원 직접 접근 불가.
이 레포가 그 경계를 잇는 소통 채널이다.

---

## 에이전트 역할

| 에이전트 | git 권한 | 주요 역할 |
|----------|----------|----------|
| **코웍이** (M1/M4/M2) | push 가능 | 전략 보고서, 지시서 초안, 세션 로그 |
| **한** (M4) | push 가능 | SNS·마케팅 콘텐츠, 채널 기획 |
| **꾸** (M2) | push 가능 | 생활·업무 자동화 산출물 |
| **철창이** | push 불가 (샌드박스) | 전략 초안 → 작가님 수동 배치 → 쌍아 사후보정 |
| **쌍아** | subtree pull/push | 수신·처리·회신 (본진 측) |

---

## 디바이스 자동 인식

세션 시작 시 `scutil --get ComputerName` 으로 디바이스 판별.
불확실하면 추정 금지 — 작가님에게 확인 후 진행.

---

## 폴더 구조

```
works/
├── ops/                    # 운용 소통
│   ├── orders/             # 지시서 (코웍이→쌍아)
│   ├── reports/            # 전략 보고서
│   └── sessions/           # 세션 로그
├── han/                    # M4/한 산출물 (SNS·마케팅)
├── kku/                    # M2/꾸 산출물 (생활·업무 자동화)
├── crop/                   # 크롭앱 프로젝트 자료
├── idphoto/                # 증명사진 앱 자료
├── portal_v4/              # 포털 v4 자료
├── blog/                   # 블로그 콘텐츠
├── images/                 # 이미지 자산
├── config/                 # SEO·브랜드 설정 파일
└── rnd/                    # R&D 자료
```

---

## 파일 네이밍 규칙

| 유형 | 패턴 |
|------|------|
| 지시서 | `ORDER_YYYYMMDD_{발신}→{수신}_{주제}.md` |
| 보고서 | `REPORT_YYYYMMDD_{에이전트}_{주제}.md` |
| 전략 | `STRATEGY_YYYYMMDD_{에이전트}_{주제}.md` |
| 스펙 | `SPEC_YYYYMMDD_{주제}.md` |
| 세션 로그 | `YYYY-MM-DD_{디바이스}_{에이전트}_세션로그.md` |
| 기획서 | `PROPOSAL_YYYYMMDD_{주제}.md` |
| 참고자료 | `REF_YYYYMMDD_{주제}.md` |

---

## git 규칙 (코웍이/한/꾸)

```bash
# 세션 시작 시 반드시 pull 먼저
git pull origin main

# 커밋
git add {파일명}   # 전체 add 전 내용 확인 필수
git commit -m "[works] {주제} — {한줄요약}"
git push origin main
```

**커밋 태그:** `[works]` 일반 / `[order]` 지시서 / `[report]` 보고서 / `[session]` 세션로그

**금지:** `git push --force` / 민감정보 커밋 / `.env` 포함 전체 add

---

## 철창이 산출물 처리

철창이는 git push 불가 → 작가님이 `~/Desktop/works/` 에 수동 배치.

처리 흐름:
1. 철창이 산출물 → 작가님 배치
2. 쌍아가 `git pull` 후 확인
3. 쌍아가 타임스탬프·frontmatter 보정 후 커밋
4. 커밋 메시지에 출처 명시: `원본: 철창이 / 시각보정: M1/쌍아`

---

## 세션 시작 루틴

1. `scutil --get ComputerName` — 디바이스 확인
2. `git pull origin main` — 최신 동기화
3. `ops/sessions/` 최신 로그 읽기
4. 관련 프로젝트 `CONTEXT_*.md` 읽기
5. 작업 시작

---

## 수발신 헤더

모든 공식 문서 첫 줄:
```
[YYYY-MM-DD HH:MM KST] {디바이스}/{에이전트} → {수신자}
```
타임스탬프는 `date '+%Y-%m-%d %H:%M KST'` 로 취득. 추정 금지.
