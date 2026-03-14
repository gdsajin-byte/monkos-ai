---
type: REPORT
date: 2026-03-08
from: iMac/막내4
to: iMac/쌍아
subject: R2 + D1 기반 이미지 에셋 관리 아키텍처 기안
order: ORDER_20260308_iMac쌍아_막내4_R2D1_에셋아키텍처_기안
category: architecture
---

# R2 + D1 기반 이미지 에셋 관리 아키텍처 기안

> **[2026-03-08 12:45 KST] iMac/막내4 → iMac/쌍아**

---

## Phase A: 기존 R2 / D1 / GCS 전수 파악

### A-1. R2 현황 실사

#### 버킷: `monk-apps`

| 항목 | 값 |
|------|-----|
| 버킷명 | `monk-apps` |
| 바인딩 | `IMAGES_BUCKET` |
| 사용 프로젝트 | `apps/monk_imagen4` (T2I 이미지 생성 프로토타입) |
| wrangler 설정 | `apps/monk_imagen4/wrangler.toml` |
| 공개 접근 | **미설정** (URL 플레이스홀더: `https://your-r2-domain.com/`) |

#### R2 쓰기 패턴 (`upload.ts`)

```
경로: {moduleFolder}/{timestamp}-{random9}.png
예시: imagen4/1709123456789-abc123def.png

메타데이터:
  httpMetadata: { contentType: 'image/png' }
  customMetadata: { prompt, model, mode }
```

- `upload.ts`: FormData → R2 put + D1 images 테이블 INSERT
- `generate.ts`: Gemini API 호출 (이미지 생성). R2에 직접 쓰지 않음 — 생성 결과를 프론트엔드에 반환하고, 프론트엔드가 upload API를 별도 호출하는 구조

#### R2 읽기 패턴

- **현재 읽기 경로 미구축**: URL이 `https://your-r2-domain.com/` 플레이스홀더
- R2 커스텀 도메인 또는 Workers 경유 서빙 설정 필요

#### 추정 사용량

- monk_imagen4는 프로토타입 단계 (프로덕션 아님)
- 생성 이미지: PNG, 평균 ~1MB
- 예상 저장량: **수십 MB~수백 MB** (정확한 수치는 CF 대시보드 확인 필요)

---

### A-2. D1 현황 실사

#### DB 1: `monk-db` (id: `6fe2a64b-9144-436c-94f7-1e9375249a1e`)

**바인딩**: `DB` (monk_imagen4 wrangler.toml)

| 테이블 | 컬럼 | 용도 | 이미지 관련 |
|--------|------|------|------------|
| `images` | id, **url**, prompt, model, mode, aspect_ratio, image_size, safety_level, timestamp, project_id, comment, tags, style_analysis | T2I 생성 이미지 메타데이터 | **◎ 직접 관련** — R2 객체의 URL + 생성 파라미터 저장 |
| `usage_logs` | id, ip_address, user_agent, endpoint, request_count, timestamp | 레이트 리밋 추적 | ✗ |

> **재사용 가능성**: `images` 테이블은 T2I 전용 스키마. 에셋 관리용으로는 카테고리/배치/정책 필드가 부족. 확장보다 **신규 테이블 추가**가 적합.

#### DB 2: `monk-services-db` (id: `1c88fa57...`)

**레거시 스키마** (`docs/archives/scripts-legacy/schema.sql`). 이미지 관련 필드:

| 테이블 | 이미지 관련 컬럼 | 비고 |
|--------|-----------------|------|
| `soso_templates` | `thumbnail_url` | 템플릿 썸네일 |
| `soso_backgrounds` | `image_url` | 룩북 배경 에셋 |
| `mina_models` | `main_image_url`, `portfolio_urls_json` | AI 모델 이미지 |
| `shared_users` | `profile_image` | 사용자 프로필 |

> **결제/거래원장은 Firestore 이관 결정됨** (2026-03-01 P0). 남는 D1 테이블 중 이미지 참조가 있는 테이블은 향후 R2 URL로 자연 전환 가능.

---

### A-3. GCS → R2 이관 대상 판별

