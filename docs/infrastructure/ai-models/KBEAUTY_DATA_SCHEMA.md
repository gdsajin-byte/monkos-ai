# K뷰티 데이터 수집 → AI 모델 생성 파이프라인

## 🎯 목표
버텍스 바우처 소진 전, 강력한 K뷰티 AI 모델 DB 구축

---

## 📸 데이터 수집 레이어

### Layer 1: 근접샷 + 버스트샷 (Face Focus)

| 카테고리 | 태깅 항목 | 예시 값 |
|----------|-----------|---------|
| **헤어스타일** | style_name | 레이어드컷, 허쉬컷, 빌드펌, 태슬컷 |
| | length | short, medium, long, super_long |
| | texture | straight, wavy, curly, permed |
| | volume | flat, natural, voluminous |
| **헤어컬러** | base_color | black, brown, ash, blonde |
| | highlight | balayage, ombre, inner_color |
| | tone | cool, warm, neutral |
| | trend_name | 청담톤, 아이보리브라운, 쉐도우루트 |
| **피부질감** | skin_type | glass_skin, dewy, matte, natural |
| | texture | porcelain, healthy_glow, sun_kissed |
| | finish | luminous, satin, velvet |
| **메이크업** | eye_style | 무쌍메이크업, 글리터, 스모키, 내추럴 |
| | lip_style | 물먹은입술, 매트립, 오버립, MLBB |
| | blush_style | 드렁큰블러쉬, 선번블러쉬, 노블러쉬 |
| | brow_style | 일자눈썹, 아치형, 자연눈썹 |
| **표정/감성** | expression | neutral, smile, pout, fierce, dreamy |
| | mood | innocent, sexy, elegant, cool, warm |
| | gaze | direct, averted, upward, downward |
| **각도** | face_angle | front, 3/4, profile, tilted |
| | chin_position | up, neutral, down |
| | head_tilt | left, center, right |

### Layer 2: 니샷 + 전신샷 (Body Focus)

| 카테고리 | 태깅 항목 | 예시 값 |
|----------|-----------|---------|
| **이너웨어** | type | bralette, bodysuit, slip, lounge |
| | material | silk, lace, cotton, mesh |
| | coverage | minimal, medium, full |
| | color | nude, black, white, pastel |
| **패션룩** | style | minimal, romantic, streetwear, office |
| | silhouette | fitted, oversized, A-line, layered |
| | season | S/S, F/W, resort, transitional |
| | occasion | daily, date, party, business |
| **K뷰티 스타일** | aesthetic | 청순, 걸크러시, 힙, 레트로, Y2K |
| | vibe | 무드있는, 시크한, 러블리, 섹시 |
| | reference | 블핑스타일, 아이브스타일, 뉴진스스타일 |
| **브랜드 선호** | segment | luxury, contemporary, fast_fashion |
| | brands | ZARA, Maje, SANDRO, 국내디자이너 |
| | price_range | budget, mid, premium, luxury |
| **쇼핑몰 정보** | platform | 무신사, W컨셉, SSF, 29CM |
| | category | 여성의류, 언더웨어, 액세서리 |
| **포즈** | pose_type | standing, sitting, lying, dynamic |
| | pose_mood | confident, relaxed, playful, elegant |
| | body_line | S-curve, straight, contrapposto |

---

## 🗄️ 데이터베이스 스키마

### 1. K뷰티 원천 이미지 테이블

```sql
CREATE TABLE soso_kbeauty_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 이미지 정보
    source_url TEXT NOT NULL,
    local_path TEXT,
    image_hash TEXT UNIQUE,           -- 중복 방지
    
    -- 분류
    shot_type TEXT NOT NULL,          -- closeup/bust/knee/full
    source_platform TEXT,             -- instagram/pinterest/shopping
    
    -- 수집 메타
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_processed INTEGER DEFAULT 0
);
```

### 2. 헤어/메이크업 태깅 (근접샷)

```sql
CREATE TABLE soso_face_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES soso_kbeauty_sources(id),
    
    -- 헤어스타일
    hair_style TEXT,
    hair_length TEXT,
    hair_texture TEXT,
    hair_volume TEXT,
    
    -- 헤어컬러
    hair_base_color TEXT,
    hair_highlight TEXT,
    hair_tone TEXT,
    hair_trend_name TEXT,
    
    -- 피부
    skin_type TEXT,
    skin_texture TEXT,
    skin_finish TEXT,
    
    -- 메이크업
    eye_style TEXT,
    lip_style TEXT,
    blush_style TEXT,
    brow_style TEXT,
    
    -- 표정/각도
    expression TEXT,
    mood TEXT,
    gaze TEXT,
    face_angle TEXT,
    chin_position TEXT,
    head_tilt TEXT,
    
    -- 벡터 임베딩
    face_embedding BLOB,              -- 512D 얼굴 벡터
    style_embedding BLOB,             -- 스타일 벡터
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 패션/바디 태깅 (전신샷)

```sql
CREATE TABLE soso_body_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES soso_kbeauty_sources(id),
    
    -- 이너웨어
    inner_type TEXT,
    inner_material TEXT,
    inner_coverage TEXT,
    inner_color TEXT,
    
    -- 패션
    fashion_style TEXT,
    fashion_silhouette TEXT,
    fashion_season TEXT,
    fashion_occasion TEXT,
    
    -- K뷰티 스타일
    kbeauty_aesthetic TEXT,
    kbeauty_vibe TEXT,
    kbeauty_reference TEXT,
    
    -- 브랜드/쇼핑
    brand_segment TEXT,
    brands TEXT,                       -- JSON array
    price_range TEXT,
    shopping_platform TEXT,
    
    -- 포즈
    pose_type TEXT,
    pose_mood TEXT,
    body_line TEXT,
    
    -- 벡터
    pose_embedding BLOB,
    style_embedding BLOB,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 리버스 프롬프트 테이블

