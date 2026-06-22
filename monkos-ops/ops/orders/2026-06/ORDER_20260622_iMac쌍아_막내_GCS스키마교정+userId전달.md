---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_INFRA
---

# 지시서: GCS 버킷 경로 교정 + 파일명 스키마 + userId 전달

## 배경
- 헤드샷 생성물이 `service/idphoto/kr/studio-profiles/`에 하드코딩 저장 → 유저 구분 불가, 자체 테스트와 혼재
- 증명사진은 `service/idphoto/kr/{userId}/`로 정상 분리되어 있음
- `service/` 중간 폴더 불필요 — 버킷 이름(`monk-customer-photos`)이 용도 자명
- 마이페이지 대비 유저별 폴더 필수
- 설계서: `DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md` §5 참조

## 작업 항목

### 1. gcs-save.js 시그니처 변경

**파일**: `monkos_AI/studio/gcs-save.js`

**현재** (35행):
```javascript
export async function saveImages(userId, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basePath = `service/idphoto/kr/${userId}`;
  const originalPath = `${basePath}/${timestamp}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_generated.png`;
```

**변경**:
```javascript
export async function saveImages(service, userId, style, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const basePath = `${service}/${userId}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
```

- `service`: `'idphoto'` 또는 `'headshot'`
- `userId`: Firestore userId (예: `kakao_4817724214`, `10882711505204505730`)
- `style`: `'passport'`, `'resume'`, `'corporate'`, `'linkedin'` 등

### 2. Studio server.js — 호출처 변경

**파일**: `monkos_AI/studio/server.js`

#### 2-a. `/api/idgen` (증명사진 생성) 호출처
saveImages 호출 부분을 찾아서:
```javascript
// 변경 전
await saveImages('studio-internal', image, generatedBase64);
// 변경 후
await saveImages('idphoto', body.userId || 'anonymous', body.purpose || 'passport', image, generatedBase64);
```

#### 2-b. `/api/profiles/generate` (헤드샷/프로필 생성) 호출처 (637행 부근)
```javascript
// 변경 전
await saveImages('studio-profiles', image || 'freestyle-no-user-photo', generatedBase64);
// 변경 후
await saveImages('headshot', body.userId || 'anonymous', purpose || 'linkedin_pro', image || 'no-user-photo', generatedBase64);
```

#### 2-c. `/api/profiles/generate` — userId 수신 추가 (551행 부근)
```javascript
// 변경 전
const { image, model, purpose, referenceImages } = body;
// 변경 후
const { image, model, purpose, referenceImages, userId } = body;
```

### 3. Portal server.js — Studio 호출 시 userId 전달

**파일**: `monkos_AI/portal/server.js` (188~196행)

```javascript
// 변경 전
body: JSON.stringify({
  image,
  purpose: purpose || 'linkedin_pro',
  model: model || 'nano-banana-pro',
  customPrompt,
}),

// 변경 후
body: JSON.stringify({
  image,
  purpose: purpose || 'linkedin_pro',
  model: model || 'nano-banana-pro',
  customPrompt,
  userId: userId || 'anonymous',
}),
```

### 4. 기존 데이터 마이그레이션 스크립트

**새 파일**: `scripts/migrate-gcs-paths.sh`

```bash
#!/bin/bash
# GCS 경로 마이그레이션: service/idphoto/kr/ → idphoto/ & headshot/
BUCKET="monk-customer-photos"

# 1. 유저별 증명사진 폴더 이동
# service/idphoto/kr/{userId}/ → idphoto/{userId}/ (studio-profiles 제외)
gsutil -m rsync -r -x "studio-profiles/" "gs://${BUCKET}/service/idphoto/kr/" "gs://${BUCKET}/idphoto/"

# 2. studio-profiles → headshot/_unmapped/
gsutil -m cp -r "gs://${BUCKET}/service/idphoto/kr/studio-profiles/*" "gs://${BUCKET}/headshot/_unmapped/"

# 3. 검증 후 원본 삭제는 별도 승인 필요 — 여기서는 복사만
echo "마이그레이션 완료. 원본(service/idphoto/kr/) 삭제는 작가님 승인 후 진행."
```

**주의**: 이 스크립트는 실행 전 작가님 승인 필요. 복사만 하고 원본 삭제는 별도.

## ⚠️ 준수 조항
- 배포: Studio와 Portal 각각 `deploy.sh` 경유 (ch5 2조)
- GCS 마이그레이션 스크립트 실행 전 작가님 승인 필수
- 파괴적 명령 금지 (헌법 4조 2항) — gsutil rm은 승인 후에만

## 검증
- [ ] 헤드샷 생성 → GCS `headshot/{userId}/{timestamp}_{style}_generated.png` 경로 확인
- [ ] 증명사진 생성 → GCS `idphoto/{userId}/{timestamp}_{style}_generated.png` 경로 확인
- [ ] userId 'anonymous' 미발생 확인 (포털 경유 시 반드시 userId 전달)
- [ ] 기존 유저 폴더(kakao_4817724214 등)의 파일 접근 정상

## 대상 파일
1. `monkos_AI/studio/gcs-save.js` — 시그니처 변경
2. `monkos_AI/studio/server.js` — 호출처 3곳 변경 + userId 수신
3. `monkos_AI/portal/server.js` — Studio 호출 시 userId 전달
4. `scripts/migrate-gcs-paths.sh` — 신규 (마이그레이션)
