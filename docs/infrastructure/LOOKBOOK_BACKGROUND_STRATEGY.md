# 룩북 배경 이미지 크롤링 & 벡터화 전략

## 🎯 목표
모델과 배경을 분리하여 조합 가능한 **레이어드 룩북 시스템** 구축

---

## 📸 배경 카테고리

### 1. 스트릿 (Street)
**키워드**: urban street, city street, pedestrian walkway, sidewalk, brick wall background, graffiti wall

**속성 분석**:
- 조명: Natural daylight, golden hour, shadow patterns
- 깊이: Wide shot, depth of field, bokeh background
- 무드: Urban, edgy, casual, contemporary

### 2. 인테리어 (Interior)
**키워드**: minimal interior, white room, modern living room, loft interior, concrete wall, wooden floor

**속성 분석**:
- 조명: Window light, soft lighting, ambient light
- 깊이: Room perspective, spatial depth, foreground-background
- 무드: Cozy, sophisticated, minimalist, luxury

### 3. 카페 (Cafe)
**키워드**: cafe interior, coffee shop, vintage cafe, modern cafe, window seat, marble table

**속성 분석**:
- 조명: Warm lighting, cafe ambiance, natural window light
- 깊이: Shallow depth, background blur, intimate space
- 무드: Relaxed, trendy, romantic, artsy

### 4. 스튜디오 (Studio)
**키워드**: photography studio, white backdrop, gray backdrop, studio lighting setup, seamless background

**속성 분석**:
- 조명: Studio strobe, rim light, key light, fill light
- 깊이: Flat background, no distraction, pure backdrop
- 무드: Professional, clean, high-fashion, editorial

---

## 🗄️ 배경 데이터 스키마

### 테이블: `soso_backgrounds`

```sql
CREATE TABLE soso_backgrounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 기본 정보
    background_code TEXT UNIQUE NOT NULL,  -- BG-YYYYMMDD-XXXX
    category TEXT NOT NULL,                -- street/interior/cafe/studio
    source_url TEXT,
    local_path TEXT,
    
    -- 이미지 속성
    width INTEGER,
    height INTEGER,
    aspect_ratio TEXT,                     -- 16:9, 4:3, 1:1 등
    
    -- 조명 분석 (Gemini Vision)
    lighting_type TEXT,                    -- natural, artificial, mixed
    lighting_direction TEXT,               -- front, side, back, top
    lighting_temperature TEXT,             -- warm, cool, neutral
    lighting_intensity TEXT,               -- soft, medium, harsh
    
    -- 공간 분석
    depth_type TEXT,                       -- shallow, medium, deep
    perspective TEXT,                      -- eye_level, low_angle, high_angle
    focal_point TEXT,                      -- center, left, right, background
    
    -- 색상 팔레트
    dominant_colors TEXT,                  -- JSON array ["#F5F5F5", "#8B8B8B"]
    color_temperature TEXT,                -- warm, cool, neutral
    
    -- 무드/스타일
    mood_tags TEXT,                        -- JSON array ["urban", "edgy"]
    style_tags TEXT,                       -- JSON array ["minimal", "modern"]
    
    -- 벡터 임베딩
    style_embedding BLOB,                  -- 512D 스타일 벡터
    lighting_embedding BLOB,               -- 조명 특성 벡터
    
    -- 품질 관리
    quality_score REAL DEFAULT 0.0,
    is_approved INTEGER DEFAULT 0,
    suitable_for_models TEXT,              -- JSON ["fashion", "portrait", "casual"]
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bg_category ON soso_backgrounds(category);
CREATE INDEX idx_bg_mood ON soso_backgrounds(mood_tags);
CREATE INDEX idx_bg_lighting ON soso_backgrounds(lighting_type);
```

---

## 🔍 크롤링 키워드 전략

### Unsplash 검색어 (영문)
```python
BACKGROUND_KEYWORDS = {
    'street': [
        'urban street photography', 'city street background',
        'brick wall texture', 'graffiti wall', 'concrete wall',
        'pedestrian street', 'alleyway background', 'sidewalk view'
    ],
    'interior': [
        'minimal interior', 'white room background', 
        'modern living room', 'loft interior', 'concrete interior',
        'wooden floor room', 'window light interior', 'cozy room'
    ],
    'cafe': [
        'cafe interior background', 'coffee shop ambiance',
        'vintage cafe', 'modern cafe interior', 'window seat cafe',
        'marble table cafe', 'wood table cafe'
    ],
    'studio': [
        'photography studio backdrop', 'white backdrop',
        'gray backdrop', 'seamless background', 'studio background',
        'neutral backdrop', 'plain background studio'
    ]
}
```

---

## 🤖 Gemini Vision 분석 프롬프트

```python
BACKGROUND_ANALYSIS_PROMPT = """
이 배경 이미지를 룩북/패션 촬영용으로 분석하세요.

## 분석 항목

### 1. 카테고리 (category)
- street, interior, cafe, studio 중 선택

### 2. 조명 분석 (lighting)
- type: natural(자연광), artificial(인공조명), mixed(혼합)
- direction: front(정면), side(측면), back(역광), top(상부)
- temperature: warm(따뜻), cool(차가움), neutral(중성)
- intensity: soft(부드러움), medium(중간), harsh(강렬)

### 3. 공간/깊이 (spatial)
- depth_type: shallow(얕은 심도), medium(중간), deep(깊은 심도)
- perspective: eye_level(눈높이), low_angle(로우앵글), high_angle(하이앵글)
- focal_point: center, left, right, background

### 4. 색상 팔레트 (colors)
- dominant_colors: 주요 색상 3개 (HEX 코드)
- color_temperature: warm, cool, neutral

### 5. 무드/스타일 (mood)
- mood_tags: ["urban", "edgy", "sophisticated", "relaxed", "professional"]
- style_tags: ["minimal", "vintage", "modern", "industrial", "cozy"]

### 6. 모델 적합성 (suitability)
- suitable_for_models: ["fashion", "portrait", "casual", "business", "editorial"]
- recommended_outfit_style: ["streetwear", "formal", "casual", "vintage"]

## 출력 형식
반드시 JSON으로 출력:

```json
{
  "category": "...",
  "lighting": { ... },
  "spatial": { ... },
  "colors": { ... },
  "mood": { ... },
  "suitability": { ... }
}
```
"""
```

---

## 📊 예상 데이터 규모

| 카테고리 | 목표 수집 | 비고 |
|----------|----------|------|
| 스트릿 | 300장 | 다양한 도시 풍경 |
| 인테리어 | 300장 | 다양한 공간 스타일 |
| 카페 | 200장 | 감성/트렌디 배경 |
| 스튜디오 | 200장 | 고품질 백드롭 |
| **총계** | **1,000장** | 배경 라이브러리 구축 |

---

## 🎯 활용 시나리오

### 1. 자동 배경 추천
```
모델 속성: 청순, 화이트 블라우스
→ 추천 배경: 카페 인테리어 (window light, soft lighting, cozy mood)
```

### 2. 스타일 매칭
```
패션 스타일: 스트릿 패션
→ 추천 배경: 그라피티 벽, 도시 거리 (urban, edgy mood)
```

### 3. 조명 일치도 분석
```
모델 이미지: Studio lighting (key light + fill light)
→ 호환 배경: 조명 방향성이 유사한 스튜디오 백드롭
```

---

*생성일: 2026-01-13*
*작성: 쌍아 (Claude)*
