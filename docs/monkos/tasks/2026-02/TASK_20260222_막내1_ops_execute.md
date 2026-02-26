# 지시서: monkos-ops/ 구조 변경 실행

```
[2026-02-22 16:07 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **이 작업은 ops/ 폴더 구조 변경 + README 심기 + 스크립트 경로 수정이다.**

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | monkos-ops/ 구조 변경 실행 |
| **대상** | `monkos-ops/` 폴더 + `scripts/session_watcher.sh` |
| **참고** | `docs/monkos/REPORT_20260222_ops_restructure.md` |
| **배포** | 없음 |
| **브랜치** | `develop` |

## 준수 조항

- **헌법 제8조**: 파괴적 명령 금지 — `rm -rf` 금지, `git mv` 사용
- **ch4 2조 7항**: README.md 미보유 폴더 방치 금지

---

## 작업 내역 (순서대로 실행)

### TASK 1: 05_공유 리네이밍 + kku 신설

```bash
# 1) hansong → han 리네이밍
git mv monkos-ops/05_공유/hansong monkos-ops/05_공유/han

# 2) kku 신설
mkdir -p monkos-ops/05_공유/kku/{inbox,outbox,reference}
touch monkos-ops/05_공유/kku/inbox/.gitkeep
touch monkos-ops/05_공유/kku/outbox/.gitkeep
touch monkos-ops/05_공유/kku/reference/.gitkeep
```

### TASK 2: 03_개발/specs/ 신설

```bash
mkdir -p monkos-ops/03_개발/specs/{portal,idphoto-kr,idphoto-jp,photolab,ai-models,infrastructure}
```

### TASK 3: session_watcher.sh 경로 수정

`monkos-ops/scripts/session_watcher.sh` 10번째 줄:

현행:
```bash
SESSIONS_DIR="$PROJECT_DIR/docs/corpus/sessions"
```

변경:
```bash
SESSIONS_DIR="$PROJECT_DIR/monkos-ops/06_로그/sessions"
```

이 한 줄만 수정. 나머지는 건드리지 않는다.

### TASK 4: README.md 13개 심기

아래 13개 폴더에 README.md를 생성한다. 각 README는 간결하게:
- 1줄 제목
- 역할 설명 (2~3줄)
- 네이밍 규칙 (해당 시)
- 정본 위치 (해당 시)

#### 필수 13개:

**1. monkos-ops/README.md**
```markdown
# monkos-ops — 운영 체계

프로젝트의 **운영 정본(live operational data)**이 모이는 곳.
docs/는 참고문헌, 여기는 운영체제.

| 영역 | 역할 |
|------|------|
| 01_전략 | 의사결정, 주간계획, 명령 |
| 02_리서치 | 시장/기술/자금 조사 |
| 03_개발 | 태스크, 리뷰, 릴리즈, 기술명세 |
| 04_문서 | IR자료, 보고서, 템플릿 |
| 05_공유 | 팀원 채널 (han/kku) |
| 06_로그 | 세션 로그(정본), 메트릭 |

> 법률 근거: ch4 4조 (monkos-ops 연동 규칙)
```

**2. monkos-ops/01_전략/README.md**
```markdown
# 01_전략 — 의사결정/명령/주간계획

작가님의 전략적 의사결정과 명령이 기록되는 곳.
정본 위치: 여기 (docs/infrastructure/strategy/는 참조용).

| 폴더 | 용도 |
|------|------|
| decisions/ | 의사결정 기록 (YYYYMMDD_topic.md) |
| orders/ | 작가님 명령 |
| weekly-plans/ | 주간 계획 |

⚠️ credentials_inventory.md 포함 — 외부 노출 주의
```

**3. monkos-ops/01_전략/decisions/README.md**
```markdown
# decisions — 의사결정 기록

네이밍: `YYYYMMDD_{topic}.md`
예시: `20260213_디딤돌_이의신청_전략.md`
```

**4. monkos-ops/02_리서치/README.md**
```markdown
# 02_리서치 — 시장/기술/자금 조사

리서치 결과물의 정본 위치. docs/rnd_2026/는 참조용.

| 폴더 | 용도 |
|------|------|
| market/ | 시장 조사 |
| tech/ | 기술 리서치 |
| funding/ | 자금/R&D/보조금 |
```

**5. monkos-ops/03_개발/README.md**
```markdown
# 03_개발 — 개발 영역

| 폴더 | 용도 |
|------|------|
| tasks/ | 작업 티켓 |
| reviews/ | 코드 리뷰, 포스트모템 |
| releases/ | 릴리즈 노트 |
| specs/ | 서비스별 기술 명세 (핵심 운영 스펙) |
```

**6. monkos-ops/03_개발/specs/README.md**
```markdown
# specs — 서비스별 기술 명세

docs/infrastructure/에서 핵심을 추출하여 서비스별로 체계화한 운영 스펙.

