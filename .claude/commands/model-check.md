---
name: 모델점검
description: 프로덕션에서 사용 중인 Gemini/Imagen 모델의 유효성을 점검한다
allowed-tools:
  - Bash(curl *)
  - Bash(grep *)
---

## 사용 중인 모델 추출

!`grep -oP 'models/[a-z0-9._-]+' apps/monk_imagen4/backend/server.js | sort -u`
!`grep -oP 'models/[a-z0-9._-]+' monkos_AI/portal/lib/shared/config.js 2>/dev/null | sort -u`

## 점검 절차

1. 위 추출된 모델 목록 각각에 대해 Gemini API로 유효성 확인:
   ```
   curl -s "https://generativelanguage.googleapis.com/v1beta/models/{모델명}" | grep -o '"name":[^,]*'
   ```
2. 응답에 `"name":`이 있으면 ✅ 유효, 404 또는 에러면 ❌ deprecated.
3. deprecated 모델 발견 시 대체 모델을 권고한다.

## 참고: Vertex AI 모델

Imagen 4 (Vertex AI)는 Gemini API로 점검 불가. Cloud Run 로그에서 최근 /generate 성공 여부로 간접 확인:
```
gcloud logging read 'resource.labels.service_name="monk-image-engine" AND textPayload=~"Generate.*Completed"' --limit 3 --freshness=24h --format='value(textPayload)'
```

## 보고 형식

| 모델 | 서비스 | 상태 | 비고 |
|------|--------|------|------|
| (모델명) | (server.js 등) | ✅/❌ | (deprecated면 대체 권고) |
