#!/usr/bin/env python3
"""
K뷰티 이미지 크롤러
- Pinterest, Unsplash, Pexels API 활용
- 합법적 오픈소스 이미지 수집

사용법:
    python kbeauty_crawler.py unsplash "korean beauty" 100
    python kbeauty_crawler.py pexels "korean model" 50
    python kbeauty_crawler.py pinterest "k-beauty hair" 200
"""

import os
import sys
import json
import time
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from urllib.parse import quote

# ==================== 설정 ====================

OUTPUT_DIR = Path(__file__).parent.parent / '_saga' / 'kbeauty_sources'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# API Keys (환경변수에서 로드)
UNSPLASH_KEY = os.getenv('UNSPLASH_ACCESS_KEY', '')
PEXELS_KEY = os.getenv('PEXELS_API_KEY', '')
PINTEREST_TOKEN = os.getenv('PINTEREST_TOKEN', '')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID', '')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET', '')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')
GOOGLE_CX = os.getenv('GOOGLE_CX', '')  # Custom Search Engine ID

# K뷰티 검색 키워드 프리셋 (영문 - Unsplash/Pexels용)
KBEAUTY_KEYWORDS = {
    'hair': [
        'korean hair style', 'k-beauty hair', 'korean perm',
        'asian hair color', 'korean hair trend 2026',
        'korean layered cut', 'korean bob cut'
    ],
    'makeup': [
        'korean makeup', 'k-beauty makeup', 'glass skin',
        'korean eye makeup', 'korean lip', 'dewy skin makeup'
    ],
    'fashion': [
        'korean fashion', 'k-fashion', 'korean streetwear',
        'korean minimal fashion', 'korean office look'
    ],
    'model': [
        'korean model', 'asian beauty', 'korean portrait',
        'korean woman portrait', 'asian fashion model'
    ],
    'lingerie': [
        'asian lingerie model', 'korean underwear fashion',
        'minimal lingerie', 'silk lingerie aesthetic'
    ],
    'background_street': [
        'seoul street photography', 'urban city background', 'gangnam street night',
        'modern city alleyway', 'minimalist urban architecture'
    ],
    'background_interior': [
        'luxury penthouse interior', 'modern minimalist living room',
        'aesthetic room background', 'high-end furniture showroom'
    ],
    'background_cafe': [
        'minimalist cafe interior', 'aesthetic coffee shop decor',
        'industrial cafe background', 'modern bakery interior'
    ],
    'background_studio': [
        'professional photo studio background', 'cyclorama wall studio',
        'vintage industrial studio interior', 'minimalist photo studio'
    ]
}

# K뷰티 검색 키워드 (한글 - 네이버용, 품질 최고!)
KBEAUTY_KEYWORDS_KR = {
    'hair': [
        '청담 헤어스타일', '2026 헤어트렌드', '레이어드컷',
        '허쉬컷', 'C컬펌', '태슬컷', '빌드펌',
        '염색 트렌드', '발레아쥬', '옴브레 헤어'
    ],
    'makeup': [
        '글로우 메이크업', '물광 피부', '청순 메이크업',
        '데일리 메이크업', 'MLBB 립', '글리터 메이크업',
        '무쌍 메이크업', '음영 메이크업'
    ],
    'fashion': [
        '미니멀 패션', '오피스룩', '데이트룩',
        '스트릿패션', '원피스 코디', '블라우스 코디'
    ],
    'model': [
        '여자 프로필 사진', '인물 사진', '스튜디오 촬영',
        '패션 화보', '뷰티 화보', '모델 프로필'
    ],
    'lingerie': [
        '란제리 화보', '이너웨어 코디', '브라렛 스타일',
        '슬립원피스', '실크 란제리'
    ],
    'bg_street': [
        '서울 거리 풍경', '청담동 거리', '성수동 거리',
        '홍대 거리', '한남동 거리', '강남 빌딩 배경',
        '콘크리트 벽', '도시 야경', '네온사인 거리'
    ],
    'bg_interior': [
        '미니멀 인테리어', '북유럽 인테리어', '화이트톤 인테리어',
        '모던 거실', '로프트 인테리어', '자연광 인테리어',
        '럭셔리 펜트하우스', '침실 인테리어', '대리석 인테리어'
    ],
    'bg_cafe': [
        '감성 카페 인테리어', '커피숍 배경', '카페 조명',
        '빈티지 카페', '모던 카페', '따뜻한 카페',
        '브런치 카페', '루프탑 카페'
    ],
    'bg_studio': [
        '스튜디오 배경', '화이트 배경', '그레이 배경',
        '무한 배경', '호라이즌 배경', '단색 배경',
        '프로페셔널 스튜디오', '사이클로라마'
    ],
    'bg_nature': [
        '자연광 배경', '야외 정원', '한강 공원',
        '숲속 배경', '꽃밭 배경', '하늘 배경'
    ]
}

