# BWYA 6대 학문 → AI 모델 축적 스키마

## 📚 원천 데이터 현황

| 학문 | 문서 | 핵심 영역 |
|------|------|----------|
| 제1학문 사진학 | 10개 | Irving Penn, Peter Lindbergh, Dan Winters, 조명, 구도 |
| 제2학문 패션학 | 22개 | Texture, Material, Lingerie, 9-Grid, 소재론 |
| 제3학문 헤어조형학 | - | 헤어 스타일링, 볼륨, 컬러 |
| 제4학문 신체 기호학 | 1개 | 포즈, Flow, 신체 언어 |
| 제5학문 AI 디렉팅학 | - | Imagen, Midjourney, Gemini 활용법 |
| 제6학문 언어의 철학 | 1개 | 프롬프트 엔지니어링, 언어적 접근 |

**총 데이터**: 2,347 문단, 206,131 글자

---

## 🗄️ 데이터베이스 스키마

### 1. 프롬프트 사전 테이블

```sql
-- BWYA 학문 기반 프롬프트 태그 사전
CREATE TABLE soso_prompt_dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 분류
    discipline TEXT NOT NULL,       -- 학문 (photography, fashion, hair, pose, directing, philosophy)
    category TEXT NOT NULL,         -- 대분류 (lighting, texture, style, color, etc.)
    subcategory TEXT,              -- 소분류
    
    -- 태그 정보
    tag_ko TEXT NOT NULL,          -- 한글 태그
    tag_en TEXT NOT NULL,          -- 영문 태그 (프롬프트용)
    
    -- 프롬프트 템플릿
    prompt_template TEXT,          -- 실제 프롬프트 조각
    weight REAL DEFAULT 1.0,       -- 가중치 (0.0 ~ 2.0)
    
    -- 메타데이터
    source_doc TEXT,               -- 출처 문서명
    master_reference TEXT,         -- 거장 레퍼런스 (Irving Penn, etc.)
    example_url TEXT,              -- 예시 이미지 URL
    
    -- 관리
    usage_count INTEGER DEFAULT 0,  -- 사용 횟수
    success_rate REAL DEFAULT 0.0, -- 성공률 (생성 품질)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_prompt_discipline ON soso_prompt_dictionary(discipline);
CREATE INDEX idx_prompt_category ON soso_prompt_dictionary(category);
CREATE INDEX idx_prompt_tag_en ON soso_prompt_dictionary(tag_en);
```

### 2. AI 모델 인스턴스 테이블

```sql
-- 생성된 AI 모델 데이터
CREATE TABLE mina_model_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 모델 식별
    model_code TEXT UNIQUE NOT NULL,  -- MINA-YYYYMMDD-XXXX
    model_name TEXT,                  -- 모델 닉네임
    
    -- 기본 속성
    gender TEXT DEFAULT 'female',     -- male/female/neutral
    ethnicity TEXT DEFAULT 'korean',  -- korean/asian/western/mixed
    age_range TEXT,                   -- 20s/30s/40s
    body_type TEXT,                   -- slim/athletic/curvy
    
    -- 스타일 태그 (JSON)
    style_tags TEXT,                  -- ["elegant", "sporty", "classic"]
    fashion_tags TEXT,                -- ["lingerie", "business", "casual"]
    hair_tags TEXT,                   -- ["long", "black", "straight"]
    
    -- 생성 정보
    base_prompt TEXT NOT NULL,        -- 생성에 사용된 기본 프롬프트
    prompt_tags TEXT,                 -- 적용된 태그 ID 목록 [1, 5, 23, ...]
    generation_model TEXT,            -- gemini-3-pro-image-preview
    
    -- 이미지 저장
    seed_image_url TEXT,              -- 시드 이미지 (있는 경우)
    primary_image_url TEXT NOT NULL,  -- 대표 이미지
    thumbnail_url TEXT,               -- 썸네일
    
    -- 벡터 임베딩 (향후 유사도 검색용)
    face_embedding BLOB,              -- 512차원 얼굴 벡터
    style_embedding BLOB,             -- 스타일 벡터
    
    -- 품질 관리
    quality_score REAL DEFAULT 0.0,   -- 0.0 ~ 10.0
    is_approved INTEGER DEFAULT 0,    -- 승인 여부
    is_public INTEGER DEFAULT 0,      -- 공개 여부
    
    -- 사용 통계
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rental_count INTEGER DEFAULT 0,
    
    -- 관리
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_model_gender ON mina_model_instances(gender);
CREATE INDEX idx_model_approved ON mina_model_instances(is_approved);
CREATE INDEX idx_model_quality ON mina_model_instances(quality_score);
```

