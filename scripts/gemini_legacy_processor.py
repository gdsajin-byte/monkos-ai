#!/usr/bin/env python3
"""
Gemini 레거시 세션 처리기 (타임스탬프 없는 파일용)
작성: 쌍아 (Claude) for MONK Project
날짜: 2026-01-17

대상: 01~18_Merged 파일들 (2025-11 ~ 2025-12)
특징: 타임스탬프 없음, [Start: XXX] 구분자 사용
"""

import re
import json
import hashlib
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# ========================================
# 1. 레거시 파일 파싱
# ========================================

def parse_legacy_files(file_list):
    """타임스탬프 없는 레거시 파일 파싱"""
    
    all_entries = []
    seen_hashes = set()
    session_counter = 0
    
    for file_path in sorted(file_list):
        print(f"  📄 처리 중: {Path(file_path).name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"    ⚠️ 읽기 실패: {e}")
            continue
        
        # 파일명에서 번호 추출 (01, 02, ...)
        file_num_match = re.search(r'(\d{2})_Merged', Path(file_path).name)
        file_num = int(file_num_match.group(1)) if file_num_match else 0
        
        # [Start: XXX] 구분자로 세션 분리
        session_pattern = r'---\s*\[Start:\s*(\d+)_.*?\].*?---'
        sessions = re.split(session_pattern, content)
        
        # 첫 번째는 헤더, 이후 (세션번호, 내용) 쌍
        i = 1
        while i < len(sessions) - 1:
            session_num = sessions[i]
            session_content = sessions[i + 1] if i + 1 < len(sessions) else ""
            i += 2
            
            if not session_content.strip():
                continue
            
            session_counter += 1
            
            # 대화 턴 분리 (질문-응답 패턴)
            turns = parse_turns(session_content)
            
            for turn_idx, turn in enumerate(turns, 1):
                content_hash = hashlib.md5(turn['content'][:300].encode()).hexdigest()
                
                if content_hash not in seen_hashes and len(turn['content']) > 50:
                    seen_hashes.add(content_hash)
                    all_entries.append({
                        'file_num': file_num,
                        'session_num': int(session_num) if session_num.isdigit() else session_counter,
                        'turn_idx': turn_idx,
                        'speaker': turn['speaker'],
                        'content': turn['content'],
                        'source': Path(file_path).name
                    })
    
    # 세션 번호순 정렬
    all_entries.sort(key=lambda x: (x['file_num'], x['session_num'], x['turn_idx']))
    
    return all_entries

def parse_turns(content):
    """대화 턴 분리"""
    turns = []
    
    # 단락으로 분리
    paragraphs = content.strip().split('\n\n')
    
    current_speaker = None
    current_content = []
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # 짧은 문장 = 작가님 질문 가능성
        # 긴 문장 = Gemini 응답 가능성
        if len(para) < 200 and not para.startswith(('**', '##', '-', '•', '|')):
            # 이전 내용 저장
            if current_content:
                turns.append({
                    'speaker': current_speaker or 'yonga',
                    'content': '\n'.join(current_content)
                })
                current_content = []
            
            # 작가님 질문
            turns.append({
                'speaker': 'writer',
                'content': para
            })
            current_speaker = 'yonga'
        else:
            current_content.append(para)
    
    # 마지막 내용
    if current_content:
        turns.append({
            'speaker': current_speaker or 'yonga',
            'content': '\n'.join(current_content)
        })
    
    return turns

# ========================================
# 2. 세션별 그룹핑
# ========================================

def group_by_session(entries):
    """세션 번호별 그룹핑"""
    sessions = defaultdict(list)
    
    for entry in entries:
        # file_num과 session_num 조합으로 고유 세션 ID 생성
        session_key = f"{entry['file_num']:02d}_{entry['session_num']:03d}"
        sessions[session_key].append(entry)
    
    return sessions

# ========================================
# 3. JSON 코퍼스 생성
# ========================================

def generate_json_corpus(sessions, output_file):
    """JSON 스키마로 변환"""
    
    corpus = {
        "corpus_meta": {
            "source": "gemini_yonga_legacy",
            "period": "2025-11 ~ 2025-12",
            "total_sessions": len(sessions),
            "total_turns": sum(len(v) for v in sessions.values()),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "created_by": "ssanga_claude",
            "note": "타임스탬프 없는 레거시 데이터"
        },
        "sessions": []
    }
    
    for session_key in sorted(sessions.keys()):
        entries = sessions[session_key]
        
        session_data = {
            "session_id": session_key,
            "turns": [],
            "topics": extract_topics(entries),
            "sources": list(set(e.get('source', 'unknown') for e in entries))
        }
        
        for i, entry in enumerate(entries, 1):
            content = entry['content']
            
            turn_data = {
                "turn_id": i,
                "speaker": entry['speaker'],
                "content": content[:2000] if len(content) > 2000 else content,
                "keywords": extract_keywords(content)
            }
            session_data["turns"].append(turn_data)
        
        corpus["sessions"].append(session_data)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(corpus, f, ensure_ascii=False, indent=2)
    
    return corpus

def extract_keywords(content):
    """키워드 추출"""
    keywords = [
        'Cloudflare', 'Vertex AI', 'GCS', 'R2', 'D1', 'KV',
        'Workers', 'API', 'monk.kr', 'Imagen', 'Gemini',
        '가비아', '배포', '자동화', '토큰', '비용',
        '인스타그램', 'Meta', '다인', 'DAIN',
        'BWYA', '아카데미', '뮤즈', '쌍아', '민아', '용아', '소소',
        'AI', '이미지', '생성', '모델', '사진관'
    ]
    found = [kw for kw in keywords if kw.lower() in content.lower()]
    return found[:5]

def extract_topics(entries):
    """토픽 추출"""
    all_content = ' '.join(e['content'] for e in entries)
    
    topic_map = {
        'infrastructure': ['Cloudflare', '가비아', 'GCS', 'R2', '배포', '서버'],
        'ai_development': ['Vertex AI', 'Imagen', 'Gemini', 'API', 'AI'],
        'cost_optimization': ['비용', '절감', '무료', '0원', '가격'],
        'automation': ['자동화', 'Workers', 'Cron', '스크립트'],
        'business': ['비즈니스', '사업', '수익', '고객'],
        'muse_system': ['뮤즈', '쌍아', '민아', '용아', '소소', '4 MUSE'],
        'photo_studio': ['사진관', '증명사진', '프로필', '몽크사진관'],
        'education': ['BWYA', '아카데미', '강의', '교육']
    }
    
    found_topics = []
    for topic, keywords in topic_map.items():
        if any(kw in all_content for kw in keywords):
            found_topics.append(topic)
    
    return found_topics

# ========================================
# 4. 요약 MD 생성
# ========================================

def generate_summary_md(sessions, output_file):
    """세션별 요약 MD 생성"""
    
    md = f"""# 용아(Gemini) 레거시 세션 요약 - 2025년 11~12월

> **생성일**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> **원본**: 18개 Merged 파일 (타임스탬프 없음)
> **목적**: MONK 프로젝트 초기 대화 아카이브

---

## 📊 통계

| 항목 | 값 |
|------|-----|
| 총 세션 | {len(sessions)}개 |
| 총 대화 턴 | {sum(len(v) for v in sessions.values())}턴 |
| 원본 파일 | 18개 |

---

## 📚 세션 목록

"""
    
    # 파일별 그룹핑
    file_groups = defaultdict(list)
    for session_key in sorted(sessions.keys()):
        file_num = session_key.split('_')[0]
        file_groups[file_num].append(session_key)
    
    for file_num in sorted(file_groups.keys()):
        session_keys = file_groups[file_num]
        
        md += f"### 📁 Merged {file_num}\n\n"
        md += f"**세션 수**: {len(session_keys)}개\n\n"
        
        # 해당 파일의 주요 토픽
        all_topics = []
        for sk in session_keys:
            all_topics.extend(extract_topics(sessions[sk]))
        unique_topics = list(set(all_topics))[:5]
        
        if unique_topics:
            md += f"**주요 토픽**: {', '.join(unique_topics)}\n\n"
        
        md += "---\n\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 5. 핵심 인사이트 추출
# ========================================

def generate_insights_md(sessions, output_file):
    """핵심 인사이트 추출"""
    
    md = f"""# 용아(Gemini) 레거시 인사이트 - 2025년 11~12월

> **생성일**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> **목적**: MONK 프로젝트 초기 전략 및 아이디어 아카이브

---

## 🎯 주요 인사이트

"""
    
    insights = {
        'strategy': [],
        'technical': [],
        'business': [],
        'muse': []
    }
    
    for session_key in sorted(sessions.keys()):
        entries = sessions[session_key]
        
        for entry in entries:
            content = entry['content']
            
            # 전략
            if any(kw in content for kw in ['전략', '제언', '권고', '계획']):
                sentences = [s.strip() for s in content.split('.') if 50 < len(s) < 300]
                for sent in sentences[:1]:
                    insights['strategy'].append({'session': session_key, 'content': sent})
            
            # 기술
            if any(kw in content for kw in ['API', 'Worker', 'Cloudflare', 'GCS']):
                sentences = [s.strip() for s in content.split('.') if 50 < len(s) < 300]
                for sent in sentences[:1]:
                    insights['technical'].append({'session': session_key, 'content': sent})
            
            # 뮤즈 시스템
            if any(kw in content for kw in ['뮤즈', '쌍아', '민아', '용아', '소소']):
                sentences = [s.strip() for s in content.split('.') if 30 < len(s) < 200]
                for sent in sentences[:1]:
                    insights['muse'].append({'session': session_key, 'content': sent})
    
    categories = {
        'strategy': '🎯 전략적 논의',
        'technical': '⚙️ 기술적 논의',
        'business': '📈 비즈니스 논의',
        'muse': '🎭 4 MUSE 시스템'
    }
    
    for key, title in categories.items():
        items = insights[key]
        if items:
            md += f"### {title}\n\n"
            
            seen = set()
            for item in items[:20]:
                if item['content'] not in seen:
                    seen.add(item['content'])
                    md += f"- [{item['session']}] {item['content']}\n"
            
            md += "\n---\n\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 메인 실행
# ========================================

if __name__ == '__main__':
    import glob
    
    base_input = '/Users/jeong-kyushin/Desktop/제미나이세션백업/total_input/'
    base_output = '/Users/jeong-kyushin/developer/monk_project /docs/saga/'
    
    # 18개 Merged 파일 수집
    merged_files = sorted(glob.glob(base_input + '*_Merged_*.md'))
    
    print("🔄 Gemini 레거시 세션 처리 시작...")
    print(f"   총 {len(merged_files)}개 파일")
    
    print("\n📖 파일 파싱 중...")
    entries = parse_legacy_files(merged_files)
    print(f"   ✅ 총 {len(entries)}개 엔트리 (중복 제거 완료)")
    
    sessions = group_by_session(entries)
    print(f"   ✅ {len(sessions)}개 세션으로 그룹핑")
    
    # 1. JSON
    json_file = base_output + 'GEMINI_CORPUS_LEGACY.json'
    print(f"\n1️⃣ JSON 코퍼스 생성 중...")
    generate_json_corpus(sessions, json_file)
    print(f"   ✅ {json_file}")
    
    # 2. 요약
    summary_file = base_output + 'GEMINI_SUMMARY_LEGACY.md'
    print(f"\n2️⃣ 세션 요약 생성 중...")
    generate_summary_md(sessions, summary_file)
    print(f"   ✅ {summary_file}")
    
    # 3. 인사이트
    insights_file = base_output + 'GEMINI_INSIGHTS_LEGACY.md'
    print(f"\n3️⃣ 핵심 인사이트 생성 중...")
    generate_insights_md(sessions, insights_file)
    print(f"   ✅ {insights_file}")
    
    print("\n🎉 레거시 데이터 처리 완료!")
    print(f"\n📊 최종 통계:")
    print(f"   - 세션: {len(sessions)}개")
    print(f"   - 대화 턴: {sum(len(v) for v in sessions.values())}턴")
