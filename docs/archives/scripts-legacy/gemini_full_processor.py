#!/usr/bin/env python3
"""
Gemini 세션 대화록 → JSON + 요약 + 인사이트 전체 변환기
작성: 쌍아 (Claude) for MONK Project
날짜: 2026-01-17

출력물:
1. JSON 스키마 (AI 학습용 코퍼스)
2. 날짜별 요약 MD
3. 핵심 인사이트 MD
"""

import re
import json
from datetime import datetime
from collections import defaultdict

# ========================================
# 1. 파싱 함수
# ========================================

def parse_gemini_session(input_file):
    """Gemini 대화록 파싱"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    timestamp_pattern = r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\.'
    
    sessions = defaultdict(list)
    lines = content.split('\n')
    current_block = []
    current_timestamp = None
    
    for line in lines:
        if line.strip() == '=' * 60 or 'SOURCE:' in line:
            continue
        
        ts_match = re.search(timestamp_pattern, line)
        if ts_match:
            if current_block and current_timestamp:
                date_key = current_timestamp[:10]
                sessions[date_key].append({
                    'timestamp': current_timestamp,
                    'content': '\n'.join(current_block).strip()
                })
            
            current_timestamp = ts_match.group(1)
            remaining = line[ts_match.end():].strip()
            current_block = [remaining] if remaining else []
        else:
            if line.strip():
                current_block.append(line)
    
    if current_block and current_timestamp:
        date_key = current_timestamp[:10]
        sessions[date_key].append({
            'timestamp': current_timestamp,
            'content': '\n'.join(current_block).strip()
        })
    
    return sessions

# ========================================
# 2. JSON 스키마 생성 (AI 학습용 코퍼스)
# ========================================

def generate_json_corpus(sessions, output_file):
    """JSON 스키마로 변환 - AI 학습용"""
    
    corpus = {
        "corpus_meta": {
            "source": "gemini_yonga",
            "period": "2026-01",
            "total_sessions": len(sessions),
            "total_turns": sum(len(v) for v in sessions.values()),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "created_by": "ssanga_claude"
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
            "key_decisions": extract_decisions(entries),
            "insights": extract_insights_from_entries(entries)
        }
        
        for i, entry in enumerate(entries, 1):
            # 발화자 추정 (용아 응답 vs 작가님 질문)
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
    elif any(kw in content for kw in ['?', '할까', '하시겠']):
        return "question"
    else:
        return "general"

def extract_keywords(content):
    """키워드 추출"""
    keywords = [
        'Cloudflare', 'Vertex AI', 'GCS', 'R2', 'D1', 'KV',
        'Workers', 'API', 'monk.kr', 'Imagen', 'Gemini',
        '가비아', '배포', '자동화', '토큰', '비용',
        '인스타그램', 'Meta', '다인', 'DAIN',
        'PDF', 'HWP', 'R&D', '디딤돌'
    ]
    found = [kw for kw in keywords if kw.lower() in content.lower()]
    return found[:5]  # 최대 5개

def extract_topics(entries):
    """세션의 주요 토픽"""
    all_content = ' '.join(e['content'] for e in entries)
    
    topic_map = {
        'infrastructure': ['Cloudflare', '가비아', 'GCS', 'R2', '배포'],
        'ai_development': ['Vertex AI', 'Imagen', 'Gemini', 'API'],
        'cost_optimization': ['비용', '절감', '무료', '0원'],
        'automation': ['자동화', 'Workers', 'Cron', '스크립트'],
        'business': ['인스타그램', '다인', 'DAIN', '셀럽', '비즈니스'],
        'documentation': ['PDF', 'HWP', 'R&D', '문서', '디딤돌']
    }
    
    found_topics = []
    for topic, keywords in topic_map.items():
        if any(kw in all_content for kw in keywords):
            found_topics.append(topic)
    
    return found_topics

def extract_decisions(entries):
    """의사결정 사항 추출"""
    decisions = []
    decision_patterns = [
        r'결정[했습니다|합니다|하겠습니다]',
        r'진행[하겠습니다|합니다]',
        r'확정',
        r'완료',
        r'해결'
    ]
    
    for entry in entries:
        content = entry['content']
        for pattern in decision_patterns:
            if re.search(pattern, content):
                # 문장 추출 (간단히)
                sentences = content.split('.')
                for sent in sentences:
                    if any(re.search(p, sent) for p in decision_patterns):
                        if len(sent) > 20 and len(sent) < 200:
                            decisions.append(sent.strip())
                            break
                break
    
    return decisions[:5]  # 최대 5개

def extract_insights_from_entries(entries):
    """인사이트 추출"""
    insights = []
    insight_markers = ['전략', '핵심', '중요', '결론', '판단', '제언', '권고']
    
    for entry in entries:
        content = entry['content']
        if any(marker in content for marker in insight_markers):
            sentences = content.split('.')
            for sent in sentences:
                if any(marker in sent for marker in insight_markers):
                    if 30 < len(sent) < 300:
                        insights.append(sent.strip())
    
    return list(set(insights))[:10]  # 중복 제거, 최대 10개

# ========================================
# 3. 날짜별 요약 MD 생성
# ========================================

def generate_daily_summary(sessions, output_file):
    """날짜별 요약 MD 생성"""
    
    md = """# 용아(Gemini) 세션 일별 요약 - 2026년 1월

