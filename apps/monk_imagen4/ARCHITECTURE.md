# 🏗️ 아키텍처 설계 - 모듈 병렬 배치

## 구조 개요

```
Cloudflare Pages (1개)
├── / → 메인 홈페이지 (모듈 선택)
├── /imagen4 → Imagen 4 Generator
├── /imagen3pro → Imagen 3 Pro Suite
├── /lumina → Lumina Lookbook
└── /admin → 관리자 대시보드

R2 Bucket (monk-ai-images)
├── imagen4/
│   ├── {timestamp}-{id}.png
│   └── ...
├── imagen3pro/
│   ├── {timestamp}-{id}.png
│   └── ...
└── lumina/
    ├── {timestamp}-{id}.png
    └── ...

D1 Database (monk-ai-db)
├── images (공통)
│   └── project_id로 구분
│       - 'IMAGEN4'
│       - 'IMAGEN3PRO'
│       - 'LUMINA'
└── usage_logs (공통)
```

## 배포 전략

### 단일 프로젝트 구조
```
monk-ai-studio/
├── dist/
│   ├── index.html (메인)
│   ├── imagen4/
│   │   └── index.html
│   ├── imagen3pro/
│   │   └── index.html
│   └── lumina/
│       └── index.html
├── functions/
│   └── api/
│       ├── generate.ts (공통)
│       └── upload.ts (공통)
└── wrangler.toml
```

### 라우팅 방식

**React Router 또는 경로 기반:**
```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Homepage />} />
  <Route path="/imagen4" element={<Imagen4UI />} />
  <Route path="/imagen3pro" element={<Imagen3ProUI />} />
  <Route path="/lumina" element={<LuminaUI />} />
  <Route path="/admin" element={<AdminDashboard />} />
</Routes>
```

### API 엔드포인트 수정

각 모듈이 자동으로 올바른 폴더에 저장:

```typescript
// functions/api/generate.ts
const moduleFolder = request.url.includes('/imagen4') ? 'imagen4' :
                     request.url.includes('/imagen3pro') ? 'imagen3pro' :
                     request.url.includes('/lumina') ? 'lumina' : 'default';

const filename = `${moduleFolder}/${timestamp}-${id}.png`;
```

### D1 스키마 활용

```sql
-- project_id로 모듈 구분
INSERT INTO images (project_id, ...)
VALUES ('IMAGEN4', ...);

-- 모듈별 조회
SELECT * FROM images WHERE project_id = 'IMAGEN4';
```

## 장점

✅ **Cloudflare Pages 1개만 사용** (무료 플랜 효율적 활용)
✅ **공통 인프라 공유** (R2, D1, Workers)
✅ **모듈별 독립 개발** (각 폴더 독립)
✅ **통합 관리** (사용량, 통계, 관리자)
✅ **SEO 친화적** (단일 도메인)

## 빌드 프로세스

```bash
# 1. 각 모듈 빌드
npm run build:imagen4
npm run build:imagen3pro
npm run build:lumina

# 2. 통합
npm run build:merge

# 3. 배포
wrangler pages deploy dist
```

## 커스텀 도메인 설정

```
studio.yourdomain.com/
├── /imagen4
├── /imagen3pro
└── /lumina
```

## 비용 최적화

- **Pages**: 1개 사용 (무료)
- **R2**: 단일 버킷, 폴더로 구분 (무료 10GB)
- **D1**: 단일 DB, project_id로 구분 (무료)
- **Workers**: API 공유 (무료 100K 요청/일)

## Rate Limiting

모듈별로 다른 제한 적용 가능:
```typescript
const limits = {
  'imagen4': { hourly: 3, daily: 100 },
  'imagen3pro': { hourly: 5, daily: 150 },
  'lumina': { hourly: 10, daily: 200 }
};
```