| GCS 경로 | 용량 | 서빙 빈도 | Write 주체 | R2 이관 판정 | 근거 |
|----------|------|----------|-----------|:-----------:|------|
| `monk-ai-images/ads/` | 14 MB | **높음** (프로덕션) | ads_sync.py (gcloud CLI) | **◎ 이관** | egress 무료, CF 네이티브, 가장 큰 수혜 |
| `monk-ai-images/generated/` | 187 MB | 중간 (내부) | monk-image-engine (Cloud Run SA) | **○ 이관 검토** | Cloud Run → R2 쓰기 경로 변경 필요 (S3 SDK or Workers API) |
| `monk-ai-images/raw_data/` | 3.17 GB | 낮음 (콜드) | 수동 업로드 | **✗ GCS 유지** | 콜드 아카이브, R2 10GB 예산 초과 위험 |
| `monk-project/assets/soso/` | 2.93 GB | 낮음 (콜드) | 수동 업로드 | **✗ GCS 유지** | 대용량 원본, 아카이브 용도 |
| `monk-project/corpus/` | 21 MB | 낮음 | 수동 | **✗ GCS 유지** | Vertex AI RAG 소스 |
| `monk-project/live/` | 409 MB | 0 (사장) | - | **✗ 삭제 후보** | 2개월 방치된 node_modules |

---

## Phase B: R2 버킷 설계

### B-1. 설계 원칙

1. **단일 버킷 + 접두사 분리**: 현 규모(~200MB 활성)에서 버킷 분리는 과도. 접두사(prefix)로 논리 분리
2. **monk-apps 병합 보류**: 기존 monk-apps는 프로토타입 전용. 프로덕션 버킷을 별도 생성하여 격리
3. **10GB 무료 티어 내 운용**: 콜드 데이터(raw_data, corpus)는 GCS 잔류

### B-2. 버킷 구조도

```
┌──────────────────────────────────────────────────────┐
│  r2://monkos-assets/                                 │
│  (프로덕션 이미지 에셋 통합 버킷)                          │
│                                                      │
│  ├── ads/                    광고 로테이션              │
│  │   ├── {yyyymmdd}_{hhmmss}_{name}.jpg              │
│  │   └── ...  (FIFO 6장)                             │
│  │                                                   │
│  ├── gallery/                쇼케이스/갤러리             │
│  │   ├── showcase/           결과 쇼케이스              │
│  │   └── portfolio/          포트폴리오                 │
│  │                                                   │
│  ├── models/                 AI 모델 에셋              │
│  │   ├── {model-id}/        모델별 폴더               │
│  │   │   ├── profile/                                │
│  │   │   ├── lookbook/                               │
│  │   │   └── variations/                             │
│  │   └── ...                                         │
│  │                                                   │
│  ├── backgrounds/            합성 배경 템플릿            │
│  │   ├── studio/                                     │
│  │   ├── outdoor/                                    │
│  │   └── custom/                                     │
│  │                                                   │
│  └── generated/              AI 생성 이미지             │
│      ├── {yyyymmdd}/        일별 폴더                 │
│      └── ...                                         │
│                                                      │
│  기존 r2://monk-apps/  (프로토타입 — 당분간 유지)         │
│  └── {moduleFolder}/{id}.png                         │
└──────────────────────────────────────────────────────┘
```

### B-3. 버킷별 정의

#### `monkos-assets` (신규)

| 접두사 | 용도 | 예상 용량 | 증가 추이 | 공개 정책 | TTL/FIFO | Workers 바인딩 |
|--------|------|----------|----------|----------|----------|--------------|
| `ads/` | 광고 로테이션 이미지 | ~14 MB | 안정 (FIFO 6장) | **공개** | FIFO 6장, 초과 시 oldest 삭제 | 필요 (읽기+쓰기) |
| `gallery/` | 결과 쇼케이스, 포트폴리오 | ~50 MB 초기 | 월 10~20MB | **공개** | 없음 (수동 관리) | 필요 (읽기) |
| `models/` | AI 모델 프로필/룩북 | ~0 (향후) | 모델당 ~50MB | **공개** (포트폴리오) | 없음 | 필요 (읽기) |
| `backgrounds/` | 합성용 배경 | ~0 (향후) | 장면당 ~5MB | **비공개** (서버 전용) | 없음 | 필요 (서버 읽기) |
| `generated/` | AI 생성 이미지 (프로덕션) | ~187 MB (GCS 이관분) | 월 ~50MB | **비공개** (인증 필요) | 30일 후 자동 삭제 검토 | 필요 (쓰기+읽기) |

