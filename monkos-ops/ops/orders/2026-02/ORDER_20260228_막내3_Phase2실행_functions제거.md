---
type: order
id: ORDER_20260228_막내3_Phase2실행_functions제거
date: 2026-02-28 15:55 KST
from: iMac/쌍아
to: 막내3
priority: P1
status: approved
phase: "CF→Cloud Run 이관 Phase 2 — 실행"
parent_plan: PLAN_FUNCTIONS_REMOVAL_PHASE2
approval: "작가님 전체 승인 (2026-02-28 15:45 KST)"
approval_condition: "삭제 대상은 monkos-ops/tech/archive/에 레거시 백업 후 삭제"
---

# 지시서: Phase 2 실행 — functions/ 제거 + monk.kr 정적화

> **[2026-02-28 15:55 KST] iMac/쌍아 → 막내3**
> **상태**: 작가님 전체 승인 완료. **즉시 실행**.
> **조건**: 삭제 대상 코드를 `monkos-ops/tech/archive/`에 백업 후 삭제 (기술회고 활용)
> **계획서**: `monkos-ops/tech/PLAN_FUNCTIONS_REMOVAL_PHASE2.md`
> **설계서**: `monkos-ops/tech/DESIGN_CF_TO_CLOUDRUN_MIGRATION.md`

---

## 실행 순서 (9 Steps)

### Step 1. 레거시 백업 (삭제 전 아카이브)

```
monkos-ops/tech/archive/
├── functions_cf/          ← functions/api/ 18개 + README.md 전체 복사
├── auth_pages/            ← auth-success.html, login.html, simple-signup.html, auth-error.html
└── ARCHIVE_MANIFEST.md    ← 백업 목록 + 원 경로 + 백업 일시
```

**ARCHIVE_MANIFEST.md 필수 내용**:
- 파일명, 원 경로, 백업 사유, 대응 Cloud Run 서비스
- 향후 기술회고 시 참고용

### Step 2. D1 shared_visitors 데이터 export

```bash
# D1 export — CSV + JSON 형태
npx wrangler d1 execute monk-db --command "SELECT * FROM shared_visitors" --json > monkos-ops/tech/archive/d1_shared_visitors_export.json
```

- export 파일도 `archive/`에 보존
- 실패 시 보고 (D1 접근 권한 이슈 가능)

### Step 3. functions/ 디렉토리 전체 제거

```bash
git rm -r functions/
```

- 18개 JS 파일 + README.md — 전체 제거
- Step 1에서 archive 완료 확인 후 실행

### Step 4. 인증 페이지 4개 제거

```bash
git rm MONK_kr/auth-success.html
git rm MONK_kr/login.html
git rm MONK_kr/simple-signup.html
git rm MONK_kr/auth-error.html
```

- Step 1에서 archive 완료 확인 후 실행

### Step 5. ai_lab.html 수정

**5-1. 서비스 카드 링크 변경**:

| 서비스 카드 | 현재 | 변경 후 |
|-------------|------|---------|
| photolab (증명사진) | `./photolab/` | `https://idphoto-kr.monkos.ai` |
| image_pro (이미지 프로) | `./image_pro/` | `https://image.monkos.ai` |
| lookbook | `./lookbook/` | 현재 유지 ("준비 중") |
| models | (별도 갤러리) | 유지 (CF Images) |

**5-2. purposeRoutes 매핑 변경** (line 656~664 부근):

```javascript
'AI 증명사진': 'https://idphoto-kr.monkos.ai',
'AI 프로필':  'https://idphoto-kr.monkos.ai',
'AI 이미지 생성': 'https://image.monkos.ai',
```

**5-3. localStorage 잔재 정리**:
- `monk_auth_token`, `monk_user`, `monkos_credits` 읽기/쓰기 코드 제거
- 로그아웃 시 localStorage 삭제 코드 제거
- 인증 체계는 monkos.ai portal 쿠키 기반으로 완전 전환됨

**5-4. visitor API 호출 제거**:
- `POST /api/visitor` fetch 호출 삭제 (line 757 부근)
- `localStorage.MONK_VISITOR_INFO` 저장 로직은 유지 가능 (오프라인 폴백)
- 100크레딧 보너스 로직 (line 785~792) — 연동 fetch만 제거, UI 플로우는 유지

### Step 6. wrangler.toml D1 바인딩 제거

```toml
# 아래 블록 전체 삭제
[[d1_databases]]
binding = "DB"
database_name = "monk-db"
database_id = "6fe2a64b-****"
```

### Step 7. _redirects 파일 생성

`MONK_kr/_redirects`:

```
/ai_lab/photolab/*  https://idphoto-kr.monkos.ai/:splat  301
/ai_lab/image_pro/* https://image.monkos.ai/:splat       301
/api/*              https://monkos.ai/api/:splat          301
```

### Step 8. _headers 검토

- photolab/ 경로 관련 헤더 → 리다이렉트 후 불필요 시 정리
- monk_studio/ 관련 헤더는 **절대 미접촉**

### Step 9. 커밋 + push + 완료 보고

```bash
git add -A
git commit -m "[refactor] Phase 2 — functions/ 제거 + monk.kr 정적화

- functions/api/ 18개 제거 (Cloud Run 이관 완료)
- 인증 페이지 4개 제거 (portal OAuth 통합)
- ai_lab.html 서비스 링크 monkos.ai 전환
- wrangler.toml D1 바인딩 제거
- _redirects 301 설정
- 레거시 코드 monkos-ops/tech/archive/ 백업"

git push origin develop
```

---

## 판단 완료 항목 (승인 사항)

### visitor.js → 제거 + 아카이브
- D1 데이터 export (Step 2) 후 코드 아카이브 (Step 1) → 삭제 (Step 3)
- Firestore 이관은 향후 Phase. 당장은 제거 진행.

### ads.js → 제거 + 아카이브
- GCS 직접 호출 대체는 image.monkos.ai 이관 후 해당 서비스에서 처리
- Phase 2에서는 제거만 실행

### 인증 페이지 → 완전 삭제 (리다이렉트 아님)
- monkos.ai portal이 OAuth 처리. CF 측 인증 페이지 불필요.

---

## ⚠️ 준수 조항

- **헌법 8조**: archive 백업 완료 확인 후에만 삭제 실행
- **ch7 3조**: `monk_studio/` **절대 미접촉**
- **ch7 1조**: develop push까지. main 머지 금지
- **MEMORY**: 병렬 작업 시 git pull + 대상 파일 재확인 필수
- **작가님 조건**: "삭제되는것들은 어딘가에 레거시 백업해서 차후 기술회고등에 활용한다"
