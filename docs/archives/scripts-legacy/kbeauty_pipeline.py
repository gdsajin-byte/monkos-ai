#!/usr/bin/env python3
"""
K뷰티 데이터 수집 → AI 모델 생성 파이프라인
MONK AI LAB - MIN_A 모델 에이전시

사용법:
1. 이미지 태깅: python kbeauty_pipeline.py tag <image_path>
2. 리버스 프롬프트: python kbeauty_pipeline.py reverse <tags_json>
3. 모델 생성: python kbeauty_pipeline.py generate <prompt>
4. 배치 생성: python kbeauty_pipeline.py batch <folder_path>
"""

import os
import sys
import json
import base64
import hashlib
from datetime import datetime
from pathlib import Path

# API 설정 (환경변수에서 로드)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
PROJECT_ROOT = Path(__file__).parent.parent

# ==================== 유틸리티 ====================

def load_image_base64(image_path: str) -> tuple[str, str]:
    """이미지를 base64로 인코딩"""
    with open(image_path, 'rb') as f:
        data = f.read()
    
    ext = Path(image_path).suffix.lower()
    mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
    mime_type = mime_map.get(ext, 'image/jpeg')
    
    return base64.b64encode(data).decode('utf-8'), mime_type

def get_image_hash(image_path: str) -> str:
    """이미지 해시 생성 (중복 방지)"""
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def generate_model_code() -> str:
    """모델 코드 생성: MINA-YYYYMMDD-XXXX"""
    import random
    date_str = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(random.choices('0123456789ABCDEF', k=4))
    return f"MINA-{date_str}-{random_suffix}"

# ==================== 태깅 시스템 ====================

TAGGING_PROMPT = """
이 K뷰티 이미지를 정밀 분석하세요. JSON 형식으로 출력하세요.

## 분석 항목

### 1. 샷 타입 (shot_type)
- closeup: 얼굴 클로즈업
- bust: 가슴 위 (상반신)
- knee: 무릎 위
- full: 전신

### 2. 헤어 (hair)
- style: 레이어드컷, 허쉬컷, 빌드펌, 태슬컷, 히메컷, C컬펌, 보브컷 등
- length: short, medium, long, super_long
- texture: straight, wavy, curly, permed
- volume: flat, natural, voluminous
- base_color: black, dark_brown, brown, ash, blonde, etc.
- highlight: balayage, ombre, inner_color, none
- tone: cool, warm, neutral
- trend_name: 청담톤, 아이보리브라운, 쉐도우루트 등

### 3. 메이크업 (makeup)
- eye_style: 무쌍메이크업, 글리터, 스모키, 내추럴, 아이라인강조
- lip_style: 물먹은입술, 매트립, 오버립, MLBB, 글로시립
- blush_style: 드렁큰블러쉬, 선번블러쉬, 노블러쉬, 치크강조
- brow_style: 일자눈썹, 아치형, 자연눈썹, 볼드브로우

### 4. 피부 (skin)
- type: glass_skin, dewy, matte, natural
- texture: porcelain, healthy_glow, sun_kissed
- finish: luminous, satin, velvet

### 5. 표정/무드 (expression)
- expression: neutral, smile, pout, fierce, dreamy, seductive
- mood: innocent, sexy, elegant, cool, warm, mysterious
- gaze: direct, averted, upward, downward, side

### 6. 각도 (angle)
- face_angle: front, three_quarter, profile, tilted
- chin_position: up, neutral, down
- head_tilt: left, center, right

### 7. 패션 (fashion) - 보이는 경우만
- inner_type: bralette, bodysuit, slip, lounge, none
- inner_material: silk, lace, cotton, mesh
- style: minimal, romantic, streetwear, office, sexy
- silhouette: fitted, oversized, A-line, layered
- colors: [색상 리스트]

### 8. 포즈 (pose) - 전신샷인 경우
- type: standing, sitting, lying, dynamic
- mood: confident, relaxed, playful, elegant, seductive
- body_line: S-curve, straight, contrapposto

### 9. K뷰티 에스테틱 (kbeauty)
- aesthetic: 청순, 걸크러시, 힙, 레트로, Y2K, 섹시, 청량
- vibe: 무드있는, 시크한, 러블리, 섹시, 순수한
- reference: 블핑스타일, 아이브스타일, 뉴진스스타일, 제니스타일

### 10. 전체 품질 (quality)
- image_quality: low, medium, high, professional
- lighting: natural, studio, dramatic, soft
- suitable_for_training: true/false (AI 학습에 적합한지)

## 출력 형식
반드시 아래 JSON 구조로 출력하세요:

```json
{
  "shot_type": "...",
  "hair": { ... },
  "makeup": { ... },
  "skin": { ... },
  "expression": { ... },
  "angle": { ... },
  "fashion": { ... },
  "pose": { ... },
  "kbeauty": { ... },
  "quality": { ... }
}
```
"""