#### `monk-apps` (기존 유지)

| 항목 | 현행 |
|------|------|
| 용도 | monk_imagen4 프로토타입 전용 |
| 변경 | 없음 — 프로덕션 안정화 후 monkos-assets/generated/로 통합 검토 |

### B-4. 10GB 예산 배분표

| 구분 | 현재 | 6개월 후 예상 | 1년 후 예상 |
|------|------|-------------|------------|
| `monk-apps` (기존) | ~200 MB | ~300 MB | 통합 후 0 |
| `monkos-assets/ads/` | 14 MB | 14 MB | 14 MB |
| `monkos-assets/gallery/` | 50 MB | 170 MB | 290 MB |
| `monkos-assets/models/` | 0 | 200 MB | 500 MB |
| `monkos-assets/backgrounds/` | 0 | 50 MB | 100 MB |
| `monkos-assets/generated/` | 187 MB | 487 MB | TTL 적용 시 ~500 MB |
| **합계** | **~451 MB** | **~1.2 GB** | **~1.4 GB** |
| **무료 잔여** | 9.5 GB | 8.8 GB | 8.6 GB |

> **결론**: 10GB 무료 티어 내 충분히 운용 가능. 콜드 데이터(raw_data 3GB+)를 GCS에 유지하는 전략이 핵심.

### B-5. 공개 접근 설정

| 접두사 | 서빙 방식 | 도메인 |
|--------|----------|--------|
| `ads/` | R2 커스텀 도메인 또는 Workers 경유 | `assets.monkos.ai/ads/*` (권장) |
| `gallery/` | R2 커스텀 도메인 | `assets.monkos.ai/gallery/*` |
| `models/` | R2 커스텀 도메인 | `assets.monkos.ai/models/*` |
| `backgrounds/` | Workers 인증 경유 | Workers API only (공개 URL 없음) |
| `generated/` | Workers 인증 경유 | Workers API only |

**R2 커스텀 도메인 설정**:
- `assets.monkos.ai` → R2 `monkos-assets` 버킷
- CF DNS에 CNAME 추가 → R2 자동 SSL
- 공개 접두사(`ads/`, `gallery/`, `models/`)만 서빙
- 비공개 접두사는 Workers 인증 경유

---

## Phase C: D1 메타데이터 테이블 설계

### C-1. DB 전략

**신규 테이블을 `monk-db`에 추가** (별도 DB 미생성)

근거:
- monk-db는 현재 `images` + `usage_logs` 2개 테이블만 존재 — 여유 충분
- 신규 DB 생성 시 wrangler 바인딩 추가 필요 → 기존 monk_imagen4 Worker 수정 불가피
- `images` 테이블과 `assets` 테이블이 같은 DB에 있으면 JOIN 가능 (generated → asset 승격 시)
- monk-services-db는 레거시 + Firestore 이관 진행 중이므로 건드리지 않음

### C-2. ERD (텍스트 다이어그램)

