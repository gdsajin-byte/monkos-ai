---
name: 레지스트리편입
description: 에이전트, 디바이스, 서비스 등 6종 편입 절차를 수행한다
---

> 원천: ch4 6조 (레지스트리 확장 절차)

## 레지스트리 편입 절차

신규 편입 대상에 따라 해당 절차를 수행한다.

### 유형 1 — 에이전트 편입

1. 작가님 승인을 확인한다.
2. `governance/laws/ch1_agent_system.md` 1조 테이블에 행을 추가한다 (약칭/운용자/모델/환경/역할).
3. ch1 4조 수발신 예시에 반영한다.
4. 근거 라인에 편입 일자를 기록한다.

### 유형 2 — 디바이스 편입

1. 작가님 승인을 확인한다.
2. 물리 합류를 확인한다:
   - Tailscale 네트워크 합류: `tailscale status` 로 IP 실측.
   - 미합류 시: 약칭에 `(예정)` 표기 → 합류 완료 시 해제.
3. ch1 4조 디바이스 약칭에 추가한다.
4. ch1 5조 hostname 매핑 테이블에 추가한다.
5. MEMORY.md 인프라 섹션에 IP/계정을 기록한다.

### 유형 3 — 서비스 편입

1. 작가님 승인을 확인한다.
2. `governance/laws/ch4_docs_structure.md` 5조 서비스 약칭 레지스트리에 등록한다.
3. `monkos-ops/tech/specs/{서비스}/` 폴더 + README.md를 생성한다 (정본).
4. `docs/specs/{서비스}/` — 생성 불필요 (아카이브 동결).

### 유형 4 — 폴더 편입

1. 해당 루트 체계에 따라 트리 문서를 갱신한다:
   - docs/ 하위: ch4 1조 트리에 추가.
   - monkos-ops/ 하위: `monkos-ops/README.md` 구조표에 추가.
   - governance/ 하위: `governance/README.md` 구조표에 추가. 헌법 개정 절차 준용.
2. README.md를 동시 생성한다 (ch4 2조 7항 의무).
3. 정본/참조 위치 해당 시 ch4 4조 테이블을 갱신한다.

### 유형 5 — 파일유형 편입

1. `governance/laws/ch4_docs_structure.md` 3조 패턴 테이블에 행을 추가한다.
2. 필드 허용값을 정의한다 ({agent}, {device}, {service} 등).
3. 대상 폴더를 지정한다.
4. ch4 7조 YAML 규격의 type 허용값에 등록 + 타입별 필수 필드를 정의한다.

### 유형 6 — 에셋 편입

1. 에셋 카테고리를 판정한다: CODE / BIN / DATA / SEC / GOV / OPS / LEGACY.
2. 저장소를 배정한다:
   - 코드/문서 → Git
   - 바이너리/미디어 → GCS 또는 R2
   - DB 레코드 → D1 또는 Firestore
   - 시크릿 → 환경변수 (절대 Git 금지, 헌법 4조)
3. `monkos-ops/tech/ASSET_REGISTRY.md` 해당 카테고리 테이블에 행을 추가한다.
4. 상세 문서 해당 시 참조 링크를 기재한다 (GCS_BUCKET_STRUCTURE.md 등).