> **생성일**: {}
> **목적**: 빠른 맥락 파악용 요약본

---

""".format(datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        topics = extract_topics(entries)
        
        md += f"## 📅 {date}\n\n"
        md += f"**대화 턴**: {len(entries)}턴\n"
        md += f"**주요 토픽**: {', '.join(topics) if topics else 'N/A'}\n\n"
        
        # 핵심 내용 추출 (첫 번째와 마지막 턴의 요약)
        if entries:
            first_content = entries[0]['content'][:300]
            md += f"### 시작\n> {first_content}...\n\n"
            
            if len(entries) > 1:
                last_content = entries[-1]['content'][:300]
                md += f"### 마무리\n> {last_content}...\n\n"
        
        # 의사결정 사항
        decisions = extract_decisions(entries)
        if decisions:
            md += "### ✅ 주요 결정사항\n"
            for d in decisions[:3]:
                md += f"- {d}\n"
            md += "\n"
        
        md += "---\n\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 4. 핵심 인사이트 MD 생성
# ========================================

def generate_insights_md(sessions, output_file):
    """핵심 인사이트만 별도 정리"""
    
    md = """# 용아(Gemini) 핵심 인사이트 모음 - 2026년 1월

> **생성일**: {}
> **목적**: 전략적 의사결정 및 지식 자산화
> **용도**: NotebookLM 학습, R&D 문서 참고

---

## 📊 인사이트 분류