```
┌─────────────────────────────┐
│       asset_categories      │
│─────────────────────────────│
│ PK  id        TEXT          │
│     code      TEXT UNIQUE   │  ← 'ad', 'gallery', 'model', 'bg', 'generated'
│     name      TEXT          │
│     bucket    TEXT          │  ← 'monkos-assets'
│     prefix    TEXT          │  ← 'ads/', 'gallery/', 등
│     is_public BOOLEAN       │
│     policy    TEXT (JSON)   │  ← {"fifo":6,"ttl_days":null,"max_size_kb":500}
│     created_at DATETIME     │
└──────────┬──────────────────┘
           │ 1
           │
           │ N
┌──────────┴──────────────────┐
│          assets             │
│─────────────────────────────│
│ PK  id          TEXT        │
│ FK  category_id TEXT        │──→ asset_categories.id
│     bucket      TEXT        │  ← 'monkos-assets' | 'monk-apps'
│     key         TEXT        │  ← R2 객체 키 (ads/20260308_152330_spring.jpg)
│     filename    TEXT        │
│     format      TEXT        │  ← 'jpg', 'webp', 'png'
│     size_bytes  INTEGER     │
│     width       INTEGER     │
│     height      INTEGER     │
│     alt_text    TEXT        │
│     tags        TEXT (JSON) │  ← ["봄","프로모션"]
│     source      TEXT        │  ← 'upload', 'ai_generated', 'crawled'
│     is_active   BOOLEAN     │  ← 1=활성, 0=비활성
│     uploaded_at DATETIME    │
│     updated_at  DATETIME    │
│     expires_at  DATETIME    │  ← TTL (null=무기한)
└──────────┬──────────────────┘
           │ 1
           │
           │ N
┌──────────┴──────────────────┐
│      asset_placements       │
│─────────────────────────────│
│ PK  id            INTEGER AI│
│ FK  asset_id      TEXT      │──→ assets.id
│     service       TEXT      │  ← 'idphoto-kr', 'monk-kr-photolab', 'portal'
│     page          TEXT      │  ← 'index', 'result'
│     section       TEXT      │  ← 'showcase', 'hero', 'gallery'
│     display_order INTEGER   │
│     is_active     BOOLEAN   │
│     created_at    DATETIME  │
└─────────────────────────────┘

┌─────────────────────────────┐
│       ad_rotation           │
│─────────────────────────────│
│ PK  id            INTEGER AI│
│ FK  asset_id      TEXT      │──→ assets.id
│     rotate_ms     INTEGER   │  ← 6000 (6초)
│     transition_ms INTEGER   │  ← 800
│     priority      INTEGER   │  ← 정렬 우선순위
│     start_date    DATE      │  ← 캠페인 시작일 (null=즉시)
│     end_date      DATE      │  ← 캠페인 종료일 (null=무기한)
│     is_active     BOOLEAN   │
│     created_at    DATETIME  │
└─────────────────────────────┘
```

### C-3. CREATE TABLE 문

```sql
-- ============================================
-- MONKOS Assets Management Schema
-- D1: monk-db 확장
-- ============================================

-- 에셋 카테고리 정의
CREATE TABLE IF NOT EXISTS asset_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'monkos-assets',
    prefix TEXT NOT NULL,
    is_public INTEGER DEFAULT 1,
    policy TEXT,  -- JSON: {"fifo":6,"ttl_days":null,"max_size_kb":500}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 초기 카테고리 데이터
INSERT OR IGNORE INTO asset_categories (id, code, name, prefix, is_public, policy) VALUES
    ('cat_ad',      'ad',        '광고',        'ads/',          1, '{"fifo":6,"ttl_days":null,"max_size_kb":500}'),
    ('cat_gallery', 'gallery',   '갤러리',      'gallery/',      1, '{"fifo":null,"ttl_days":null,"max_size_kb":800}'),
    ('cat_model',   'model',     'AI 모델',     'models/',       1, '{"fifo":null,"ttl_days":null,"max_size_kb":1000}'),
    ('cat_bg',      'bg',        '배경',        'backgrounds/',  0, '{"fifo":null,"ttl_days":null,"max_size_kb":2000}'),
    ('cat_gen',     'generated', 'AI 생성물',   'generated/',    0, '{"fifo":null,"ttl_days":30,"max_size_kb":2000}');

-- 에셋 마스터 테이블
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    bucket TEXT NOT NULL DEFAULT 'monkos-assets',
    key TEXT NOT NULL,           -- R2 객체 키
    filename TEXT NOT NULL,
    format TEXT,
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    tags TEXT,                   -- JSON array
    source TEXT DEFAULT 'upload', -- upload | ai_generated | crawled | migrated
    is_active INTEGER DEFAULT 1,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets(is_active, category_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded ON assets(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_expires ON assets(expires_at);

-- 에셋 배치 (어디에 표시되는지)
CREATE TABLE IF NOT EXISTS asset_placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,
    service TEXT NOT NULL,       -- idphoto-kr | monk-kr-photolab | portal
    page TEXT NOT NULL,          -- index | result
    section TEXT NOT NULL,       -- showcase | hero | gallery | ad-banner
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_placements_service ON asset_placements(service, page, section);
CREATE INDEX IF NOT EXISTS idx_placements_asset ON asset_placements(asset_id);

-- 광고 로테이션 설정 (manifest.json 대체)
CREATE TABLE IF NOT EXISTS ad_rotation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,
    rotate_ms INTEGER DEFAULT 6000,
    transition_ms INTEGER DEFAULT 800,
    priority INTEGER DEFAULT 0,
    start_date DATE,            -- null = 즉시 시작
    end_date DATE,              -- null = 무기한
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ad_rotation_active ON ad_rotation(is_active, priority DESC);
```

