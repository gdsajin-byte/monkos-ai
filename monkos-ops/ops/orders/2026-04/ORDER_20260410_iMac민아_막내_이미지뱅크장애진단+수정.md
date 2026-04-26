---
type: order
date: 2026-04-10
from: iMac/민아
to: 막내
subject: admin API 401 위장 버그 전수 수정 + AUTH_SECRET 검증 가드
priority: P1
pf: PF_PORTAL
revision: v2 (쌍아 피드백 반영)
---

# admin API 401 위장 버그 전수 수정 지시서 (v2)

> **[2026-04-10 14:45 KST] iMac/민아 → 막내**
> 작가님 보고: 블로그 에디터 이미지 뱅크에 이미지 미표시
> 쌍아 피드백: blog-image.js 단독 문제 아님. admin fetch 전수 검증 + 3층 구조 수정 필요.

---

## 1. 증상

- `https://monkos.ai/admin/blog-edit.html` 접속
- 사이드바 이미지 탭 → `#imageLibrary`에 "이미지를 업로드해보세요" 표시
- 기존 이미지 0건 노출

## 2. 민아 CDP 진단

| 항목 | 결과 |
|------|------|
| `#imageLibrary` DOM | 존재 |
| `loadImageLibrary()` 호출 | 실행됨 |
| `/api/admin/images` 직접 fetch | **401 Unauthorized** |
| 콘솔 에러 | 없음 (catch로 삼켜짐) |

### 위장 메커니즘 (`blog-image.js` L102~106)

```js
const r = await fetch('/api/admin/images', { credentials: 'include' });
const { images } = await r.json();             // 401 body = {"error":"Unauthorized"}
if (!images || images.length === 0) {           // images === undefined → truthy
  container.innerHTML = '<div class="img-lib-status">이미지를 업로드해보세요</div>';
  return;
}
```

→ **401 응답을 "빈 라이브러리"로 위장**. 모든 진단을 잘못된 방향으로 유도.

## 3. 전수 스캔 결과 (admin/js/*.js, admin API fetch 11건)

| 파일 | 라인 | 엔드포인트 | r.ok 체크 | 401 처리 | 위장 위험 |
|------|------|-----------|----------|---------|---------|
| admin-common.js | 18 | (authFetch 래퍼) | ✅ status 401 + `/admin/` 리다이렉트 | ✅ | 없음 |
| blog-editor.js | 26 | POST /api/admin/upload | ❌ (data.url로만 판정) | ❌ | **있음** |
| blog-editor.js | 100 | GET /api/admin/blog | ❌ (posts로만 판정) | ❌ | **있음** |
| blog-editor.js | 124 | GET /api/admin/blog/:slug | ✅ 401 + r.ok | ✅ 리다이렉트 | 없음 |
| blog-editor.js | 189 | POST/PUT /api/admin/blog/:slug | ✅ 401 + r.ok | ✅ 리다이렉트 | 없음 |
| blog-image.js | 75 | DELETE /api/admin/images/:name | ❌ | ❌ | **있음** |
| blog-image.js | 102 | GET /api/admin/images | ❌ | ❌ | **있음** (원인) |
| blog-image.js | 155 | POST /api/admin/upload | ❌ (응답 무시) | ❌ | **있음** |
| blog-image.js | 182 | POST /api/admin/upload | ❌ (data.url로만 판정) | ❌ | **있음** |
| blog-research.js | 50 | GET /api/admin/search | ❌ | ❌ | **있음** |

**→ 11건 중 정상 3건, 위장 위험 7건.**

**아이러니**: `admin-common.js`에 이미 `authFetch()` 래퍼(401 시 `/admin/` 리다이렉트)가 존재하나, 다른 모듈이 **전혀 사용하지 않음.**

---

## 4. 3층 구조 수정 (순서대로 진행)

### Layer 1 — 근본 원인 차단 (⚡ 작가님 직접 실행, 1분)

**⚠️ 이 단계는 작가님 승인 + 직접 실행 필요. 막내/민아는 관찰만.**

#### 1-1. prod 환경변수 확인

```bash
gcloud run services describe monkos-portal \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env,spec.template.spec.containers[0].envFrom)" \
  | grep -A1 "AUTH_SECRET\|LEMONSQUEEZY_WEBHOOK_SECRET"
```

#### 1-2. 분기

| 결과 | 원인 | 조치 |
|------|------|------|
| `AUTH_SECRET` 키 자체 없음 | 배포 시 누락 | 시크릿 매니저에 등록 → `--update-secrets=AUTH_SECRET=AUTH_SECRET:latest` 추가 후 재배포 |
| `AUTH_SECRET` 있지만 값 변경됨 | 시크릿 로테이션 | 전 관리자 재로그인만 하면 복구 |
| 둘 다 없고 폴백 `'monkos-default-secret'` 동작 중 | config.js L29 기본값 폴백 | 즉시 `AUTH_SECRET` 설정 필수 (보안 위험) |
| 정상 | 다른 원인 (세션 만료, GIS 토큰, CORS 등) | Layer 2로 |

#### 1-3. 폴백 회피

`lib/shared/config.js` L25~29 확인:

```js
export const AUTH_SECRET = process.env.AUTH_SECRET || '';
if (!AUTH_SECRET) {
  console.warn('[AUTH] ⚠️ AUTH_SECRET 환경변수 미설정 — 프로덕션에서는 반드시 설정 필요');
}
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
```

**폴백이 실제로 동작 중이면**: 매 배포마다 서명 키가 달라질 수 있어 세션 무효화 가능. 프로덕션에서 `'monkos-default-secret'` 폴백은 금지 수준.

---

### Layer 2 — 401 위장 버그 전수 수정 (막내 작업)

