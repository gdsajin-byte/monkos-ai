#!/usr/bin/env python3
"""
K-Beauty Snapshot Intelligence (SOSO Engine)
- 모바일 사진 한 장으로 스타일 분석, 판매처 매칭, 모델 피팅 지원
- 4 MUSE 시스템: 용아(전략/분석) + 소소(이미지/데이터) + 민아(모델/피팅)

사용법:
    python kbeauty_snapshot.py analyze <image_path>
"""

import os
import sys
import json
import base64
import requests
from datetime import datetime
from pathlib import Path

# API 설정 (환경변수에서 로드)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

SNAPSHOT_PROMPT = """
이 사진에서 패션/헤어/메이크업 아이템을 정밀 분석하여 K-Beauty 스타일 정의 및 커머스 정보를 추출하세요.
JSON 형식으로 출력하세요.

## 분석 항목
1. category: hair, makeup, top, bottom, dress, accessory 중 하나
2. style_definition: K-Beauty 관점의 스타일 명칭 (예: '청담동 며느리룩', '성수동 스트릿', '글로우 스킨' 등)
3. style_tags: 스타일 키워드 5개 (예: ['미니멀', '시크', '러블리', 'Y2K', '올드머니'])
4. color_palette: 주요 색상 HEX 코드 리스트 (최대 3개)
5. item_details: 
   - material: 소재 (패션인 경우)
   - texture: 질감/피부표현 (예: '실크', '매트', '글로우')
6. commerce_match:
   - brand_guess: 예상 브랜드 또는 유사 브랜드
   - product_name_guess: 예상 제품명
   - estimated_price: 예상 가격 (KRW 단위 숫자만, 모르면 0)
   - mall_name: 추천 쇼핑몰 (예: '무신사', 'W컨셉', '올리브영')
7. search_keywords: 쇼핑 검색을 위한 최적의 키워드 리스트
8. fitting_advice: 이 아이템과 어울리는 AI 모델 스타일 추천

## 출력 형식
반드시 아래 JSON 구조로 출력하세요:

```json
{
  "category": "...",
  "style_definition": "...",
  "style_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "color_palette": ["#HEX1", "#HEX2", "#HEX3"],
  "item_details": { "material": "...", "texture": "..." },
  "commerce_match": { 
    "brand_guess": "...", 
    "product_name_guess": "...", 
    "estimated_price": 0, 
    "mall_name": "..." 
  },
  "search_keywords": ["keyword1", "keyword2"],
  "fitting_advice": "..."
}
```
"""

def load_image_base64(image_path: str) -> tuple[str, str]:
    """이미지를 base64로 인코딩"""
    with open(image_path, 'rb') as f:
        data = f.read()
    
    ext = Path(image_path).suffix.lower()
    mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
    mime_type = mime_map.get(ext, 'image/jpeg')
    
    return base64.b64encode(data).decode('utf-8'), mime_type

def analyze_snapshot(image_path: str) -> dict:
    """Gemini Vision으로 스냅샷 정밀 분석"""
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY가 설정되지 않았습니다."}

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        base64_data, mime_type = load_image_base64(image_path)
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[
                types.Content(
                    parts=[
                        types.Part(inline_data=types.Blob(data=base64.b64decode(base64_data), mime_type=mime_type)),
                        types.Part(text=SNAPSHOT_PROMPT)
                    ]
                )
            ]
        )
        
        # JSON 파싱
        text = response.text
        if '```json' in text:
            json_str = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            json_str = text.split('```')[1].split('```')[0]
        else:
            json_str = text
            
        return json.loads(json_str.strip())
        
    except Exception as e:
        return {"error": f"분석 중 오류 발생: {str(e)}"}

def recommend_fitting_model(analysis: dict) -> list:
    """분석 결과에 따른 추천 AI 모델 매칭 (Mina DB 시뮬레이션)"""
    # 실제 구현 시 mina_models 테이블에서 style_tags 매칭 쿼리 실행
    # 여기서는 시뮬레이션 결과 반환
    return [
        {"model_id": "MINA-001", "name": "수진 (Su-jin)", "style": "Innocent/Minimal"},
        {"model_id": "MINA-005", "name": "제이 (Jay)", "style": "Street/Chic"}
    ]

def main():
    if len(sys.argv) < 3 or sys.argv[1] != 'analyze':
        print(__doc__)
        return
    
    image_path = sys.argv[2]
    print(f"📸 K-Beauty 스냅샷 분석 시작: {image_path}")
    
    result = analyze_snapshot(image_path)
    
    if "error" in result:
        print(f"❌ 오류: {result['error']}")
        return

    print("\n✨ 분석 결과 (K-Beauty Intelligence):")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    recommendations = recommend_fitting_model(result)
    print("\n👗 추천 피팅 모델 (MINA Engine):")
    for rec in recommendations:
        print(f"- {rec['name']} ({rec['model_id']}): {rec['style']}")

if __name__ == '__main__':
    main()
