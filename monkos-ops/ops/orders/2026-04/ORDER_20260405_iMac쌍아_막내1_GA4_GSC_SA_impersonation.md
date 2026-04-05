---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: GA4/GSC MCP — SA impersonation 방식 전환 + 권한 확인
status: 대기
priority: high
pf: PF_CDP
---

[2026-04-05 12:55 KST] iMac/쌍아 → iMac/막내1

# GA4/GSC MCP — SA impersonation 방식 전환

## 배경

ADC OAuth 스코프 추가 시 "차단된 앱" 에러 발생.
새 SA 키 발급은 금지 — 기존 SA를 impersonate하는 방식으로 전환한다.
기존 Vertex AI도 ADC 기반으로 동작 중 (idphoto-kr/server.js 확인 완료).

## 기존 SA 현황

| SA | 용도 |
|---|------|
| `yong-a-orchestrator@monkos.iam.gserviceaccount.com` | 범용 오케스트레이터 |
| `monk-image-engine@monkos.iam.gserviceaccount.com` | Cloud Run 실행 |
| `933456016842-compute@developer.gserviceaccount.com` | Compute Engine 기본 |

## 작업

### 1. yong-a-orchestrator SA에 필요한 IAM 역할 확인

아래 역할이 있는지 확인하고, **없는 것만** 작가님에게 부여 요청:

- `roles/analytics.viewer` (GA4 읽기)
- `roles/webmasters.readonly` 또는 Search Console 접근 권한
- `roles/iam.serviceAccountTokenCreator` (impersonation을 위해 gdsajin@gmail.com에 필요)

확인 명령:
```bash
gcloud projects get-iam-policy monkos --flatten="bindings[].members" --filter="bindings.members:yong-a-orchestrator" --format="table(bindings.role)"
```

### 2. .mcp.json에 impersonation 적용

GA4/GSC 서버 env에서 SA 키 경로 대신 impersonation 설정:
```json
"env": {
  "GOOGLE_CLOUD_PROJECT": "monkos",
  "GOOGLE_IMPERSONATE_SERVICE_ACCOUNT": "yong-a-orchestrator@monkos.iam.gserviceaccount.com"
}
```

또는 서버가 ADC 자동감지를 지원하면:
```bash
gcloud auth application-default login --impersonate-service-account=yong-a-orchestrator@monkos.iam.gserviceaccount.com
```

### 3. 기능 테스트

- GA4: `get_account_summaries` → 속성 목록
- GSC: 검색 쿼리 조회
- 에러 발생 시 **구체적 에러 메시지 + 필요 권한/역할** 명시

### 4. 보고

- 어떤 권한이 이미 있고 어떤 것이 부족한지 표로 정리
- 작가님이 실행할 명령어를 그대로 복붙 가능하게 제시
- **새 SA 키 발급 절대 금지** — impersonation 또는 기존 ADC로 해결

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/토큰 생성·추측 금지. 새 SA 키 발급 금지
- 읽기 전용 테스트만