BG_TAGGING_PROMPT = """
이 배경 이미지를 AI 모델 합성을 위한 데이터 관점에서 분석하세요. JSON 형식으로 출력하세요.

## 분석 항목

### 1. 공간 카테고리 (category)
- street, interior, cafe, studio, nature, industrial

### 2. 조명 환경 (lighting)
- direction: left, right, top, front, back, diffused (빛의 방향)
- color_temp: warm, cool, neutral (색온도)
- intensity: hard, soft, ambient (조명 강도)
- source: sun, window, artificial, neon (주요 광원)

### 3. 카메라/원근 (perspective)
- angle: eye_level, low_angle, high_angle, bird_eye (카메라 높이)
- horizon_line: top, middle, bottom (수평선 위치)
- focal_length: wide, standard, telephoto (예상 화각)

### 4. 깊이감 (depth)
- foreground_elements: true/false (전경 물체 유무)
- background_blur: low, medium, high (아웃포커싱 정도)
- depth_of_field: shallow, deep

### 5. 합성 적합성 (composition_ready)
- floor_space: true/false (모델이 서 있을 바닥 공간 확보 여부)
- vanishing_point: [x, y] (소실점 대략적 위치, 0-100 기준)
- obstacles: [방해물 목록]

### 6. 스타일 무드 (mood)
- aesthetic: minimal, luxury, vintage, cyberpunk, cozy, professional
- color_palette: [주요 색상 3가지]

## 출력 형식
```json
{
  "category": "...",
  "lighting": { ... },
  "perspective": { ... },
  "depth": { ... },
  "composition_ready": { ... },
  "mood": { ... }
}
```
"""

def tag_image_with_gemini(image_path: str, is_background: bool = False) -> dict:
    """Gemini Vision으로 이미지 태깅 (인물/배경 구분)"""
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        base64_data, mime_type = load_image_base64(image_path)
        
        target_prompt = BG_TAGGING_PROMPT if is_background else TAGGING_PROMPT
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[
                types.Content(
                    parts=[
                        types.Part(inline_data=types.Blob(data=base64.b64decode(base64_data), mime_type=mime_type)),
                        types.Part(text=target_prompt)
                    ]
                )
            ]
        )
        
        # JSON 파싱
        text = response.text
        # JSON 블록 추출
        if '```json' in text:
            json_str = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            json_str = text.split('```')[1].split('```')[0]
        else:
            json_str = text
        
        return json.loads(json_str.strip())
        
    except Exception as e:
        print(f"태깅 오류: {e}")
        return None

# ==================== 리버스 프롬프트 ====================

REVERSE_PROMPT_TEMPLATE = """
다음 K뷰티 태그를 기반으로 Imagen/Gemini 이미지 생성용 프롬프트를 작성하세요.

## 입력 태그
{tags_json}

## 프롬프트 작성 규칙
1. 영문으로 작성 (150-200 단어)
2. 가장 중요한 특징부터 나열
3. 구체적이고 묘사적인 언어 사용
4. K뷰티 특유의 섬세함 강조
5. 조명과 분위기 포함

## 출력 형식
반드시 아래 JSON 구조로 출력:

```json
{
  "main_prompt": "영문 메인 프롬프트 (150-200단어)",
  "style_keywords": ["keyword1", "keyword2", ...],
  "technical_settings": "studio lighting, soft focus, 8K, professional photography",
  "negative_prompt": "blurry, low quality, distorted, unrealistic",
  "korean_summary": "한글 요약 (50자 이내)"
}
```
"""

def generate_reverse_prompt(tags: dict) -> dict:
    """태그 기반 리버스 프롬프트 생성"""
    try:
        from google import genai
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = REVERSE_PROMPT_TEMPLATE.format(tags_json=json.dumps(tags, ensure_ascii=False, indent=2))
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        
        text = response.text
        if '```json' in text:
            json_str = text.split('```json')[1].split('```')[0]
        else:
            json_str = text
        
        return json.loads(json_str.strip())
        
    except Exception as e:
        print(f"프롬프트 생성 오류: {e}")
        return None

# ==================== AI 모델 생성 (MONKOS 엔진) ====================

