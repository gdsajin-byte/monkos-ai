# 지시서: monkos-ops/ 체계화 보고서 작성

```
[2026-02-22 15:53 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **이 작업은 보고서 작성이다. 코드/배포 금지. 파일 이동/삭제 금지.**

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | monkos-ops/ 체계화 보고서 |
| **산출물** | `docs/monkos/REPORT_20260222_ops_restructure.md` (1개) |
| **배포** | 없음 |
| **브랜치** | `develop` |

## 준수 조항

- **헌법 제8조**: 파괴적 명령 금지 — 파일 이동/삭제/리네이밍 실행 금지 (보고서만)
- **코드/배포 절대 금지**
- 기존 파일 수정 금지

---

## 확정 결정사항 (작가님 승인 완료)

1. **ops/ = 운영체제**, docs/ = 참고문헌
2. **05_공유**: hansong/ → `han/` 리네이밍, `kku/` 신설
3. **03_개발**: `specs/` 하위에 서비스별 기술 명세 체계화
4. **세션로그 정본**: `monkos-ops/06_로그/sessions/`
5. **session_watcher.sh**: 감시 경로를 정본으로 변경 필요
6. **README.md**: 모든 폴더 필수 (ch4 2조 7항)
7. docs/infrastructure/ 58건 → 핵심 추출 → ops/03_개발/specs/ 체계화 (단순 이동 아닌 큐레이션)

---

## 작업 내역

### TASK 1: 현황 수집

아래를 전부 읽어라:

1. **ops/ 전체 디렉토리 트리**: `monkos-ops/` 하위 폴더+파일 전수 조사
2. **ops/ 내 실질 파일**: .gitkeep 제외, 실제 콘텐츠 있는 파일 목록 + 1줄 요약
3. **docs/infrastructure/ 58건**: 파일 목록 + 각 파일의 카테고리 추정 (architecture/deployment/ai-models/strategy/guides 중)
4. **session_watcher.sh**: 현행 감시 경로 확인
5. **개정된 ch4 법률**: `docs/infrastructure/laws/ch4_docs_structure.md` — 4조 체계 확인

### TASK 2: 보고서 작성

보고서 파일: `docs/monkos/REPORT_20260222_ops_restructure.md`

```markdown
# monkos-ops/ 체계화 보고서

## 1. 현행 ops/ 현황

### 1.1 디렉토리 전체도
(현재 폴더 트리)

### 1.2 실질 파일 인벤토리
| 영역 | 파일 | 요약 |
|------|------|------|
| 01_전략 | credentials_inventory.md | ... |
| ... | | |

### 1.3 빈 영역 (gitkeep만)
(02_리서치, 03_개발/tasks, 04_문서 등)

## 2. 변경 계획

### 2.1 05_공유 리네이밍
- `hansong/` → `han/` (git mv)
- `kku/` 신설 (inbox/outbox/reference + README.md)
- 영향 범위: mailbox_watcher.sh 경로 수정 필요 여부

### 2.2 03_개발/specs/ 신설
현재 03_개발:
```
03_개발/
├── tasks/
├── reviews/
└── releases/
```

변경안:
```
03_개발/
├── tasks/
├── reviews/
├── releases/
└── specs/          ← 신설
    ├── portal/
    ├── idphoto-kr/
    ├── idphoto-jp/
    ├── photolab/
    ├── ai-models/
    └── infrastructure/
```

### 2.3 docs/infrastructure/ 58건 큐레이션 계획

핵심 추출 대상 (ops/03_개발/specs/로 승격):
| 파일 | 현재 위치 | 이관 대상 | 비고 |
|------|----------|----------|------|
| ... | docs/infrastructure/ | ops/03_개발/specs/... | 핵심 명세 |

참고문헌으로 잔류:
| 파일 | 위치 유지 | 이유 |
|------|----------|------|
| ... | docs/infrastructure/guides/ | 가이드 성격 |

### 2.4 session_watcher.sh 경로 수정
- 현행: `SESSIONS_DIR="$PROJECT_DIR/docs/corpus/sessions"`
- 변경: `SESSIONS_DIR="$PROJECT_DIR/monkos-ops/06_로그/sessions"`

### 2.5 README.md 심기 계획
ops/ 하위 폴더 중 README 필요한 곳 전수 목록:
| 폴더 | README 내용 요약 |
|------|----------------|
| monkos-ops/ (루트) | 운영체제 최상위 안내 |
| 01_전략/ | 의사결정/주간계획/명령 |
| ... | |

## 3. 실행 순서

| 순번 | 작업 | 위험도 | 예상 시간 |
|------|------|--------|----------|
| 1 | 05_공유 git mv + kku 신설 | 낮음 | 2분 |
| 2 | 03_개발/specs/ 폴더 신설 | 없음 | 1분 |
| 3 | session_watcher.sh 경로 수정 | 낮음 | 1분 |
| 4 | README.md 일괄 심기 | 없음 | 10분 |
| 5 | docs/infrastructure/ 큐레이션 | 중간 | 별도 지시서 |

## 4. 작가님 판단 필요 사항
(카테고리 오분류 가능성 있는 항목, 잔류/이관 경계 파일 등)
```

### TASK 3: 커밋 + push

```
[docs] monkos-ops 체계화 보고서 — 현황 인벤토리 + 변경 계획

- ops/ 실질 파일 인벤토리
- 05_공유 han/kku 리네이밍, 03_개발/specs 신설 계획
- docs/infrastructure/ 58건 큐레이션 대상 분류
- session_watcher.sh 경로 수정안
- README 심기 전수 목록
지시서: TASK_20260222_막내1_ops_restructure_report.md
```

---

## 금지 사항

- 파일 이동/삭제/리네이밍 **실행 금지** (보고서에 계획만 작성)
- 코드 수정/배포 금지
- 기존 보고서/지시서 수정 금지
- session_watcher.sh 수정 금지 (계획만)

## 완료 조건

1. `REPORT_20260222_ops_restructure.md` 작성 완료
2. ops/ 실질 파일 전수 인벤토리
3. docs/infrastructure/ 58건 카테고리 분류 (이관/잔류 구분)
4. 변경 실행 순서 + 위험도 평가
5. README 심기 전수 목록
6. develop 커밋 + push 완료
7. 완료 보고 발신
