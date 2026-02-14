# docs/corpus/legacy/ 인덱스

**최종 업데이트**: 2026-02-15
**보존 기한**: 2026-12-31
**상태**: 폐기 예정 (Archive)

---

## 개요

2026년 1월 이전 레거시 문서. Cursor IDE 시절 + Soul Sync 설계 이력.
Claude Code 전환 후 대부분 불필요하나, 설계 이력 참조용으로 보존.

---

## 파일 분류

### 1. Soul Sync (컨텍스트 동기화 시스템)

| 파일 | 크기 | 상태 | 설명 |
|------|------|------|------|
| `README_SOUL_SYNC.md` | 6KB | 폐기 | Soul Sync 개요 |
| `SOUL_ARCHITECTURE.md` | 8KB | 참조 가능 | 아키텍처 설계 |
| `SOUL_SYNC_QUICKSTART.md` | 3KB | 폐기 | 빠른 시작 가이드 |
| `RND_SOUL_SYNC_DESIGN_JOURNEY.md` | 28KB | 참조 가능 | 설계 여정 기록 |
| `SYNC_STRATEGY.md` | 2KB | 폐기 | 동기화 전략 |

**결론**: Claude Code JSONL 세션으로 대체됨. 설계 철학만 참조 가치 있음.

---

### 2. Cursor IDE 관련

| 파일 | 크기 | 상태 | 설명 |
|------|------|------|------|
| `CURSOR_AI_COLLABORATION_GUIDE.md` | 25KB | 폐기 | Cursor 협업 가이드 |
| `CURSOR_BACKUP_STRATEGY.md` | 8KB | 폐기 | 백업 전략 |
| `cursorrules_20260207.md` | 20KB | 폐기 | .cursorrules 백업 |
| `cursorignore_20260207.txt` | 1KB | 폐기 | .cursorignore 백업 |
| `cursor_session_20260108_evening.txt` | 9KB | 폐기 | 세션 로그 |

**결론**: Cursor → Claude Code 전환 완료. 전부 폐기 대상.

---

### 3. 컨텍스트 복구 기록

| 파일 | 크기 | 상태 | 설명 |
|------|------|------|------|
| `CONTEXT_RECOVERY_REPORT_2026-01-08.md` | 6KB | 참조 가능 | 복구 리포트 |
| `RECOVERED_CONTEXT_2026-01-08.md` | 35KB | 폐기 | 복구된 컨텍스트 |
| `REBOOT_BACKUP_20260111.md` | 4KB | 폐기 | 리붓 백업 |
| `monk_master_context.txt` | **15MB** | 삭제 검토 | 거대 컨텍스트 덤프 |

**결론**: `monk_master_context.txt`는 15MB로 Git에 부담. 삭제 또는 GCS 이동 권장.

---

### 4. 프로젝트 기록

| 파일 | 크기 | 상태 | 설명 |
|------|------|------|------|
| `_START_HERE.md` | 0.5KB | 폐기 | 구 시작점 |
| `ARCHIVE_INVENTORY.md` | 12KB | 참조 가능 | 아카이브 목록 |
| `CURRENT_STATUS.md` | 5KB | 폐기 | 구 상태 (2026-01) |
| `PROJECT_COMPLETION_REPORT.md` | 11KB | 참조 가능 | 완료 보고서 |
| `FINAL_DECISION_20260112.md` | 10KB | 참조 가능 | 최종 결정 기록 |
| `FINAL_STRATEGY_GPU.md` | 5KB | 참조 가능 | GPU 전략 |
| `REVIEW_SSANGA_RESPONSE.md` | 6KB | 폐기 | 쌍아 응답 리뷰 |

---

### 5. 백업 폴더

| 폴더 | 상태 | 설명 |
|------|------|------|
| `backup_json/` | 폐기 | JSON 백업 |
| `backup_markdown/` | 폐기 | Markdown 백업 |

---

## 액션 플랜

### 즉시 (2026-02)
- [ ] `monk_master_context.txt` (15MB) → GCS 이동 또는 삭제

### 2026년 말
- [ ] "폐기" 표시 파일 전체 삭제
- [ ] "참조 가능" 파일 → `docs/infrastructure/archive/`로 이동

### 보존 대상 (infrastructure로 마이그레이션 고려)
1. `RND_SOUL_SYNC_DESIGN_JOURNEY.md` - 설계 철학
2. `FINAL_DECISION_20260112.md` - 의사결정 기록
3. `PROJECT_COMPLETION_REPORT.md` - 프로젝트 이력

---

## 주의사항

- 이 폴더는 **GCS 동기화 대상**이나, 15MB 파일로 인해 비용 발생 가능
- 새 문서 추가 금지 (legacy 폴더는 읽기 전용)
- 참조 시 최신 버전은 `docs/infrastructure/` 확인