# ==================== Unsplash API ====================

def crawl_unsplash(query: str, count: int = 30) -> list:
    """
    Unsplash API로 이미지 검색
    무료: 50 requests/hour
    """
    if not UNSPLASH_KEY:
        print("⚠️ UNSPLASH_ACCESS_KEY 환경변수 필요")
        print("   https://unsplash.com/developers 에서 발급")
        return []
    
    results = []
    per_page = min(count, 30)
    pages = (count + per_page - 1) // per_page
    
    for page in range(1, pages + 1):
        url = f"https://api.unsplash.com/search/photos"
        params = {
            'query': query,
            'page': page,
            'per_page': per_page,
            'orientation': 'portrait'  # 세로 이미지 우선
        }
        headers = {'Authorization': f'Client-ID {UNSPLASH_KEY}'}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            for photo in data.get('results', []):
                results.append({
                    'id': photo['id'],
                    'source': 'unsplash',
                    'url': photo['urls']['regular'],  # 1080px
                    'url_full': photo['urls']['full'],
                    'thumbnail': photo['urls']['thumb'],
                    'width': photo['width'],
                    'height': photo['height'],
                    'description': photo.get('description', ''),
                    'alt': photo.get('alt_description', ''),
                    'photographer': photo['user']['name'],
                    'photographer_url': photo['user']['links']['html'],
                    'license': 'Unsplash License',
                    'tags': [tag['title'] for tag in photo.get('tags', [])],
                    'query': query,
                    'collected_at': datetime.now().isoformat()
                })
            
            print(f"  Unsplash page {page}: {len(data.get('results', []))}장")
            time.sleep(1)  # Rate limit 준수
            
        except Exception as e:
            print(f"  ❌ Unsplash 오류: {e}")
            break
    
    return results[:count]

# ==================== Pexels API ====================

def crawl_pexels(query: str, count: int = 30) -> list:
    """
    Pexels API로 이미지 검색
    무료: 200 requests/hour, 20,000/month
    """
    if not PEXELS_KEY:
        print("⚠️ PEXELS_API_KEY 환경변수 필요")
        print("   https://www.pexels.com/api/ 에서 발급")
        return []
    
    results = []
    per_page = min(count, 80)
    pages = (count + per_page - 1) // per_page
    
    for page in range(1, pages + 1):
        url = "https://api.pexels.com/v1/search"
        params = {
            'query': query,
            'page': page,
            'per_page': per_page,
            'orientation': 'portrait'
        }
        headers = {'Authorization': PEXELS_KEY}
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            for photo in data.get('photos', []):
                results.append({
                    'id': str(photo['id']),
                    'source': 'pexels',
                    'url': photo['src']['large'],  # 940px
                    'url_full': photo['src']['original'],
                    'thumbnail': photo['src']['tiny'],
                    'width': photo['width'],
                    'height': photo['height'],
                    'photographer': photo['photographer'],
                    'photographer_url': photo['photographer_url'],
                    'license': 'Pexels License',
                    'avg_color': photo.get('avg_color', ''),
                    'query': query,
                    'collected_at': datetime.now().isoformat()
                })
            
            print(f"  Pexels page {page}: {len(data.get('photos', []))}장")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Pexels 오류: {e}")
            break
    
    return results[:count]

# ==================== 네이버 검색 API (추천!) ====================

def crawl_naver(query: str, count: int = 100) -> list:
    """
    네이버 이미지 검색 API
    무료: 25,000건/일 (최고!)
    https://developers.naver.com/apps/
    """
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("⚠️ NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수 필요")
        print("   https://developers.naver.com/apps/ 에서 발급")
        return []
    
    results = []
    display = min(count, 100)  # 최대 100개/요청
    
    for start in range(1, count + 1, display):
        url = "https://openapi.naver.com/v1/search/image"
        params = {
            'query': query,
            'display': display,
            'start': start,
            'sort': 'sim',  # 정확도순
            'filter': 'large'  # 큰 이미지만
        }
        headers = {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        }
        
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get('items', []):
                results.append({
                    'id': hashlib.md5(item['link'].encode()).hexdigest()[:12],
                    'source': 'naver',
                    'url': item['link'],
                    'thumbnail': item['thumbnail'],
                    'title': item.get('title', '').replace('<b>', '').replace('</b>', ''),
                    'width': int(item.get('sizewidth', 0)),
                    'height': int(item.get('sizeheight', 0)),
                    'license': 'Unknown (검색 결과)',
                    'query': query,
                    'collected_at': datetime.now().isoformat()
                })
            
            print(f"  네이버 {start}~{start+display-1}: {len(data.get('items', []))}장")
            time.sleep(0.1)  # Rate limit
            
        except Exception as e:
            print(f"  ❌ 네이버 오류: {e}")
            break
    
    return results[:count]

