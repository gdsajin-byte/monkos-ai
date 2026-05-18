---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: GA4/GSC MCP 서버 도입 — CDP 스크래핑 대체
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 12:07 KST] iMac/쌍아 → iMac/막내1

# GA4/GSC MCP 서버 도입 — CDP 스크래핑 대체

## 1. 배경

현재 GA4/GSC 데이터 수집은 CDP로 대시보드를 직접 조작하는 방식이다.
SPA 네비게이션 문제로 가장 불안정한 구간.
구글이 공식 MCP 서버를 제공하고 있으므로, API 직결로 전환한다.

## 2. 작업 내용

### A. GA4 MCP 서버 설치 + 연동

1. `google-analytics-mcp` 서버 설치
   - GitHub: `googleanalytics/google-analytics-mcp` (공식, 1.7K stars)
   - 설치 방법 조사 → 실행 확인
2. 인증 설정
   - ⚠️ **API 키/OAuth 토큰은 절대 생성·추측 금지** (헌법 4조 1항)
   - 필요한 인증 방식 조사 후 작가님에게 질문. placeholder도 금지
   - 환경변수 `${...}` 방식으로 `.mcp.json`에 설정
3. `.mcp.json`에 등록
   - 기존 playwright 서버와 공존하도록 추가
4. 기능 테스트
   - 페이지뷰, 세션, 소스/매체 등 기본 데이터 조회 가능 확인
   - 기존 CDP 방식과 결과 비교

### B. GSC (Google Search Console) MCP 서버 설치 + 연동

1. `mcp-gsc` 서버 조사 (`AminForou/mcp-gsc`)
   - 또는 Google 공식 gcloud MCP에 GSC 기능이 있는지 확인
2. 설치 + 인증 설정 (A와 동일 원칙)
3. `.mcp.json`에 등록
4. 기능 테스트
   - 검색 쿼리, 클릭수, 노출수, 평균 순위 조회 확인

### C. 기존 CDP GA4 스크래핑과 비교

- 안정성: SPA 네비게이션 문제 발생 여부
- 데이터 정확도: 동일 기간 동일 지표 비교
- 속도: 응답 시간 비교
- 결론: MCP 전환 권장 여부 판정

## 3. 산출물

```
monkos-ops/ops/reports/REPORT_20260405_iMac막내1_GA4_GSC_MCP_도입.md
```

보고서에 포함할 것:
- 설치 과정 (명령어 기록)
- `.mcp.json` 설정 내용 (API 키 자리는 `${ENV_VAR}` 형태로)
- 테스트 결과 (성공/실패 + 캡처)
- 기존 CDP 대비 비교표
- 인증에 필요한 작가님 액션 목록 (OAuth 동의, API 키 발급 등)

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 프로젝트 ID, 비밀번호 절대 생성/추측 금지. 모르면 질문
- **헌법 4조 2항**: 파괴적 명령 금지
- 헌법 3조 1항: 타임스탬프 절대 준수
- `.mcp.json` 수정 시 기존 playwright 설정 유지할 것
- `.env` 파일 수정 전 작가님 승인 필수
- 코드 배포 하지 말 것 — 로컬 설정 + 테스트까지만