def generate_ai_model(prompt: str, aspect_ratio: str = "3:4") -> dict:
    """MONKOS 엔진으로 AI 모델 생성"""
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # 정체성 보존 프롬프트 추가
        identity_prompt = """CRITICAL INSTRUCTION: Generate a photorealistic Korean beauty model. 
Maintain consistent facial features throughout. High-end fashion photography quality.
"""
        
        full_prompt = identity_prompt + prompt
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',  # 또는 gemini-3-pro-image-preview
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=['IMAGE', 'TEXT'],
                safety_settings=[
                    types.SafetySetting(
                        category='HARM_CATEGORY_HARASSMENT',
                        threshold='BLOCK_NONE'
                    )
                ]
            )
        )
        
        # 이미지 추출
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                return {
                    'success': True,
                    'image_base64': base64.b64encode(image_data).decode('utf-8'),
                    'model_code': generate_model_code()
                }
        
        return {'success': False, 'error': 'No image generated'}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

# ==================== 배치 처리 ====================

def process_batch(folder_path: str, output_folder: str = None):
    """폴더 내 모든 이미지 일괄 처리"""
    folder = Path(folder_path)
    output = Path(output_folder) if output_folder else folder / 'processed'
    output.mkdir(exist_ok=True)
    
    results = []
    
    for image_file in folder.glob('*.{jpg,jpeg,png,webp}'):
        print(f"처리 중: {image_file.name}")
        
        # 1. 태깅
        tags = tag_image_with_gemini(str(image_file))
        if not tags:
            continue
        
        # 2. 리버스 프롬프트
        prompt_data = generate_reverse_prompt(tags)
        if not prompt_data:
            continue
        
        # 3. AI 모델 생성
        result = generate_ai_model(prompt_data['main_prompt'])
        
        if result['success']:
            # 이미지 저장
            output_path = output / f"{result['model_code']}.png"
            with open(output_path, 'wb') as f:
                f.write(base64.b64decode(result['image_base64']))
            
            # 메타데이터 저장
            meta_path = output / f"{result['model_code']}.json"
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'model_code': result['model_code'],
                    'source_image': image_file.name,
                    'tags': tags,
                    'prompt': prompt_data,
                    'created_at': datetime.now().isoformat()
                }, f, ensure_ascii=False, indent=2)
            
            results.append({
                'source': image_file.name,
                'model_code': result['model_code'],
                'status': 'success'
            })
            print(f"  ✅ 생성 완료: {result['model_code']}")
        else:
            results.append({
                'source': image_file.name,
                'status': 'failed',
                'error': result.get('error')
            })
            print(f"  ❌ 실패: {result.get('error')}")
    
    # 결과 요약 저장
    summary_path = output / 'batch_summary.json'
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(results),
            'success': len([r for r in results if r['status'] == 'success']),
            'failed': len([r for r in results if r['status'] == 'failed']),
            'results': results,
            'processed_at': datetime.now().isoformat()
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== 배치 처리 완료 ===")
    print(f"성공: {len([r for r in results if r['status'] == 'success'])}")
    print(f"실패: {len([r for r in results if r['status'] == 'failed'])}")
    print(f"결과: {summary_path}")

# ==================== CLI ====================

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1]
    
    if command == 'tag' and len(sys.argv) >= 3:
        # 이미지 태깅
        image_path = sys.argv[2]
        is_bg = '--bg' in sys.argv
        print(f"이미지 태깅: {image_path} {'(배경 모드)' if is_bg else ''}")
        tags = tag_image_with_gemini(image_path, is_background=is_bg)
        if tags:
            print(json.dumps(tags, ensure_ascii=False, indent=2))
    
    elif command == 'reverse' and len(sys.argv) >= 3:
        # 리버스 프롬프트 생성
        tags_json = sys.argv[2]
        tags = json.loads(tags_json)
        print("리버스 프롬프트 생성 중...")
        prompt = generate_reverse_prompt(tags)
        if prompt:
            print(json.dumps(prompt, ensure_ascii=False, indent=2))
    
    elif command == 'generate' and len(sys.argv) >= 3:
        # 단일 이미지 생성
        prompt = sys.argv[2]
        print(f"AI 모델 생성 중...")
        result = generate_ai_model(prompt)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif command == 'batch' and len(sys.argv) >= 3:
        # 배치 처리
        folder_path = sys.argv[2]
        output_folder = sys.argv[3] if len(sys.argv) >= 4 else None
        process_batch(folder_path, output_folder)
    
    else:
        print(__doc__)

if __name__ == '__main__':
    main()