""".format(datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    # 카테고리별 인사이트 수집
    all_insights = {
        'strategy': [],      # 전략적 제언
        'technical': [],     # 기술적 판단
        'cost': [],          # 비용 관련
        'business': [],      # 비즈니스 인사이트
        'quotes': []         # 작가님 핵심 발언
    }
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        
        for entry in entries:
            content = entry['content']
            timestamp = entry['timestamp']
            
            # 전략적 제언
            if any(kw in content for kw in ['전략', '제언', '권고', '판단']):
                sentences = [s.strip() for s in content.split('.') if len(s) > 50]
                for sent in sentences[:2]:
                    if any(kw in sent for kw in ['전략', '제언', '권고']):
                        all_insights['strategy'].append({
                            'date': date,
                            'content': sent
                        })
            
            # 기술적 판단
            if any(kw in content for kw in ['API', 'Worker', 'Vertex', '배포', '아키텍처']):
                sentences = [s.strip() for s in content.split('.') if len(s) > 50]
                for sent in sentences[:2]:
                    if any(kw in sent for kw in ['API', 'Worker', 'Vertex']):
                        all_insights['technical'].append({
                            'date': date,
                            'content': sent
                        })
            
            # 비용 관련
            if any(kw in content for kw in ['비용', '절감', '0원', '무료', '가격']):
                sentences = [s.strip() for s in content.split('.') if '원' in s or '비용' in s]
                for sent in sentences[:1]:
                    if len(sent) > 30:
                        all_insights['cost'].append({
                            'date': date,
                            'content': sent
                        })
            
            # 비즈니스 인사이트
            if any(kw in content for kw in ['비즈니스', '사업', '수익', '모델']):
                sentences = [s.strip() for s in content.split('.') if len(s) > 50]
                for sent in sentences[:1]:
                    all_insights['business'].append({
                        'date': date,
                        'content': sent
                    })
            
            # 작가님 핵심 발언 (짧고 임팩트 있는 문장)
            if len(content) < 200 and any(kw in content for kw in ['!', '?', '해결', '본질']):
                all_insights['quotes'].append({
                    'date': date,
                    'content': content[:150]
                })
    
    # MD 생성
    categories = {
        'strategy': ('🎯 전략적 제언', '용아의 전략적 판단과 권고'),
        'technical': ('⚙️ 기술적 인사이트', '아키텍처 및 기술 스택 관련'),
        'cost': ('💰 비용 최적화', '비용 절감 및 효율화 관련'),
        'business': ('📈 비즈니스 인사이트', '사업 전략 및 수익 모델'),
        'quotes': ('💬 작가님 핵심 발언', '의사결정의 근거가 된 발언들')
    }
    
    for key, (title, desc) in categories.items():
        insights = all_insights[key]
        if insights:
            md += f"### {title}\n"
            md += f"*{desc}*\n\n"
            
            # 중복 제거
            seen = set()
            unique_insights = []
            for ins in insights:
                if ins['content'] not in seen:
                    seen.add(ins['content'])
                    unique_insights.append(ins)
            
            for ins in unique_insights[:10]:  # 카테고리당 최대 10개
                md += f"- [{ins['date']}] {ins['content']}\n"
            
            md += "\n---\n\n"
    
    # 날짜별 핵심 요약 테이블
    md += """## 📅 날짜별 핵심 토픽

| 날짜 | 주요 토픽 | 턴 수 |
|------|----------|-------|
"""
    
    for date in sorted(sessions.keys()):
        entries = sessions[date]
        topics = extract_topics(entries)
        md += f"| {date} | {', '.join(topics[:3])} | {len(entries)} |\n"
    
    md += "\n---\n\n"
    md += "*본 문서는 쌍아(Claude)가 자동 생성했습니다.*\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return md

# ========================================
# 메인 실행
# ========================================

if __name__ == '__main__':
    import sys
    
    input_file = '/Users/jeong-kyushin/Desktop/제미나이세션백업/merge/2026년 1월~17일낮세션까지머거.txt'
    
    base_path = '/Users/jeong-kyushin/developer/monk_project /docs/saga/'
    
    print("🔄 Gemini 세션 파싱 중...")
    sessions = parse_gemini_session(input_file)
    
    print(f"📊 {len(sessions)}일, {sum(len(v) for v in sessions.values())}턴 파싱 완료")
    
    # 1. JSON 코퍼스
    json_file = base_path + 'GEMINI_CORPUS_202601.json'
    print(f"\n1️⃣ JSON 코퍼스 생성 중...")
    generate_json_corpus(sessions, json_file)
    print(f"   ✅ {json_file}")
    
    # 2. 날짜별 요약
    summary_file = base_path + 'GEMINI_DAILY_SUMMARY_202601.md'
    print(f"\n2️⃣ 날짜별 요약 생성 중...")
    generate_daily_summary(sessions, summary_file)
    print(f"   ✅ {summary_file}")
    
    # 3. 핵심 인사이트
    insights_file = base_path + 'GEMINI_INSIGHTS_202601.md'
    print(f"\n3️⃣ 핵심 인사이트 생성 중...")
    generate_insights_md(sessions, insights_file)
    print(f"   ✅ {insights_file}")
    
    print("\n🎉 전체 변환 완료!")
