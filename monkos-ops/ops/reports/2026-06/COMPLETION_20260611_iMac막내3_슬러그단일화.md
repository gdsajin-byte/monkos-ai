---
type: completion
date: 2026-06-11
device: iMac
agent: 막내3
from: iMac/막내3
to: iMac/쌍아
order: ORDER_20260611_iMac쌍아_막내_슬러그단일화+임포터삭제
portfolio: PF_OPUS
status: completed
result: partial
---

# 슬러그 단일화 + 임포터 삭제 완료 보고

**[2026-06-11 13:20 KST] iMac/막내3 → iMac/쌍아**

---

## 실행 결과

| Task | 내용 | 결과 |
|------|------|------|
| Task 1 | `slug.js` 단일 모듈 생성 (generateSlug, generateSlugFromAI, sanitizeSlug) | ✅ |
| Task 2 | blog.js 3개 함수 삭제 + import 전환, ai.js makeSlug 삭제 + import 전환 | ✅ |
| Task 3 | `importer/` 디렉토리 삭제 (index.js, naver.js, note.js) | ✅ |
| Task 4-검증 | slug.js 단위 테스트 + import chain 테스트 | ✅ |
| Task 4-배포 | `deploy.sh prod` 실행 | ❌ 인프라 장애 |

---

## 코드 변경 상세

### 신설: `lib/cms/slug.js`
- `generateSlug(title)` — blog.js 로직 그대로 (한글 제거, 소문자, 하이픈, 100자)
- `generateSlugFromAI(aiInstance, title)` — ai 인스턴스를 파라미터로 분리
- `sanitizeSlug(slug)` — **보정 2건 적용**:
  1. `.toLowerCase()` 추가 (기존 누락)
  2. 한글 제거: `/[^a-z0-9\s-]/g` 적용 (기존: 특수문자만 제거, 한글 통과)

### 수정: `lib/cms/blog.js`
- 3개 함수 (generateSlug, generateSlugFromAI, sanitizeSlug) 삭제
- `import { generateSlug, generateSlugFromAI, sanitizeSlug } from './slug.js'` 추가
- 호출부: `generateSlugFromAI(title)` → `generateSlugFromAI(ai, title)` 변경

### 수정: `lib/cms/ai.js`
- `makeSlug` 함수 삭제
- `import { generateSlug } from './slug.js'` 추가
- 호출부 2건: `makeSlug(title)` → `generateSlug(title)` 변경
- 길이 제한 40자→100자로 통일 (SEO상 무방)

### 삭제: `lib/cms/importer/`
- `index.js`, `naver.js`, `note.js` — 3파일 git rm
- server.js 라우트 없음, 외부 참조 없음 확인 후 삭제

---

## 배포 실패 — 인프라 장애

**에러**: `Cannot update environment variable [AGENT_API_KEYS] to the given type because it has already been set with a different type`

**원인**:
- Cloud Run에 `AGENT_API_KEYS`가 **평문 env var**로 설정됨 (값: `AGENT_MINA_3fd59e...`)
- deploy.sh가 `--set-secrets`로 **Secret Manager 참조**(`AGENT-API-KEYS:latest`)로 전환 시도
- gcloud은 동일 이름의 env var 타입 전환을 한 번에 허용하지 않음

**해결 방안**:
1. `gcloud run services update monkos-portal --remove-env-vars=AGENT_API_KEYS --region=us-central1 --project=monkos` (평문 env var 제거)
2. `deploy.sh prod` 재실행 (Secret Manager 참조로 재설정)

코드 변경과 무관한 기존 인프라 이슈. 쌍아/작가님 판단 필요.
