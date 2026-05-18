---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-04-03 14:31 KST
priority: P0
subject: ElevenLabs API 키 등록 — .env + Secret Manager + 에이전트 공유
tags: [elevenlabs, api-key, secret-manager, env]
status: open
---

# 지시서: ElevenLabs API 키 등록

**[2026-04-03 14:31 KST] iMac/쌍아 → iMac/막내**

---

## 배경

작가님이 ElevenLabs Starter($5/월) 가입 완료. API 키 발급됨.
모든 에이전트가 공유 가능하도록 .env + GCP Secret Manager에 등록한다.

---

## 작업 순서

### 1. 작가님으로부터 API 키 수신

- **작가님께 API 키를 요청**한다. 절대 생성/추측 금지 (헌법 4조 1항)
- 키를 수신하면 즉시 아래 단계 진행

### 2. 로컬 .env 등록

- 프로젝트 루트 `.env` 파일에 추가:
  ```
  ELEVENLABS_API_KEY=작가님이_전달한_키
  ```
- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인 (없으면 추가)

### 3. GCP Secret Manager 등록

```bash
echo -n "작가님이_전달한_키" | gcloud secrets create ELEVENLABS_API_KEY \
  --project=monkos \
  --replication-policy=automatic \
  --data-file=-
```

- 이미 존재하면 새 버전 추가:
```bash
echo -n "작가님이_전달한_키" | gcloud secrets versions add ELEVENLABS_API_KEY \
  --project=monkos \
  --data-file=-
```

### 4. 접근 권한 확인

- 기존 서비스 계정이 Secret Manager 접근 가능한지 확인
- 필요 시 권한 부여:
```bash
gcloud secrets add-iam-policy-binding ELEVENLABS_API_KEY \
  --project=monkos \
  --member="serviceAccount:서비스계정" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. 검증

- `.env`에서 키 로딩 확인
- Secret Manager에서 키 조회 확인:
```bash
gcloud secrets versions access latest --secret=ELEVENLABS_API_KEY --project=monkos
```

---

## ⚠️ 준수 조항

- API 키 하드코딩 절대 금지 (헌법 4조 1항)
- `.env` 파일 커밋 절대 금지
- 키 값을 세션 로그나 보고서에 기록 금지
- 완료 보고 `✅❌💡⏳📁🔀` 형식