#### 2-1. 모든 admin/js/*.js의 `fetch('/api/admin/*')`를 `authFetch()`로 교체

`admin-common.js`의 기존 `authFetch()` 활용:

```js
// admin-common.js L17~21 (기존)
export async function authFetch(url, options = {}) {
  const r = await fetch(url, { credentials: 'include', ...options });
  if (r.status === 401) { location.href = '/admin/'; return null; }
  return r;
}
```

각 파일에서:
1. `import { authFetch } from './admin-common.js';` 추가
2. `fetch('/api/admin/...', ...)` → `authFetch('/api/admin/...', ...)` 치환
3. `authFetch` 반환값 null 체크 (리다이렉트 직후 null 반환)

#### 2-2. 대상 파일 및 라인

- **blog-image.js**: L75, L102, L155, L182 (4건)
- **blog-editor.js**: L26, L100 (2건) — L124, L189는 정상이나 `authFetch`로 통일 권장
- **blog-research.js**: L50 (1건)

#### 2-3. `blog-image.js` `loadImageLibrary` 명시적 에러 처리

```js
async function loadImageLibrary() {
  const container = document.getElementById('imageLibrary');
  container.innerHTML = '<div class="img-lib-status">불러오는 중...</div>';
  try {
    const r = await authFetch('/api/admin/images');
    if (!r) return; // 401 리다이렉트됨
    if (!r.ok) {
      container.innerHTML = `<div class="img-lib-status img-lib-status--error">로드 실패 (${r.status})</div>`;
      return;
    }
    const { images } = await r.json();
    if (!images || images.length === 0) {
      container.innerHTML = '<div class="img-lib-status">이미지를 업로드해보세요</div>';
      return;
    }
    // ... 기존 렌더링 로직 유지
  } catch (err) {
    container.innerHTML = `<div class="img-lib-status img-lib-status--error">네트워크 에러: ${err.message}</div>`;
  }
}
```

---

### Layer 3 — deploy.sh 시크릿 매니저 마운트 가드 추가 (막내 작업)

#### 현상

`monkos_AI/portal/deploy.sh` L131~144:
- `--update-env-vars`에 `AUTH_SECRET` 없음
- `--set-secrets` / `--update-secrets` 플래그 없음
- 현재 프로덕션에 `AUTH_SECRET`이 있다면 수동 세팅 상태 → 재배포 시 날아갈 위험

#### 조치

**옵션 A (권장)**: 시크릿 매니저 기반으로 전환

```bash
# Secret Manager에 AUTH_SECRET 등록 (1회, 작가님 직접)
echo -n "$(openssl rand -hex 32)" | \
  gcloud secrets create AUTH_SECRET --data-file=- --project=${PROJECT_ID}

gcloud secrets add-iam-policy-binding AUTH_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

deploy.sh L144 근처에 플래그 추가:
```bash
--update-secrets="AUTH_SECRET=AUTH_SECRET:latest"
```

**옵션 B (최소)**: 배포 전 검증 가드만 삽입

deploy.sh L130 근처:
```bash
echo -e "\n${GREEN}[2.5/3]${NC} AUTH_SECRET 검증..."
HAS_AUTH=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project=${PROJECT_ID} --format=yaml 2>/dev/null | grep -c "AUTH_SECRET")
if [ "$HAS_AUTH" -eq 0 ]; then
  echo -e "${RED}🚨 AUTH_SECRET 미설정. 배포 중단.${NC}"
  exit 1
fi
```

---

## 5. 테스트 체크리스트

### Layer 1 완료 후
- [ ] 작가님 로그인 상태에서 이미지 뱅크 정상 표시
- [ ] 기존 업로드 이미지 전부 노출

### Layer 2 완료 후
- [ ] 로그인 상태: 이미지 업로드/삭제 정상
- [ ] 미로그인 상태: `/admin/`로 자동 리다이렉트 (위장 메시지 없음)
- [ ] blog-editor.js 저장/발행 정상
- [ ] blog-research.js 네이버 검색 정상

### Layer 3 완료 후
- [ ] `./deploy.sh prod` 드라이런으로 AUTH_SECRET 검증 로직 동작
- [ ] 재배포 후 세션 유지 확인

---

## 6. 작업 순서

1. **Layer 1** — 작가님 직접 (막내는 터치 금지)
2. **Layer 1 결과 보고** → 민아/쌍아
3. **Layer 2** — 막내 실행 (Layer 1 결과에 따라 우선순위 조정)
4. **Layer 3** — Layer 2와 함께 또는 별도 막내에게 배정
5. 배포는 작가님 승인 후 `./deploy.sh prod` 경유

## 7. 준수 조항

⚠️ 헌법 4조 1항: `.env`, `secrets/`, `deploy.sh` 수정 전 작가님 승인 필수
⚠️ 헌법 4조 2항: `gcloud run deploy` 직접 호출 금지 (deploy.sh 경유)
⚠️ 법률 제5장 2조: 배포 필수 deploy.sh 경유

---

## 8. 참고 파일

- `monkos_AI/portal/public/admin/js/admin-common.js` — authFetch 래퍼 정본
- `monkos_AI/portal/public/admin/js/blog-image.js` — 이미지 뱅크 (1차 증상)
- `monkos_AI/portal/public/admin/js/blog-editor.js` — 에디터 저장/발행
- `monkos_AI/portal/public/admin/js/blog-research.js` — 리서치 검색
- `monkos_AI/portal/lib/cms/admin-auth.js` — 서버 인증 미들웨어
- `monkos_AI/portal/lib/shared/config.js` L25~29 — AUTH_SECRET 폴백 체인
- `monkos_AI/portal/deploy.sh` L131~144 — Cloud Run 배포 스크립트

---

**⏳ 상태: 작가님 Layer 1 명령 실행 대기**
