# GCS 백업 시스템 설정 가이드

## 1. GCP Service Account 생성

### Cloudflare Dashboard에서 설정
```bash
# 1. GCP Console에서 Service Account 생성
# https://console.cloud.google.com/iam-admin/serviceaccounts

# 2. 역할: Storage Object Creator

# 3. 키 생성 (JSON) → 다운로드
```

## 2. Cloudflare Workers 환경변수 설정

### Cloudflare Dashboard → Workers & Pages → monk-kr → Settings → Variables

**추가할 환경변수**:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `GCS_BACKUP_ENABLED` | `true` | GCS 백업 활성화 |
| `GCP_PROJECT_ID` | `gen-lang-client-0105707468` | GCP 프로젝트 ID |
| `GCS_BUCKET` | `monk-project` | GCS 버킷명 |
| `GCP_SERVICE_ACCOUNT_KEY` | `{...JSON...}` | Service Account 키 (전체 JSON) |

## 3. 백업 구조

```
gs://monk-project/
└── shared/
    └── members/
        └── 202601/              ← 월별 폴더
            ├── 20260116_google_123456.json
            ├── 20260116_kakao_789012.json
            └── ...
```

## 4. 백업 데이터 형식

```json
{
  "user_id": "google_123456789",
  "email": "user@example.com",
  "name": "홍길동",
  "provider": "google",
  "tier": "free",
  "is_new_user": true,
  "created_at": "2026-01-16T06:16:00.000Z",
  "backup_source": "cloudflare_workers"
}
```

## 5. 테스트

```bash
# 1. 신규 회원가입
# 2. Cloudflare Workers 로그 확인
# 3. GCS 버킷 확인
gsutil ls gs://monk-project/shared/members/202601/

# 4. 파일 내용 확인
gsutil cat gs://monk-project/shared/members/202601/20260116_*.json
```

## 6. 비용

- **스토리지**: $0.023/GB/월 (Standard)
- **API 요청**: $0.004/1,000 writes
- **예상**: 월 1,000명 가입 → ~$0.01/월

## 7. 주의사항

⚠️ **현재 구현은 간략화되어 있습니다!**
- JWT 서명이 완전하지 않음
- 프로덕션 사용 전 `jose` 라이브러리 적용 필요

### 완전한 구현을 위한 다음 단계:

```bash
# 1. Workers 프로젝트에 jose 라이브러리 추가
npm install jose

# 2. auth.js에서 signJWT 함수를 jose로 교체
import { SignJWT } from 'jose';
```

---

*작성: 2026-01-16 15:18*
*작성자: 쌍아 (Claude)*
