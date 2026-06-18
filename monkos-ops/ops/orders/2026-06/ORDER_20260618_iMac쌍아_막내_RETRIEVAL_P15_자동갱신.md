---
type: order
date: 2026-06-18
from: iMac/쌍아
to: iMac/막내
portfolio: PF_RETRIEVAL
status: 대기
---

# 지시서: PF_RETRIEVAL P1.5 — 인덱스 자동 갱신 루틴

> **[2026-06-18 14:03 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-06-18 14:03 KST

---

## 목적

P1 관계 인덱스 MVP가 06/15 빌드 이후 정지 상태. 문서가 매일 쌓이는데 인덱스가 갱신되지 않으면 죽은 인프라. 세션 시작 시 자동으로 인덱스를 리빌드하여 항상 최신 상태를 유지한다.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿/API키 생성·추측 금지
- 기존 `build_index.js`, `search.js` 로직 변경 금지 — 연동만 추가

---

## 작업 항목

### 1. mk-push.sh에 인덱스 리빌드 단계 추가

`scripts/mk-push.sh`의 main push 직전에 인덱스 리빌드를 삽입한다.

```bash
# === [0/3] retrieval 인덱스 리빌드 ===
echo "=== [0/3] retrieval 인덱스 리빌드 ==="
(cd scripts/retrieval && node build_index.js) || echo "⚠️ 인덱스 빌드 실패 — push는 계속"
```

- 빌드 실패해도 push를 막지 않는다 (인덱스는 부가 기능).
- monk_index.db는 .gitignore에 이미 있으므로 커밋 대상 아님 확인.

### 2. .gitignore 확인

`scripts/retrieval/monk_index.db`, `monk_index.db-shm`, `monk_index.db-wal`이 .gitignore에 포함되어 있는지 확인. 없으면 추가.

### 3. 빌드 스크립트 스캔 범위 확장

현재 `build_index.js`는 `monkos-ops/`만 스캔한다 (ROOT = `monkos-ops`). 다음 디렉토리도 스캔 대상에 추가:

- `governance/` — 법률, 헌법, 개헌 청구 등
- `docs/` — 참고문헌/아카이브

```javascript
// ROOT 단일 → 복수 디렉토리 스캔
const SCAN_DIRS = [
  path.resolve(__dirname, '../../monkos-ops'),
  path.resolve(__dirname, '../../governance'),
  path.resolve(__dirname, '../../docs'),
];
```

각 디렉토리별 `scanMarkdownFiles()`를 호출하고 결과를 합친다. 존재하지 않는 디렉토리는 조용히 스킵.

### 4. 빌드 결과 로깅

빌드 완료 시 문서 수/PF 수를 한 줄로 출력 (기존 console.log 유지). 이전 빌드 대비 증감도 표시하면 좋으나 필수 아님.

---

## 검증

- [ ] `scripts/mk-push.sh` 실행 시 인덱스 리빌드 로그 출력 확인
- [ ] `node scripts/retrieval/search.js --query "헤드텀"` → 오늘(06/18) 제안서/지시서 검색 확인
- [ ] `node scripts/retrieval/search.js --pf PF_RETRIEVAL` → P1.5 지시서 본건 포함 확인
- [ ] governance/ 문서도 검색 가능 확인 (예: `--query "헌법"`)
- [ ] monk_index.db가 git tracked 아닌지 확인

---

## 완료 보고

- 수발신 헤더 필수
- PF_RETRIEVAL 히스토리 1행 어펜드
- 세션 로그 어펜드