```sql
CREATE TABLE soso_reverse_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES soso_kbeauty_sources(id),
    
    -- 분석 결과
    gemini_analysis TEXT,             -- Gemini Vision 분석 원문
    
    -- 생성된 프롬프트
    prompt_en TEXT NOT NULL,          -- 영문 프롬프트
    prompt_ko TEXT,                   -- 한글 프롬프트
    
    -- 구성 요소
    subject_prompt TEXT,              -- 인물 묘사
    style_prompt TEXT,                -- 스타일 묘사
    technical_prompt TEXT,            -- 기술적 설정
    negative_prompt TEXT,             -- 네거티브
    
    -- 품질
    prompt_score REAL,                -- 프롬프트 품질 점수
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5. 생성된 AI 모델 (최종 결과)

```sql
CREATE TABLE mina_generated_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 원천 연결
    source_ids TEXT,                  -- 참조한 원천 이미지 IDs [JSON]
    prompt_id INTEGER REFERENCES soso_reverse_prompts(id),
    
    -- 모델 정보
    model_code TEXT UNIQUE NOT NULL,  -- MINA-YYYYMMDD-XXXX
    model_name TEXT,
    
    -- 이미지
    generated_image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- 생성 설정
    generation_model TEXT,            -- imagen-4/gemini-3-pro
    generation_prompt TEXT,
    aspect_ratio TEXT,
    
    -- 스타일 태그 (최종)
    hair_tags TEXT,                   -- JSON
    makeup_tags TEXT,
    fashion_tags TEXT,
    pose_tags TEXT,
    mood_tags TEXT,
    
    -- 품질 관리
    quality_score REAL DEFAULT 0.0,
    identity_consistency REAL,        -- 시리즈 내 일관성
    is_approved INTEGER DEFAULT 0,
    
    -- 사용 통계
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 파이프라인 워크플로우

### Phase 1: 데이터 수집
```python
# 크롤링 소스
sources = [
    "Pinterest: K-beauty hair trends 2026",
    "Instagram: #청담헤어 #강남메이크업",
    "무신사/W컨셉: 베스트 상품 이미지",
    "브랜드 룩북: ZARA, Maje 시즌 룩"
]

# 수집 → soso_kbeauty_sources
```

### Phase 2: AI 태깅 (Gemini Vision)
```python
def analyze_image(image_url):
    prompt = """
    이 K뷰티 이미지를 분석하세요:
    
    1. 헤어: 스타일명, 길이, 질감, 컬러, 트렌드명
    2. 메이크업: 눈, 입술, 블러쉬, 눈썹 스타일
    3. 피부: 타입, 질감, 피니쉬
    4. 패션: 스타일, 실루엣, 시즌, 무드
    5. 포즈: 타입, 감성, 바디라인
    6. 전체 무드: K뷰티 에스테틱 정의
    
    JSON 형식으로 출력하세요.
    """
    return gemini.analyze(image_url, prompt)
```

### Phase 3: 리버스 프롬프트 생성
```python
def generate_reverse_prompt(tags):
    prompt = f"""
    다음 태그를 기반으로 Imagen 4 프롬프트를 생성하세요:
    
    헤어: {tags['hair']}
    메이크업: {tags['makeup']}
    패션: {tags['fashion']}
    포즈: {tags['pose']}
    무드: {tags['mood']}
    
    출력 형식:
    - 영문 프롬프트 (상세, 150단어)
    - 기술적 설정 (조명, 카메라, 후처리)
    - 네거티브 프롬프트
    """
    return gemini.generate(prompt)
```

### Phase 4: Imagen 생성
```python
def generate_model(prompt, aspect_ratio="3:4"):
    # MONKOS 엔진 활용
    result = monkos.generate(
        prompt=prompt,
        model="gemini-3-pro-image-preview",
        safety="BLOCK_NONE",
        aspect_ratio=aspect_ratio
    )
    return result
```

### Phase 5: 변형 생성 (시리즈화)
```python
def generate_variants(base_model_id, variant_types):
    """
    하나의 모델에서 다양한 룩 생성
    - hair_variants: 다른 헤어스타일로 변형
    - fashion_variants: 다른 패션으로 변형
    - pose_variants: 다른 포즈로 변형
    """
    for variant in variant_types:
        modified_prompt = base_prompt + variant['modifier']
        generate_model(modified_prompt)
```

---

## 📊 목표 데이터 규모

| 단계 | 목표 | 기간 |
|------|------|------|
| 원천 수집 | 1,000+ 이미지 | 1주 |
| 태깅 완료 | 1,000+ 태그셋 | 1주 |
| 리버스 프롬프트 | 500+ 프롬프트 | 3일 |
| AI 모델 생성 | 300+ 모델 | 2주 |
| 변형 확장 | 1,500+ 이미지 | 2주 |

---

## 🎯 우선순위

### Week 1: 기반 구축
- [ ] 태깅 스키마 확정
- [ ] 크롤링 파이프라인 구축
- [ ] Gemini Vision 태깅 자동화

### Week 2: 대량 생성
- [ ] 리버스 프롬프트 생성
- [ ] MONKOS 엔진 배치 생성
- [ ] 품질 검수 프로세스

### Week 3: 확장
- [ ] 변형 생성 (헤어/패션/포즈)
- [ ] 벡터 임베딩 구축
- [ ] 유사도 검색 시스템

---

*생성일: 2026-01-13*
*전략: 버텍스 바우처 → DB 축적 → R&D 자금 확보*
