# docs/corpus/ 인덱스

**최종 업데이트**: 2026-02-15
**목적**: AI 코퍼스 (GCS 미러링 대상, Vertex AI RAG 소스)

---

## 폴더 구조

```
corpus/
├── sessions/           ← 일일 세션 로그 (쌍아/막내 대화)
├── claude_sessions/    ← 웹 Claude (철창이) 아카이브
├── gemini/             ← Gemini (용아) 대화 기록
├── factory/            ← Windows 공장 로그 (계획 중)
├── bwya/               ← BWYA Academy 자료
├── notebookLM/         ← NotebookLM 노트
└── legacy/             ← 레거시 문서 (폐기 예정)
```

---

## 폴더별 상세

### sessions/ (세션 로그)

일일 대화 기록. 시계열 추적 가능.

```
sessions/
├── 2026-01/           (24개 파일)
│   └── 20260124_session.md
└── 2026-02/           (15개 파일)
    └── 20260215_session.md
```

**네이밍**: `YYYYMMDD_session.md`
**규칙**: Append only, Q&A 번호 연속 증가
**참조**: `CLAUDE.md` 세션 로그 규칙

---

### claude_sessions/ (철창이 아카이브)

웹 Claude 대화에서 추출한 전략/마케팅 문서.

```
claude_sessions/
├── strategy/          ← 경쟁사 분석, 글로벌 전략 (권장 참조)
├── marketing/         ← 마케팅 채널 전략
├── certifications/    ← AI 인증 자료
└── templates/         ← 재사용 템플릿
```

**주의**: R&D 문서는 `docs/rnd_2026/`에 원본 보관 (여기에 중복 저장 금지)

---

### gemini/ (용아 대화)

Gemini 전략 대화 기록. 15M+ 토큰.

```
gemini/
└── yonga_conversations/
```

---

### factory/ (공장 로그)

Windows 4060 자동화 로그. **현재 계획 단계**.

```
factory/
├── README.md          ← 구조 계획
└── (날짜별 로그 예정)
```

**트리거**: Windows 자동화 활성화 시 구현

---

### legacy/ (레거시)

폐기 예정 또는 역사 자료.

- Soul Sync 관련 (`SOUL_SYNC_*.md`)
- Cursor IDE 가이드 (`CURSOR_*.md`)
- 설계 이력 (`RND_*.md`)

**보존 기한**: 2026년 말
**조치 예정**: 필수 문서는 `infrastructure/`로 마이그레이션

---

## GCS 동기화

```bash
# 로컬 → GCS 업로드
gsutil -m rsync -r docs/corpus/ gs://monk-project/corpus/

# GCS → 로컬 다운로드
gsutil -m rsync -r gs://monk-project/corpus/ docs/corpus/
```

---

## 검색 팁

| 찾는 내용 | 위치 |
|----------|------|
| 기술 발견, 코딩 작업 | `sessions/` |
| 전략, 경쟁사 분석 | `claude_sessions/strategy/` |
| 마케팅 채널 | `claude_sessions/marketing/` |
| R&D 보고서 | `docs/rnd_2026/` (corpus 아님!) |
| 과거 설계 논의 | `legacy/` |

---

## 관련 문서

- 아키텍처: `docs/infrastructure/architecture/3TRACK_SYSTEM_ARCHITECTURE.md`
- GCS 구조: `docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md`
- 세션 가치: `docs/infrastructure/guides/SESSION_LOG_VALUE.md`