# ==================== 구글 Custom Search API ====================

def crawl_google(query: str, count: int = 30) -> list:
    """
    구글 Custom Search JSON API
    무료: 100건/일 (그 이상은 유료)
    https://developers.google.com/custom-search/v1/overview
    """
    if not GOOGLE_API_KEY or not GOOGLE_CX:
        print("⚠️ GOOGLE_API_KEY, GOOGLE_CX 환경변수 필요")
        print("   https://console.cloud.google.com/apis/credentials")
        print("   https://programmablesearchengine.google.com/")
        return []
    
    results = []
    
    for start in range(1, min(count, 100) + 1, 10):  # 최대 10개/요청, 100개 제한
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': GOOGLE_API_KEY,
            'cx': GOOGLE_CX,
            'q': query,
            'searchType': 'image',
            'num': 10,
            'start': start,
            'imgSize': 'large',
            'safe': 'off'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get('items', []):
                image = item.get('image', {})
                results.append({
                    'id': hashlib.md5(item['link'].encode()).hexdigest()[:12],
                    'source': 'google',
                    'url': item['link'],
                    'thumbnail': image.get('thumbnailLink', ''),
                    'title': item.get('title', ''),
                    'width': image.get('width', 0),
                    'height': image.get('height', 0),
                    'context_url': item.get('image', {}).get('contextLink', ''),
                    'license': 'Unknown (검색 결과)',
                    'query': query,
                    'collected_at': datetime.now().isoformat()
                })
            
            print(f"  구글 {start}~{start+9}: {len(data.get('items', []))}장")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ 구글 오류: {e}")
            break
    
    return results[:count]

# ==================== Pixabay API ====================