### 3. 모델 변형 이미지 테이블

```sql
-- 하나의 모델에서 파생된 다양한 이미지
CREATE TABLE mina_model_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES mina_model_instances(id),
    
    -- 변형 정보
    variant_type TEXT NOT NULL,       -- outfit/pose/lighting/background
    prompt_modifier TEXT,             -- 추가된 프롬프트
    applied_tags TEXT,                -- 적용된 태그 [fashion_id, pose_id, ...]
    
    -- 이미지
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- 메타데이터
    aspect_ratio TEXT DEFAULT '3:4',  -- 비율
    resolution TEXT,                  -- 1024x1024
    
    -- 품질
    quality_score REAL DEFAULT 0.0,
    identity_score REAL DEFAULT 0.0,  -- 원본 모델과의 일치도
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variant_model ON mina_model_variants(model_id);
CREATE INDEX idx_variant_type ON mina_model_variants(variant_type);
```

### 4. 생성 작업 로그

```sql
-- 모든 이미지 생성 작업 로그
CREATE TABLE soso_generation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 작업 식별
    job_id TEXT UNIQUE NOT NULL,
    job_type TEXT NOT NULL,           -- model_create/variant/batch
    
    -- 입력
    prompt TEXT NOT NULL,
    applied_tags TEXT,                -- [tag_id, ...]
    input_image_url TEXT,             -- I2I인 경우
    
    -- 설정
    model_name TEXT,                  -- gemini-3-pro-image-preview
    aspect_ratio TEXT,
    safety_level TEXT,
    
    -- 결과
    status TEXT DEFAULT 'pending',    -- pending/processing/success/failed
    output_image_url TEXT,
    result_model_id INTEGER,          -- 성공 시 생성된 모델 ID
    
    -- 성능
    processing_time_ms INTEGER,
    token_usage INTEGER,
    
    -- 에러
    error_message TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE INDEX idx_gen_status ON soso_generation_logs(status);
CREATE INDEX idx_gen_type ON soso_generation_logs(job_type);
```

---

## 🔄 데이터 파이프라인

### Phase 1: 프롬프트 사전 구축
```
BWYA .docx → 텍스트 추출 → 키워드 분석 → soso_prompt_dictionary
```

### Phase 2: 모델 대량 생성
```
프롬프트 조합 → MONKOS 엔진 → 이미지 생성 → mina_model_instances
```

### Phase 3: 변형 확장
```
기존 모델 + 태그 조합 → 변형 생성 → mina_model_variants
```

### Phase 4: 품질 관리
```
생성 로그 분석 → 성공 패턴 학습 → 프롬프트 가중치 조정
```

---

## 📊 예상 데이터 규모

| 단계 | 목표 | 기간 |
|------|------|------|
| 프롬프트 사전 | 500+ 태그 | 1주 |
| 기본 모델 | 100+ 인스턴스 | 2주 |
| 변형 이미지 | 1,000+ 이미지 | 1개월 |
| 검증/승인 | 300+ 품질 승인 | 지속 |

---

## 🎯 R&D 포인트

1. **학문적 기반**: BWYA 6대 학문에서 추출한 전문 태그 체계
2. **거장 레퍼런스**: Irving Penn, Peter Lindbergh 스타일 정량화
3. **자체 DB 구축**: 구글 정책 변경 리스크 헷지
4. **확장 가능**: 벡터 임베딩으로 유사도 검색 지원

---

*생성일: 2026-01-13*
*작성: 쌍아 (Claude)*