### C-4. 기존 D1과의 관계

```
┌─────────────────────────────────────────────────────┐
│  monk-db (6fe2a64b...)                              │
│                                                     │
│  [기존]                     [신규]                   │
│  ┌──────────┐              ┌──────────────────┐     │
│  │ images   │ ─ 승격 ─→    │ assets           │     │
│  │ (T2I)    │              │ (통합 에셋)       │     │
│  └──────────┘              ├──────────────────┤     │
│  ┌──────────┐              │ asset_categories │     │
│  │usage_logs│              ├──────────────────┤     │
│  │ (기존)   │              │ asset_placements │     │
│  └──────────┘              ├──────────────────┤     │
│                            │ ad_rotation      │     │
│                            └──────────────────┘     │
│                                                     │
│  images.id → assets.id로 승격 가능                    │
│  (category_id = 'cat_gen', source = 'ai_generated') │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  monk-services-db (레거시)                           │
│                                                     │
│  soso_backgrounds.image_url  ─→ assets R2 URL로 전환 │
│  mina_models.main_image_url  ─→ assets R2 URL로 전환 │
│  soso_templates.thumbnail_url ─→ assets R2 URL로 전환│
│                                                     │
│  (Firestore 이관 완료 후, D1 테이블의 URL 필드만 갱신) │
└─────────────────────────────────────────────────────┘
```

### C-5. Workers API 엔드포인트 설계

| 엔드포인트 | 메서드 | 용도 | 응답 | 인증 |
|-----------|--------|------|------|------|
| `GET /api/assets?category=ad` | GET | 활성 광고 목록 (manifest.json 대체) | JSON | 공개 |
| `GET /api/assets?category=gallery&service=idphoto-kr&page=index` | GET | 페이지별 갤러리 | JSON | 공개 |
| `GET /api/assets?category=model&id={model-id}` | GET | 모델 포트폴리오 | JSON | 공개 |
| `POST /api/assets/upload` | POST | R2 업로드 + D1 메타데이터 등록 | JSON | **인증 필요** |
| `DELETE /api/assets/{id}` | DELETE | 에셋 비활성화 (soft delete) | JSON | **인증 필요** |
| `PUT /api/assets/{id}/placement` | PUT | 배치 설정 변경 | JSON | **인증 필요** |

#### 광고 API 응답 예시 (manifest.json 대체)

```json
// GET /api/assets?category=ad
{
  "category": "ad",
  "display": { "rotate": 6000, "transition": 800 },
  "images": [
    {
      "id": "ad_20260308_152330",
      "url": "https://assets.monkos.ai/ads/20260308_152330_spring.jpg",
      "alt": "봄 프로모션",
      "priority": 1
    }
  ],
  "count": 6,
  "updated": "2026-03-08T15:23:30Z"
}
```

> **하위 호환**: 전환 기간 동안 기존 manifest.json을 Workers에서 동적 생성하여 동일 URL로 서빙 가능 (코드 변경 없이 백엔드만 전환).

---

## Phase D: 마이그레이션 경로

### D-1. 마이그레이션 로드맵

```
Phase 0 (즉시)          Phase 1 (1주)           Phase 2 (2주)           Phase 3 (4주)
─────────────────    ─────────────────       ─────────────────       ─────────────────
R2 버킷 생성          ads/ GCS→R2 이관        프론트엔드 전환          generated/ 이관
D1 스키마 적용        Workers API 배포        manifest→API 전환       monk-apps 통합
커스텀 도메인 설정     하위 호환 manifest      GCS ads/ 폐지           GCS generated/ 폐지
                     GCS+R2 병행 서빙
```

### D-2. Phase 0: 인프라 준비 (즉시)