def crawl_pixabay(query: str, count: int = 30) -> list:
    """
    Pixabay API로 이미지 검색
    무료: 100 requests/minute
    """
    PIXABAY_KEY = os.getenv('PIXABAY_API_KEY', '')
    if not PIXABAY_KEY:
        print("⚠️ PIXABAY_API_KEY 환경변수 필요")
        print("   https://pixabay.com/api/docs/ 에서 발급")
        return []
    
    results = []
    per_page = min(count, 200)
    
    url = "https://pixabay.com/api/"
    params = {
        'key': PIXABAY_KEY,
        'q': query,
        'image_type': 'photo',
        'orientation': 'vertical',
        'per_page': per_page,
        'safesearch': 'false',
        'category': 'people'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        for photo in data.get('hits', []):
            results.append({
                'id': str(photo['id']),
                'source': 'pixabay',
                'url': photo['webformatURL'],
                'url_full': photo['largeImageURL'],
                'thumbnail': photo['previewURL'],
                'width': photo['imageWidth'],
                'height': photo['imageHeight'],
                'photographer': photo['user'],
                'license': 'Pixabay License',
                'tags': photo.get('tags', '').split(', '),
                'query': query,
                'collected_at': datetime.now().isoformat()
            })
        
        print(f"  Pixabay: {len(data.get('hits', []))}장")
        
    except Exception as e:
        print(f"  ❌ Pixabay 오류: {e}")
    
    return results[:count]

# ==================== 이미지 다운로드 ====================

def download_images(results: list, category: str) -> int:
    """이미지 다운로드 및 메타데이터 저장"""
    category_dir = OUTPUT_DIR / category
    category_dir.mkdir(exist_ok=True)
    
    downloaded = 0
    
    for item in results:
        try:
            # 파일명 생성
            url_hash = hashlib.md5(item['url'].encode()).hexdigest()[:8]
            filename = f"{item['source']}_{item['id']}_{url_hash}.jpg"
            filepath = category_dir / filename
            
            # 이미 다운로드된 경우 스킵
            if filepath.exists():
                continue
            
            # 이미지 다운로드
            response = requests.get(item['url'], timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # 메타데이터 저장
            meta_path = filepath.with_suffix('.json')
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(item, f, ensure_ascii=False, indent=2)
            
            downloaded += 1
            
            if downloaded % 10 == 0:
                print(f"  다운로드 진행: {downloaded}장")
            
            time.sleep(0.3)  # 서버 부하 방지
            
        except Exception as e:
            print(f"  ⚠️ 다운로드 실패: {item['id']} - {e}")
    
    return downloaded

# ==================== 배치 크롤링 ====================

def crawl_all_keywords(category: str, count_per_keyword: int = 50) -> dict:
    """카테고리별 모든 키워드 크롤링"""
    keywords = KBEAUTY_KEYWORDS.get(category, [])
    if not keywords:
        print(f"❌ 알 수 없는 카테고리: {category}")
        print(f"   가능한 카테고리: {list(KBEAUTY_KEYWORDS.keys())}")
        return {}
    
    all_results = []
    
    for keyword in keywords:
        print(f"\n🔍 검색: {keyword}")
        
        # 여러 소스에서 수집
        results = []
        results.extend(crawl_unsplash(keyword, count_per_keyword // 3))
        results.extend(crawl_pexels(keyword, count_per_keyword // 3))
        results.extend(crawl_pixabay(keyword, count_per_keyword // 3))
        
        all_results.extend(results)
        print(f"   수집: {len(results)}장")
    
    # 중복 제거 (URL 기준)
    unique_results = {r['url']: r for r in all_results}
    unique_list = list(unique_results.values())
    
    print(f"\n📊 총 수집: {len(unique_list)}장 (중복 제거 후)")
    
    # 다운로드
    print(f"\n📥 다운로드 시작...")
    downloaded = download_images(unique_list, category)
    
    return {
        'category': category,
        'total_collected': len(unique_list),
        'downloaded': downloaded,
        'output_dir': str(OUTPUT_DIR / category)
    }

# ==================== CLI ====================

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\n카테고리 목록:")
        for cat, keywords in KBEAUTY_KEYWORDS.items():
            print(f"  {cat}: {', '.join(keywords[:3])}...")
        return
    
    command = sys.argv[1]
    
    if command in ['unsplash', 'pexels', 'pixabay', 'naver', 'google']:
        # 단일 소스 크롤링
        query = sys.argv[2] if len(sys.argv) > 2 else "korean beauty"
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        
        print(f"🔍 {command.upper()} 검색: {query} ({count}장)")
        
        if command == 'unsplash':
            results = crawl_unsplash(query, count)
        elif command == 'pexels':
            results = crawl_pexels(query, count)
        elif command == 'pixabay':
            results = crawl_pixabay(query, count)
        elif command == 'naver':
            results = crawl_naver(query, count)
        elif command == 'google':
            results = crawl_google(query, count)
        
        if results:
            downloaded = download_images(results, 'manual')
            print(f"\n✅ 완료: {downloaded}장 다운로드")
            print(f"   저장 위치: {OUTPUT_DIR / 'manual'}")
    
    elif command == 'batch':
        # 배치 크롤링 (영문 - Unsplash/Pexels)
        category = sys.argv[2] if len(sys.argv) > 2 else 'model'
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 50
        
        print(f"🚀 배치 크롤링: {category} ({count}장/키워드)")
        result = crawl_all_keywords(category, count)
        
        print(f"\n✅ 배치 완료")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif command == 'naver-batch':
        # 네이버 한글 배치 크롤링 (추천!)
        category = sys.argv[2] if len(sys.argv) > 2 else 'model'
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        
        keywords = KBEAUTY_KEYWORDS_KR.get(category, [])
        if not keywords:
            print(f"❌ 알 수 없는 카테고리: {category}")
            return
        
        print(f"🚀 네이버 배치 크롤링: {category} ({count}장/키워드)")
        print(f"   키워드: {', '.join(keywords[:3])}...")
        
        all_results = []
        for keyword in keywords:
            print(f"\n🔍 검색: {keyword}")
            results = crawl_naver(keyword, count)
            all_results.extend(results)
        
        # 중복 제거
        unique = {r['url']: r for r in all_results}
        unique_list = list(unique.values())
        
        print(f"\n📊 총 수집: {len(unique_list)}장")
        downloaded = download_images(unique_list, f"naver_{category}")
        
        print(f"\n✅ 완료: {downloaded}장 다운로드")
        print(f"   저장 위치: {OUTPUT_DIR / f'naver_{category}'}")
    
    elif command == 'all':
        # 전체 카테고리 크롤링
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        
        print(f"🚀 전체 카테고리 크롤링 ({count}장/키워드)")
        
        for category in KBEAUTY_KEYWORDS.keys():
            print(f"\n{'='*50}")
            print(f"📁 카테고리: {category}")
            print('='*50)
            crawl_all_keywords(category, count)
        
        print(f"\n✅ 전체 크롤링 완료!")
        print(f"   저장 위치: {OUTPUT_DIR}")
    
    else:
        print(__doc__)

if __name__ == '__main__':
    main()