| 폴더 | 서비스 |
|------|--------|
| portal/ | monkos.ai 포털 |
| idphoto-kr/ | 한국 AI 증명사진 |
| idphoto-jp/ | 일본 AI 증명사진 |
| photolab/ | monk.kr 프로덕션 포토랩 |
| ai-models/ | AI 모델 명세 (코칭/QC/Imagen) |
| infrastructure/ | 인프라 공통 (GCS/배포/인증) |
```

**7. monkos-ops/04_문서/README.md**
```markdown
# 04_문서 — IR자료/보고서/템플릿

| 폴더 | 용도 |
|------|------|
| ir-materials/ | IR/투자 자료 |
| reports/ | 운영 보고서 |
| templates/ | 문서 템플릿 |
```

**8. monkos-ops/05_공유/README.md**
```markdown
# 05_공유 — 팀원 채널

팀원별 우체통 시스템. 각 채널에 inbox/outbox/reference.

| 채널 | 팀원 | 통신 방식 |
|------|------|----------|
| han/ | 한송이 | 텔레그램/Google Drive 경유 |
| kku/ | 와이프 | SSH + mailbox_watcher 경유 |
```

**9. monkos-ops/05_공유/han/README.md**
```markdown
# han — 한송이 채널

| 폴더 | 방향 | 용도 |
|------|------|------|
| inbox/ | 한→우리 | 한송이에게서 수거한 산출물 |
| outbox/ | 우리→한 | 한송이에게 전달 대기 파일 |
| reference/ | 읽기전용 | 한송이 참고자료 |

통신: 텔레그램 봇 또는 Google Drive 경유 (SSH 금지)
```

**10. monkos-ops/05_공유/kku/README.md**
```markdown
# kku — 꾸(와이프) 채널

| 폴더 | 방향 | 용도 |
|------|------|------|
| inbox/ | 꾸→우리 | 와이프에게서 수거한 파일 |
| outbox/ | 우리→꾸 | 와이프에게 전달 대기 파일 |
| reference/ | 읽기전용 | 참고자료 |

통신: SSH + mailbox_watcher.sh (M2 맥미니 100.93.220.17)
```

**11. monkos-ops/06_로그/README.md**
```markdown
# 06_로그 — 세션 로그(정본) + 메트릭

| 폴더 | 용도 | 상태 |
|------|------|------|
| sessions/ | **세션 로그 정본** | 활성 |
| metrics/ | 운영 지표 | 미사용 |
| orchestration/ | 오케스트레이션 로그 | 미사용 |

> docs/corpus/sessions/는 읽기전용 아카이브. 신규 로그는 여기에만 생성.
> 법률 근거: ch4 2조 4항, ch4 4조
```

**12. monkos-ops/06_로그/sessions/README.md**
```markdown
# sessions — 세션 로그 정본

이 폴더가 세션 로그의 **유일한 정본**.
docs/corpus/sessions/는 읽기전용 아카이브.

네이밍 패턴:
- 단일: `YYYY-MM-DD_{device}_{agent}.md`
- 통합: `YYYY-MM-DD_{agent}_통합.md`

예시: `2026-02-22_iMac_막내1.md`
```

**13. monkos-ops/scripts/README.md**
```markdown
# scripts — 운영 스크립트

| 스크립트 | 용도 | 실행 |
|----------|------|------|
| mailbox_watcher.sh | 꾸(M2) 우체통 파일 자동 전달 | `mk-mb` (tmux) |
| session_watcher.sh | 소넷이 세션 로그 자동 분석 | `mk-sw` (tmux) |
| ads_sync.py | GCS 광고 동기화 | 수동 |
| ads_upload.sh | MONKOS_ADS → GCS 업로드 | 수동 |
```

### TASK 5: 커밋 + push

```
[ops] monkos-ops 구조 변경 — han/kku + specs/ + README 13개 + session_watcher 경로

- 05_공유: hansong/ → han/ 리네이밍, kku/ 신설
- 03_개발: specs/ 서비스별 6개 서브폴더 신설
- session_watcher.sh: 정본 경로(06_로그/sessions/)로 수정
- README.md 13개 일괄 심기
지시서: TASK_20260222_막내1_ops_execute.md
```

---

## 금지 사항

- docs/ 하위 파일 수정 금지 (이 작업은 ops/만)
- 법률 파일 수정 금지 (별도 막내2 작업)
- CLAUDE.md 수정 금지
- `rm -rf` 금지 — 삭제는 없음, 생성과 이동만

## 완료 조건

1. hansong/ → han/ git mv 완료
2. kku/ inbox/outbox/reference 생성
3. 03_개발/specs/ 6개 서브폴더 생성
4. session_watcher.sh 경로 수정 (1줄)
5. README.md 13개 생성
6. develop 커밋 + push 완료
7. 완료 보고 발신
