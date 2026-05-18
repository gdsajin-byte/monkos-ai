---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: GA4/GSC MCP 인증 재테스트 — ADC 자동감지 활용
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 12:35 KST] iMac/쌍아 → iMac/막내1

# GA4/GSC MCP 인증 재테스트

## 배경

iMac에 이미 GCP 인증 인프라가 갖춰져 있다:
- ADC: `~/.config/gcloud/application_default_credentials.json`
- gcloud 활성 계정: `gdsajin@gmail.com` (GA4/GSC 소유자)
- 프로젝트: `monkos`
- SA: `yong-a-orchestrator`, `monk-image-engine`, Compute Engine 기본

## 작업

### 1. ADC 자동감지로 테스트

`.mcp.json`에서 `GOOGLE_APPLICATION_CREDENTIALS` 환경변수 **없이** 서버 기동해보라.
GA4/GSC MCP 서버가 ADC를 자동감지하는지 확인.

```bash
# ADC 자동감지 테스트
uvx analytics-mcp
# → 인증 에러 없이 기동되는지 확인
```

### 2. 안 되면 ADC 경로 명시

```json
"env": {
  "GOOGLE_APPLICATION_CREDENTIALS": "/Users/jeong-kyushin/.config/gcloud/application_default_credentials.json"
}
```

### 3. 그래도 안 되면 SA 키 경로 시도

기존 SA 중 하나의 JSON 키가 로컬에 있는지 찾아서 시도.
```bash
find /Users/jeong-kyushin -name "*monkos*.json" -path "*/gcloud/*" 2>/dev/null
find /Users/jeong-kyushin -name "*service*account*.json" 2>/dev/null
```

### 4. 기능 테스트 (인증 성공 시)

- GA4: `get_account_summaries` → 속성 목록 조회
- GA4: `run_report` → 최근 7일 페이지뷰
- GSC: 검색 쿼리 + 클릭수 조회
- 실시간 리포트 테스트

### 5. 보고

- 어떤 인증 방식으로 성공했는지 명시
- 추가 API 활성화가 필요하면 **구체적 API 이름 + GCP 콘솔 URL** 제시
- 추가 권한이 필요하면 **어떤 SA에 어떤 역할을 어디서 부여하는지** 구체적으로

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/토큰 생성·추측 금지
- 읽기 전용 테스트만. 데이터 변경 금지
