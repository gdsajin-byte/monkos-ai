#!/usr/bin/env python3
"""
Gemini 세션 대화록 배치 처리기 (중복 제거 + 통합)
작성: 쌍아 (Claude) for MONK Project
날짜: 2026-01-17

기능:
- 여러 파일 통합 처리
- 중복 콘텐츠 제거
- 시계열 정렬
- JSON + 요약 + 인사이트 생성
"""

import re
import json
import hashlib
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# ========================================
# 1. 다중 파일 파싱 + 중복 제거
# ========================================

def parse_multiple_files(file_list):
    """여러 파일을 파싱하고 중복 제거"""
    
    all_entries = []
    seen_hashes = set()
    
    for file_path in file_list:
        print(f"  📄 처리 중: {Path(file_path).name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"    ⚠️ 읽기 실패: {e}")
            continue
        
        # 타임스탬프 패턴
        timestamp_pattern = r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\.'
        
        lines = content.split('\n')
        current_block = []
        current_timestamp = None
        
        for line in lines:
            if line.strip() == '=' * 60 or 'SOURCE:' in line:
                continue
            
            ts_match = re.search(timestamp_pattern, line)
            if ts_match:
                if current_block and current_timestamp:
                    block_content = '\n'.join(current_block).strip()
                    
                    # 중복 체크 (해시 기반)
                    content_hash = hashlib.md5(block_content[:500].encode()).hexdigest()
                    
                    if content_hash not in seen_hashes:
                        seen_hashes.add(content_hash)
                        all_entries.append({
                            'timestamp': current_timestamp,
                            'content': block_content,
                            'source': Path(file_path).name
                        })
                
                current_timestamp = ts_match.group(1)
                remaining = line[ts_match.end():].strip()
                current_block = [remaining] if remaining else []
            else:
                if line.strip():
                    current_block.append(line)
        
        # 마지막 블록
        if current_block and current_timestamp:
            block_content = '\n'.join(current_block).strip()
            content_hash = hashlib.md5(block_content[:500].encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                all_entries.append({
                    'timestamp': current_timestamp,
                    'content': block_content,
                    'source': Path(file_path).name
                })
    
    # 시간순 정렬
    all_entries.sort(key=lambda x: x['timestamp'])
    
    return all_entries

def group_by_date(entries):
    """날짜별 그룹핑"""
    sessions = defaultdict(list)
    
    for entry in entries:
        date_key = entry['timestamp'][:10]
        sessions[date_key].append(entry)
    
    return sessions

# ========================================
# 2. JSON 코퍼스 생성
# ========================================

def generate_json_corpus(sessions, output_file, period_name):
    """JSON 스키마로 변환"""
    
    corpus = {
        "corpus_meta": {
            "source": "gemini_yonga",
            "period": period_name,
            "total_sessions": len(sessions),
            "total_turns": sum(len(v) for v in sessions.values()),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "created_by": "ssanga_claude",
            "deduplication": True
        },
        "sessions": []
    }
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        
        session_data = {
            "session_id": date.replace("-", ""),
            "date": date,
            "turns": [],
            "topics": extract_topics(entries),
            "sources": list(set(e.get('source', 'unknown') for e in entries))
        }
        
        for i, entry in enumerate(entries, 1):
            content = entry['content']
            speaker = "yonga" if len(content) > 200 else "writer"
            
            turn_data = {
                "turn_id": i,
                "timestamp": entry['timestamp'],
                "speaker": speaker,
                "content": content[:2000] if len(content) > 2000 else content,
                "content_type": classify_content(content),
                "keywords": extract_keywords(content)
            }
            session_data["turns"].append(turn_data)
        
        corpus["sessions"].append(session_data)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(corpus, f, ensure_ascii=False, indent=2)
    
    return corpus

def classify_content(content):
    """내용 타입 분류"""
    if any(kw in content for kw in ['명령', '실행', 'Bash', 'npm', 'wrangler']):
        return "instruction"
    elif any(kw in content for kw in ['전략', '권고', '제언', '판단']):
        return "strategy"
    elif any(kw in content for kw in ['비용', '절감', '가격', '원']):
        return "cost_analysis"
    elif any(kw in content for kw in ['API', 'Worker', 'Vertex', 'Cloud']):
        return "technical"
    else:
        return "general"

def extract_keywords(content):
    """키워드 추출"""
    keywords = [
        'Cloudflare', 'Vertex AI', 'GCS', 'R2', 'D1', 'KV',
        'Workers', 'API', 'monk.kr', 'Imagen', 'Gemini',
        '가비아', '배포', '자동화', '토큰', '비용',
        '인스타그램', 'Meta', '다인', 'DAIN',
        'PDF', 'HWP', 'R&D', '디딤돌', 'BWYA', '아카데미'
    ]
    found = [kw for kw in keywords if kw.lower() in content.lower()]
    return found[:5]

def extract_topics(entries):
    """토픽 추출"""
    all_content = ' '.join(e['content'] for e in entries)
    
    topic_map = {
        'infrastructure': ['Cloudflare', '가비아', 'GCS', 'R2', '배포'],
        'ai_development': ['Vertex AI', 'Imagen', 'Gemini', 'API'],
        'cost_optimization': ['비용', '절감', '무료', '0원'],
        'automation': ['자동화', 'Workers', 'Cron', '스크립트'],
        'business': ['인스타그램', '다인', 'DAIN', '셀럽', '비즈니스'],
        'education': ['BWYA', '아카데미', '강의', '교육']
    }
    
    found_topics = []
    for topic, keywords in topic_map.items():
        if any(kw in all_content for kw in keywords):
            found_topics.append(topic)
    
    return found_topics

# ========================================
# 3. 날짜별 요약 MD
# ========================================

def generate_daily_summary(sessions, output_file, period_name):
    """날짜별 요약 MD 생성"""
    
    md = f"""# 용아(Gemini) 세션 일별 요약 - {period_name}

> **생성일**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> **목적**: 빠른 맥락 파악용 요약본
> **중복 제거**: 적용됨

---

## 📊 통계

| 항목 | 값 |
|------|-----|
| 총 세션일 | {len(sessions)}일 |
| 총 대화 턴 | {sum(len(v) for v in sessions.values())}턴 |

---

"""
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        topics = extract_topics(entries)
        
        md += f"## 📅 {date}\n\n"
        md += f"**대화 턴**: {len(entries)}턴\n"
        md += f"**주요 토픽**: {', '.join(topics) if topics else 'N/A'}\n\n"
        
        if entries:
            first_content = entries[0]['content'][:300]
            md += f"### 시작\n> {first_content}...\n\n"
        
        md += "---\n\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 4. 핵심 인사이트 MD
# ========================================

def generate_insights_md(sessions, output_file, period_name):
    """핵심 인사이트 추출"""
    
    md = f"""# 용아(Gemini) 핵심 인사이트 - {period_name}

> **생성일**: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> **목적**: 전략적 의사결정 및 지식 자산화

---

## 📊 인사이트 분류

"""
    
    all_insights = {
        'strategy': [],
        'technical': [],
        'cost': [],
        'business': []
    }
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        
        for entry in entries:
            content = entry['content']
            
            if any(kw in content for kw in ['전략', '제언', '권고']):
                sentences = [s.strip() for s in content.split('.') if 50 < len(s) < 300]
                for sent in sentences[:1]:
                    if any(kw in sent for kw in ['전략', '제언', '권고']):
                        all_insights['strategy'].append({'date': date, 'content': sent})
            
            if any(kw in content for kw in ['API', 'Worker', 'Vertex']):
                sentences = [s.strip() for s in content.split('.') if 50 < len(s) < 300]
                for sent in sentences[:1]:
                    all_insights['technical'].append({'date': date, 'content': sent})
            
            if any(kw in content for kw in ['비용', '절감', '0원']):
                sentences = [s.strip() for s in content.split('.') if 30 < len(s) < 200]
                for sent in sentences[:1]:
                    all_insights['cost'].append({'date': date, 'content': sent})
    
    categories = {
        'strategy': ('🎯 전략적 제언', '용아의 전략적 판단과 권고'),
        'technical': ('⚙️ 기술적 인사이트', '아키텍처 및 기술 스택'),
        'cost': ('💰 비용 최적화', '비용 절감 관련')
    }
    
    for key, (title, desc) in categories.items():
        insights = all_insights[key]
        if insights:
            md += f"### {title}\n*{desc}*\n\n"
            
            seen = set()
            for ins in insights[:15]:
                if ins['content'] not in seen:
                    seen.add(ins['content'])
                    md += f"- [{ins['date']}] {ins['content']}\n"
            
            md += "\n---\n\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 메인 실행
# ========================================

if __name__ == '__main__':
    import sys
    
    base_input = '/Users/jeong-kyushin/Desktop/제미나이세션백업/total_input/'
    base_output = '/Users/jeong-kyushin/developer/monk_project /docs/saga/'
    
    # 2025년 12월 파일
    dec_files = [
        base_input + 'merge_20251228_001.txt',
        base_input + 'merge_20251228_002.txt',
        base_input + 'merge_20251228_003.txt',
        base_input + 'merge_20251228_004.txt',
        base_input + 'merge_20251228_005.txt',
    ]
    
    # 2026년 1월 초 파일
    jan_files = [
        base_input + 'merge_20260107_001.txt',
        base_input + 'merge_20260107_002.txt',
        base_input + 'merge_20260107_003.txt',
    ]
    
    # 전체 처리
    all_files = dec_files + jan_files
    
    print("🔄 Gemini 세션 배치 처리 시작...")
    print(f"   총 {len(all_files)}개 파일")
    
    print("\n📖 파일 파싱 중...")
    entries = parse_multiple_files(all_files)
    print(f"   ✅ 총 {len(entries)}개 엔트리 (중복 제거 완료)")
    
    sessions = group_by_date(entries)
    print(f"   ✅ {len(sessions)}일 세션으로 그룹핑")
    
    period_name = "2025-12 ~ 2026-01 초"
    
    # 1. JSON
    json_file = base_output + 'GEMINI_CORPUS_TOTAL.json'
    print(f"\n1️⃣ JSON 코퍼스 생성 중...")
    generate_json_corpus(sessions, json_file, period_name)
    print(f"   ✅ {json_file}")
    
    # 2. 요약
    summary_file = base_output + 'GEMINI_DAILY_SUMMARY_TOTAL.md'
    print(f"\n2️⃣ 날짜별 요약 생성 중...")
    generate_daily_summary(sessions, summary_file, period_name)
    print(f"   ✅ {summary_file}")
    
    # 3. 인사이트
    insights_file = base_output + 'GEMINI_INSIGHTS_TOTAL.md'
    print(f"\n3️⃣ 핵심 인사이트 생성 중...")
    generate_insights_md(sessions, insights_file, period_name)
    print(f"   ✅ {insights_file}")
    
    print("\n🎉 전체 배치 처리 완료!")
    print(f"\n📊 최종 통계:")
    print(f"   - 세션일: {len(sessions)}일")
    print(f"   - 대화 턴: {sum(len(v) for v in sessions.values())}턴")
    print(f"   - 기간: {min(sessions.keys())} ~ {max(sessions.keys())}")