| 작업 | 명령/절차 | 비고 |
|------|----------|------|
| R2 버킷 생성 | `wrangler r2 bucket create monkos-assets` | CF 대시보드 or CLI |
| 커스텀 도메인 | CF DNS: `assets.monkos.ai` CNAME → R2 | SSL 자동 |
| D1 스키마 적용 | `wrangler d1 execute monk-db --remote --file=schema_assets.sql` | 기존 테이블 영향 없음 |
| Workers 바인딩 추가 | `wrangler.toml`에 `[[r2_buckets]]` 추가 | monk-kr Worker or 신규 Worker |

### D-3. Phase 1: ads/ 이관 (1주)

#### 이관 절차

```
1. GCS ads/ 6장 + manifest.json → R2 ads/ 복사
   wrangler r2 object put monkos-assets/ads/{file} --file={local}

2. D1 assets 테이블에 6장 INSERT
   (id, category_id='cat_ad', key='ads/{file}', ...)

3. Workers API 배포
   GET /api/assets?category=ad → D1 쿼리 → R2 URL 반환

4. 하위 호환 manifest 엔드포인트
   GET /api/ads/manifest.json → D1 쿼리 → v1 형식 JSON 반환
   (기존 result.js의 AD_MANIFEST_URL을 이 엔드포인트로 변경하면 되지만,
    전환 기간에는 GCS manifest.json도 유지)

5. ads_sync.py 수정
   GCS 업로드 → R2 업로드 (wrangler r2 object put)
   manifest.json 갱신 → D1 INSERT + Workers cache purge
```

#### 프론트엔드 영향 분석

| 파일 | 현재 | 변경 후 | 변경량 |
|------|------|---------|--------|
| `monkos_AI/idphoto-kr/public/result.js:27` | `AD_MANIFEST_URL = 'https://storage.googleapis.com/monk-ai-images/ads/manifest.json'` | `AD_MANIFEST_URL = 'https://assets.monkos.ai/api/assets?category=ad'` (또는 하위호환 URL) | 1줄 |
| `MONK_kr/ai_lab/photolab/result.js:20` | 동일 | 동일 변경 | 1줄 |
| `monkos-ops/tech/archive/functions_cf/api/ads.js:4` | 동일 | 동일 변경 (아카이브이므로 선택적) | 1줄 |
| `monkos_AI/idphoto-kr/public/index.html` | GCS URL 하드코딩 (6건) | `assets.monkos.ai` URL로 변경 | 6줄 |
| `MONK_kr/ai_lab/photolab/index.html` | GCS URL 하드코딩 (5건) | `assets.monkos.ai` URL로 변경 | 5줄 |

**총 변경**: ~14줄 (Phase 2에서 일괄 변경)

#### 하위 호환 전략

```
[전환 기간 — Phase 1~2 동안 병행]

GCS manifest.json (기존) ──┐
                           ├── 프론트엔드는 둘 다 동작
R2 Workers API (신규) ─────┘

전환 완료 후 GCS ads/ 폐지
```

### D-4. Phase 2: 프론트엔드 전환 (2주)

1. `result.js` 2개 파일의 `AD_MANIFEST_URL` 변경
2. `index.html` 2개 파일의 GCS 하드코딩 URL → `assets.monkos.ai` URL
3. 배포 (CF Pages + Cloud Run)
4. 검증 후 GCS `monk-ai-images/ads/` 폐지

### D-5. Phase 3: generated/ 이관 + 통합 (4주)

1. `monk-image-engine` (Cloud Run) 의 GCS 쓰기 → R2 쓰기로 변경
   - 방법 A: Workers upload API 경유 (HTTP POST)
   - 방법 B: S3 호환 SDK로 R2 직접 쓰기 (AWS SDK + R2 엔드포인트)
2. GCS `generated/` 기존 164장 → R2 일괄 이관
3. `monk-apps` 버킷 데이터 → `monkos-assets/generated/`로 통합 (선택적)
4. monk_imagen4 wrangler.toml 바인딩 변경 (monk-apps → monkos-assets)

### D-6. ads_sync.py 전환 계획

