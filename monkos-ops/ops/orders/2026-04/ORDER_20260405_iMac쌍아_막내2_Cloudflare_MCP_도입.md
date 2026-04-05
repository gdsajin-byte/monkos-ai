---
type: order
from: iMac/쌍아
to: iMac/막내2
date: 2026-04-05
subject: Cloudflare MCP 서버 도입 — D1/R2/KV/Workers 자연어 관리
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 12:07 KST] iMac/쌍아 → iMac/막내2

# Cloudflare MCP 서버 도입 — D1/R2/KV/Workers 자연어 관리

## 1. 배경

MONK OS 인프라는 Cloudflare 전면 의존 (CF Pages, Workers, D1, R2, KV).
현재 wrangler CLI로 개별 관리 중.
Cloudflare 공식 MCP 서버(13개 도메인, 3.6K stars)가 Production 레벨로 존재.
자연어로 D1 쿼리, Workers 배포 상태, R2 파일 관리 등이 가능해진다.

## 2. 작업 내용

### A. Cloudflare MCP 서버 설치

1. `cloudflare/mcp-server-cloudflare` 레포 조사
   - 13개 도메인별 서버 목록 확인
   - 우리에게 필요한 서버 선별: D1, R2, KV, Workers, Pages (최소 5개)
2. 설치 방법 확인 + 실행
   - npm/npx 기반인지, standalone인지 확인
3. 인증 설정
   - ⚠️ **API 토큰 절대 생성·추측 금지** (헌법 4조 1항)
   - Cloudflare API 토큰이 필요할 것 — 필요한 권한 범위 조사 후 작가님에게 보고
   - 환경변수 `${CLOUDFLARE_API_TOKEN}` 등으로 `.mcp.json`에 설정

### B. `.mcp.json`에 등록

- 기존 playwright 서버 유지
- Cloudflare 서버 추가 (필요 시 복수 서버)
- 서버 네이밍: `cloudflare-d1`, `cloudflare-r2` 등 또는 통합 서버 1개

### C. 기능 테스트 (읽기 전용 위주)

| 도메인 | 테스트 항목 |
|--------|-----------|
| **D1** | 테이블 목록 조회, SELECT 쿼리 실행 (읽기만!) |
| **R2** | 버킷 목록, 객체 목록 조회 |
| **KV** | 네임스페이스 목록, 키 조회 |
| **Workers** | 워커 목록, 배포 상태 확인 |
| **Pages** | 프로젝트 목록, 빌드 상태 확인 |

⚠️ **쓰기/삭제 작업은 절대 실행 금지** — 읽기 테스트만. 프로덕션 데이터.

### D. Code Mode 조사

- 리서치에서 "Code Mode (2,500+ API 엔드포인트)" 언급됨
- 이게 뭔지 상세 조사 + 우리에게 유용한지 판단

## 3. 산출물

```
monkos-ops/ops/reports/REPORT_20260405_iMac막내2_Cloudflare_MCP_도입.md
```

보고서에 포함할 것:
- 13개 도메인 서버 전체 목록 + 우리 사용 여부 판정표
- 설치 과정 (명령어 기록)
- `.mcp.json` 설정 내용 (토큰 자리는 `${ENV_VAR}` 형태로)
- 도메인별 테스트 결과 (성공/실패)
- 인증에 필요한 작가님 액션 (API 토큰 발급, 권한 범위 등)
- Code Mode 분석 결과
- wrangler CLI 대비 장단점

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키/토큰 절대 생성·추측 금지. 모르면 질문
- **헌법 4조 2항**: 파괴적 명령 금지. **D1/R2/KV에 쓰기·삭제 절대 금지**
- 헌법 3조 1항: 타임스탬프 절대 준수
- `.mcp.json` 수정 시 기존 playwright 설정 유지할 것
- 코드 배포 하지 말 것 — 로컬 설정 + 읽기 테스트까지만
- 프로덕션 데이터 변경 시도 금지
