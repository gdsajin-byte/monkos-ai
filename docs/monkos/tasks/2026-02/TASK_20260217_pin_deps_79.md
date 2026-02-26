---
type: task
from: 쌍아
to: 막내
date: 2026-02-17 15:28 KST
status: pending
tags: [idphoto-kr, deps, pin, 00079, critical]
---

# 막내 지시서: 00079 의존성 버전 핀 고정 (sharp 제외)

## 배경

00079 Docker 이미지에서 역추출한 의존성 버전:
- `@google/genai`: **1.41.0**
- `ws`: **8.19.0**
- `@google-cloud/firestore`: **7.11.6**
- `sharp`: 0.33.5 → **사용하지 않음** (현재 코드에서 삭제됨)

현재 `package.json`은 `^` (캐럿) 범위를 사용하여 매 빌드마다 다른 버전이 설치될 위험이 있음.
→ 00079에서 작동 확인된 정확한 버전으로 고정한다.

## 작업

### STEP 1. package.json 수정

파일: `monkos_AI/idphoto-kr/package.json`

**변경 전:**
```json
"dependencies": {
    "@google-cloud/firestore": "^7.11.0",
    "@google/genai": "^1.40.0",
    "ws": "^8.19.0"
}
```

**변경 후:**
```json
"dependencies": {
    "@google-cloud/firestore": "7.11.6",
    "@google/genai": "1.41.0",
    "ws": "8.19.0"
}
```

- `^` 기호 전부 제거 — 정확한 버전만 설치되도록 함
- sharp는 추가하지 않음

### STEP 2. package-lock.json 재생성

```bash
cd monkos_AI/idphoto-kr
rm -f package-lock.json
rm -rf node_modules
npm install --package-lock-only
```

- `--package-lock-only`: node_modules 설치 없이 lock 파일만 생성
- 생성된 lock 파일에서 버전 확인:

```bash
node -e "const p=require('./package-lock.json'); const deps=p.packages?.['node_modules/@google/genai']||p.dependencies?.['@google/genai']; console.log('@google/genai:', deps?.version)"
node -e "const p=require('./package-lock.json'); const deps=p.packages?.['node_modules/ws']||p.dependencies?.['ws']; console.log('ws:', deps?.version)"
node -e "const p=require('./package-lock.json'); const deps=p.packages?.['node_modules/@google-cloud/firestore']||p.dependencies?.['@google-cloud/firestore']; console.log('firestore:', deps?.version)"
```

**검증 기준**: 위 3개가 정확히 1.41.0 / 8.19.0 / 7.11.6 이어야 함.

### STEP 3. idphoto-jp 동기화

`monkos_AI/idphoto-jp/package.json`도 동일하게 핀 고정:
- `@google/genai`과 `ws` 버전 확인 후 동일 버전으로 `^` 제거
- lock 파일 재생성

### STEP 4. 세션 로그

`docs/corpus/sessions/2026-02/20260217_session.md`에 append:

```markdown
### [HH:MM] 00079 의존성 핀 고정

- package.json: ^ 제거, 00079 역추출 버전으로 고정
  - @google/genai: 1.41.0, ws: 8.19.0, firestore: 7.11.6
- package-lock.json 재생성 완료
- sharp: 미포함 (extractBase64 대체)
```

### STEP 5. 커밋 + 푸시

```bash
git add monkos_AI/idphoto-kr/package.json monkos_AI/idphoto-kr/package-lock.json
git add monkos_AI/idphoto-jp/package.json monkos_AI/idphoto-jp/package-lock.json
git add docs/corpus/sessions/2026-02/20260217_session.md
git commit -m "[idphoto] 00079 의존성 핀 고정 — sharp 제외, ^ 캐럿 제거"
git push
```

### STEP 6. 완료 보고

```
---
## 완료 보고 [막내] [HH:MM KST]

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {다음 단계}
---
```

## 제약

- **코드 로직 수정 금지** — package.json 버전 + lock 파일만 변경
- **배포 금지** — 쌍아 검토 후 배포
- **sharp 추가 금지** — 현재 코드와 불일치 발생
- 검증 실패 시 즉시 보고 (강행 금지)