| 항목 | 현행 (GCS) | 전환 후 (R2) |
|------|-----------|-------------|
| 업로드 | `gcloud storage cp` | `wrangler r2 object put` 또는 S3 SDK (boto3) |
| 공개 설정 | `gcloud storage objects update --add-acl-grant=allUsers` | R2 커스텀 도메인 자동 공개 (별도 ACL 불필요) |
| 매니페스트 | `/tmp/manifest.json` → GCS 업로드 | D1 INSERT + Workers 캐시 퍼지 |
| FIFO | GCS 목록 조회 → 초과분 삭제 | D1 쿼리 (SELECT count → oldest DELETE) → R2 object delete |
| 폴더 감시 | 동일 (`~/monkos-ads/`) | 동일 |

---

## 비용 시뮬레이션

### 현행 (GCS only)

| 항목 | 용량 | 스토리지 | egress (추정) | 월 합계 |
|------|------|---------|-------------|---------|
| monk-ai-images | 3.38 GB | $0.068 | ~$0.05 | **$0.12** |
| monk-project | 3.36 GB | $0.067 | ~$0 | **$0.07** |
| **합계** | 6.74 GB | $0.135 | $0.05 | **$0.19** |

### 전환 후 (R2 + GCS 혼합)

| 항목 | 용량 | 스토리지 | egress | 월 합계 |
|------|------|---------|--------|---------|
| **R2** monkos-assets | ~250 MB | $0 (무료 10GB) | **$0** (무료) | **$0** |
| **R2** monk-apps | ~200 MB | $0 (무료 합산) | $0 | **$0** |
| **GCS** monk-ai-images (raw_data only) | 3.17 GB | $0.063 | $0 | **$0.06** |
| **GCS** monk-project (corpus+assets) | 2.95 GB | $0.059 | $0 | **$0.06** |
| **합계** | ~6.6 GB | $0.122 | **$0** | **$0.12** |

| | 현행 | 전환 후 | 절감 |
|-|------|---------|------|
| **월간** | $0.19 | $0.12 | **$0.07 (37%)** |
| **연간** | $2.28 | $1.44 | **$0.84** |

> 금액 자체는 미미하나, **핵심 이점은 비용이 아닌 구조 개선**:
> - egress 과금 리스크 제거 (트래픽 증가 시 GCS egress는 $0.12/GB, R2는 $0)
> - CF 네이티브 엣지 캐싱 (TTFB 개선)
> - 버킷 전체 공개(allUsers) 보안 이슈 해소
> - D1 메타데이터로 manifest.json 수동 관리 탈피

---

## 종합 의견

### 추천 요약

1. **R2 `monkos-assets` 단일 버킷** + 접두사 분리 (버킷 분리 불필요)
2. **D1 `monk-db` 확장** (4개 테이블 추가, 별도 DB 불필요)
3. **단계적 이관**: ads/ (Phase 1) → 프론트엔드 (Phase 2) → generated/ (Phase 3)
4. **GCS 유지**: raw_data + corpus + assets/soso (콜드, R2 10GB 예산 절약)

### 헌법 적합성

| 조항 | 판정 | 근거 |
|------|------|------|
| **10조 (프록시 금지)** | ✅ 적합 | R2는 CF 네이티브 스토리지. GCS→R2 **이관**이지 프록시 동기화 아님. 이관 후 GCS 경로 폐지 |
| **6조 (인프라 보호)** | ✅ 적합 | 기존 D1 ID/R2 버킷명만 참조. 신규 생성 시 wrangler CLI 사용 (API 키 노출 없음) |
| **8조 (파괴적 명령 금지)** | ✅ 적합 | GCS 삭제는 Phase 2/3 완료 확인 후에만 제안. 본 보고서에서 실행 없음 |

### 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| R2 커스텀 도메인 DNS 전파 지연 | 중 | Phase 1에서 GCS 병행 유지 |
| monk-image-engine → R2 쓰기 전환 복잡도 | 중 | Phase 3으로 분리, S3 SDK 사용 |
| D1 스키마 변경 시 기존 images 테이블 영향 | 낮 | 별도 테이블 추가만 (기존 변경 없음) |

---

*보고서 작성: 2026-03-08 12:45 KST*
*작성자: iMac/막내4*
*참조: GCS 감사 보고서(막내1), 이미지 스키마(막내2), 프로젝트 분기(막내3)*
